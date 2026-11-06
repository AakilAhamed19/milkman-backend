
import {
    createuserRepository,
    findUserByEmailRepository,
    findUserByIdRepository,
    findUserByNameRepository,
    findUserByMobileRepository,
    getAllUserRepository,
    updateUserRepository,
    deleteuserRepository,
    createOtpRepository,
    findLatestOtpRepository,
    updateOtpRepository,
    invalidateOtpsRepository,
} from "./repositories";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
    randomInt,
    createHmac,
    timingSafeEqual,
} from "crypto";

import { sendOtpEmail } from "./services/email.service";

type OtpPurpose = "register" | "reset_password";

// INPUT TYPES
export interface RegisterUserInput {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    phoneNumber?: string;
}

// GENERATE OTP
function generateOtp(): string {
    return randomInt(100000, 1000000).toString();
}

// HASH OTP
function hashOtp(otp: string): string {
    const secret = process.env.OTP_SECRET;

    if (!secret) {
        throw new Error("OTP_SECRET is missing");
    }

    return createHmac("sha256", secret)
        .update(otp)
        .digest("hex");
}

// SAVE OTP AND SEND EMAIL
async function sendAndSaveOtp(
    email: string,
    purpose: OtpPurpose
) {
    const otp = generateOtp();

    // Invalidate previous OTPs
    await invalidateOtpsRepository(email, purpose);

    // Save new OTP
    const otpRecord = await createOtpRepository({
        email,
        otpHash: hashOtp(otp),
        purpose,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
        isUsed: false,
    });

    // Send OTP email
    try {
        await sendOtpEmail(email, otp);
    } catch (error) {
        await updateOtpRepository(otpRecord.id, {
            isUsed: true,
        });

        console.error("OTP Email Error:", error);

        throw new Error(
            "Unable to send OTP email. Please try again"
        );
    }
}

// VERIFY OTP
async function verifyOtp(
    email: string,
    otp: string,
    purpose: OtpPurpose
) {
    if (!/^\d{6}$/.test(otp)) {
        throw new Error("OTP must contain exactly 6 digits");
    }

    const otpRecord = await findLatestOtpRepository(
        email,
        purpose
    );

    if (!otpRecord) {
        throw new Error(
            "OTP not found. Please request a new OTP"
        );
    }

    // Check expiry
    if (otpRecord.expiresAt.getTime() <= Date.now()) {
        await updateOtpRepository(otpRecord.id, {
            isUsed: true,
        });

        throw new Error("OTP expired");
    }

    // Check maximum attempts
    if (otpRecord.attempts >= 5) {
        await updateOtpRepository(otpRecord.id, {
            isUsed: true,
        });

        throw new Error("Too many incorrect attempts");
    }

    // Compare OTP hashes
    const storedHash = Buffer.from(
        otpRecord.otpHash,
        "hex"
    );

    const submittedHash = Buffer.from(
        hashOtp(otp),
        "hex"
    );

    if (
        storedHash.length !== submittedHash.length ||
        !timingSafeEqual(storedHash, submittedHash)
    ) {
        const attempts = otpRecord.attempts + 1;

        await updateOtpRepository(otpRecord.id, {
            attempts,
            ...(attempts >= 5 ? { isUsed: true } : {}),
        });

        throw new Error("Invalid OTP");
    }

    // OTP is correct - mark as used
    await updateOtpRepository(otpRecord.id, {
        isUsed: true,
    });
}

// REGISTER USER
export async function registerUserUsecase(
    data: RegisterUserInput
) {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const phoneNumber = data.phoneNumber.trim();

    const existingUser =
        await findUserByEmailRepository(email);

    if (existingUser) {
        if (existingUser.isVerified) {
            throw new Error("Email already exists");
        }

        // Resend OTP for unverified account
        await sendAndSaveOtp(email, "register");

        return {
            message: "New OTP sent to your email",
        };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
        data.password,
        10
    );

    // Create user
    await createuserRepository({
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        role: "employee",
        isVerified: false,
    });

    // Send registration OTP
    await sendAndSaveOtp(email, "register");

    return {
        message: "User registered successfully. OTP sent to your email",
    };
}

// GET ALL USERS
export async function getAllUsersUseCase() {
    return getAllUserRepository();
}

// GET USER BY ID
export async function getUserByIdUseCase(id: string) {
    return findUserByIdRepository(id);
}

// GET USER BY NAME
export async function getUserByNameUseCase(name: string) {
    return findUserByNameRepository(name);
}

// GET USER BY MOBILE
export async function getUserByMobileUseCase(
    phoneNumber: string
) {
    return findUserByMobileRepository(phoneNumber);
}

// GET USER BY EMAIL
export async function getUserByEmailUseCase(
    email: string
) {
    const user = await findUserByEmailRepository(
        email.trim().toLowerCase()
    );

    if (!user) {
        return null;
    }

    const { password, ...safeUser } = user;

    return safeUser;
}

// UPDATE USER
export async function updateUserUseCase(
    id: string,
    data: UpdateUserInput
) {
    const user = await findUserByIdRepository(id);

    if (!user) {
        throw new Error("User not found");
    }

    const updateData: UpdateUserInput = {};

    if (data.name !== undefined) {
        const name = data.name.trim();

        if (!name) {
            throw new Error("Name cannot be empty");
        }

        updateData.name = name;
    }

    if (data.email !== undefined) {
        const email = data.email.trim().toLowerCase();

        if (!email) {
            throw new Error("Email cannot be empty");
        }

        if (email !== user.email) {
            const existingUser =
                await findUserByEmailRepository(email);

            if (existingUser) {
                throw new Error("Email already exists");
            }
        }

        updateData.email = email;
    }

    if (data.phoneNumber !== undefined) {
        const phoneNumber = data.phoneNumber.trim();

        if (!phoneNumber) {
            throw new Error("Phone number cannot be empty");
        }

        updateData.phoneNumber = phoneNumber;
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error("No valid fields provided for update");
    }

    return updateUserRepository(id, updateData);
}

// DELETE USER
export async function deleteUserUseCase(id: string) {
    const user = await findUserByIdRepository(id);

    if (!user) {
        throw new Error("User not found");
    }

    await deleteuserRepository(id);

    return {
        message: "User deleted successfully",
    };
}

// VERIFY REGISTRATION OTP
export async function verifyRegisterOtpUsecase(
    email: string,
    otp: string
) {
    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await findUserByEmailRepository(
        normalizedEmail
    );

    if (!user) {
        throw new Error("User not found");
    }

    if (user.isVerified) {
        throw new Error("Email already verified");
    }

    // Verify OTP
    await verifyOtp(
        normalizedEmail,
        otp,
        "register"
    );

    // Update user verification status
    await updateUserRepository(user.id, {
        isVerified: true,
    });

    // Fetch updated user
    const updatedUser = await findUserByEmailRepository(
        normalizedEmail
    );

    // Confirm database update
    if (!updatedUser || !updatedUser.isVerified) {
        throw new Error("Email verification update failed");
    }

    return {
        message: "Email verified successfully",
    };
}

// FORGOT PASSWORD
export async function forgetPasswordUsecase(
    email: string
) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await findUserByEmailRepository(
        normalizedEmail
    );

    if (!user || !user.isVerified) {
        return {
            message: "If your account exists, a reset OTP will be sent",
        };
    }

    await sendAndSaveOtp(
        normalizedEmail,
        "reset_password"
    );

    return {
        message: "If your account exists, a reset OTP will be sent",
    };
}

// RESET PASSWORD
export async function resetPasswordUsecase(
    email: string,
    otp: string,
    newPassword: string
) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await findUserByEmailRepository(
        normalizedEmail
    );

    if (!user || !user.isVerified) {
        throw new Error("Invalid or expired OTP");
    }

    // Verify reset OTP
    await verifyOtp(
        normalizedEmail,
        otp,
        "reset_password"
    );

    // Hash new password
    const hashedPassword = await bcrypt.hash(
        newPassword,
        10
    );

    // Update password
    await updateUserRepository(user.id, {
        password: hashedPassword,
    });

    return {
        message: "Password reset successfully",
    };
}

// LOGIN USER
export async function loginUserUsecase(
    email: string,
    password: string
) {
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await findUserByEmailRepository(
        normalizedEmail
    );

    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Check email verification
    if (!user.isVerified) {
        throw new Error("Please verify your email before login");
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // Check JWT secret
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error("JWT_SECRET is missing");
    }

    // Generate JWT token
    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role,
        },
        jwtSecret,
        {
            expiresIn: "1d",
        }
    );

    // Remove password from response
    const { password: _, ...safeUser } = user;

    return {
        message: "Login successful",
        token,
        user: safeUser,
    };
}
