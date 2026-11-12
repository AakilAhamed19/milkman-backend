
import {
    createuserRepository,
    findUserByEmailRepository,
    findUserByIdRepository,
    findUserByNameRepository,
    findUserByMobileRepository,
    getAllUserRepository,
    updateUserRepository,
    deleteuserRepository,
    countAdminUsersRepository,
    createOtpRepository,
    findLatestOtpRepository,
    updateOtpRepository,
    invalidateOtpsRepository,
} from "./repositories";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
    randomInt,
    randomBytes,
    createHmac,
    timingSafeEqual,
} from "crypto";

import {
    sendOtpEmail,
    sendEmployeeCredentialsEmail,
} from "./services/email.service";

type OtpPurpose = "register" | "reset_password";
type UserRole = "admin" | "employee";

// INPUT TYPES

export interface RegisterUserInput {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
}

export interface AdminCreateUserInput {
    name: string;
    email: string;
    phoneNumber: string;
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

    await invalidateOtpsRepository(email, purpose);

    const otpRecord = await createOtpRepository({
        email,
        otpHash: hashOtp(otp),
        purpose,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
        isUsed: false,
    });

    try {
        await sendOtpEmail(email, otp);
    } catch (error) {
        await updateOtpRepository(otpRecord.id, {
            isUsed: true,
        });

        console.error("OTP Email Error:", error);

        throw new Error(`Unable to send OTP email: ${error instanceof Error ? error.message : String(error)}`);
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

    if (!otpRecord || otpRecord.isUsed) {
        throw new Error(
            "OTP not found or already used. Please request a new OTP"
        );
    }

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
        await updateOtpRepository(otpRecord.id, {
            isUsed: true,
        });

        throw new Error("OTP expired");
    }

    if (otpRecord.attempts >= 5) {
        await updateOtpRepository(otpRecord.id, {
            isUsed: true,
        });

        throw new Error("Too many incorrect attempts");
    }

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

    await updateOtpRepository(otpRecord.id, {
        isUsed: true,
    });
}

// REGISTER FIRST ADMIN

export async function registerUserUsecase(
    data: RegisterUserInput
) {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const phoneNumber = data.phoneNumber.trim();

    if (!name || !email || !phoneNumber || !data.password) {
        throw new Error("All fields are required");
    }

    if (data.password.length < 8) {
        throw new Error("Password must contain at least 8 characters");
    }

    // Check if an account with this email already exists
    const existingUser = await findUserByEmailRepository(email);

    if (existingUser) {
        if (existingUser.isVerified) {
            throw new Error("Email already exists");
        }

        // Resend OTP if account is not yet verified
        await sendAndSaveOtp(email, "register");

        return {
            message: "New OTP sent to your email",
        };
    }

    // Hash Admin password
    const hashedPassword = await bcrypt.hash(
        data.password,
        10
    );

    // Create Admin account (role = "admin")
    await createuserRepository({
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        role: "admin",
        isVerified: false,
        mustChangePassword: false,
    });

    // Send Admin OTP
    await sendAndSaveOtp(email, "register");

    return {
        message: "Admin registered successfully. OTP sent to your email",
    };
}

// ADMIN CREATES EMPLOYEE

export async function createUserByAdminUsecase(
    data: AdminCreateUserInput,
    createdByRole: UserRole
) {
    // Only Admin can create Employees
    if (createdByRole !== "admin") {
        throw new Error(
            "Access denied. Only Admin can create employees"
        );
    }

    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const phoneNumber = data.phoneNumber.trim();

    if (!name || !email || !phoneNumber) {
        throw new Error("All fields are required");
    }

    // Check duplicate email
    const existingUser =
        await findUserByEmailRepository(email);

    if (existingUser) {
        throw new Error("Email already exists");
    }

    // Generate temporary password
    const temporaryPassword = randomBytes(12).toString("base64url");

    // Hash temporary password
    const hashedPassword = await bcrypt.hash(
        temporaryPassword,
        10
    );

    // Create verified Employee account
    const employee = await createuserRepository({
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        role: "employee",
        isVerified: true,
        mustChangePassword: true,
    });

    try {
        // Send employee login credentials
        await sendEmployeeCredentialsEmail(
            name,
            email,
            temporaryPassword
        );
    } catch (error) {
        // Delete employee if credentials email fails
        await deleteuserRepository(employee.id);

        console.error("Employee Email Error:", error);

        throw new Error(
            "Employee account could not be created because the login email failed to send"
        );
    }

    return {
        message: "Employee created successfully. Login credentials sent to employee email",
        employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            phoneNumber: employee.phoneNumber,
            role: employee.role,
            isVerified: employee.isVerified,
            mustChangePassword: employee.mustChangePassword,
        },
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

// VERIFY ADMIN REGISTRATION OTP

export async function verifyRegisterOtpUsecase(
    email: string,
    otp: string
) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await findUserByEmailRepository(
        normalizedEmail
    );

    if (!user) {
        throw new Error("User not found");
    }

    if (user.role !== "admin") {
        throw new Error("Registration OTP is only for Admin");
    }

    if (user.isVerified) {
        throw new Error("Email already verified");
    }

    await verifyOtp(
        normalizedEmail,
        otp,
        "register"
    );

    await updateUserRepository(user.id, {
        isVerified: true,
        mustChangePassword: false,
    });

    const updatedUser = await findUserByEmailRepository(
        normalizedEmail
    );

    if (!updatedUser || !updatedUser.isVerified) {
        throw new Error("Email verification update failed");
    }

    return {
        message: "Admin email verified successfully",
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

    if (!newPassword || newPassword.length < 8) {
        throw new Error("Password must contain at least 8 characters");
    }

    const user = await findUserByEmailRepository(
        normalizedEmail
    );

    if (!user || !user.isVerified) {
        throw new Error("Invalid or expired OTP");
    }

    await verifyOtp(
        normalizedEmail,
        otp,
        "reset_password"
    );

    const hashedPassword = await bcrypt.hash(
        newPassword,
        10
    );

    await updateUserRepository(user.id, {
        password: hashedPassword,
        mustChangePassword: false,
    });

    return {
        message: "Password reset successfully",
    };
}

// CHANGE EMPLOYEE TEMPORARY PASSWORD

export async function changeTemporaryPasswordUsecase(
    userId: string,
    currentPassword: string,
    newPassword: string
) {
    if (!currentPassword || !newPassword) {
        throw new Error("Both passwords are required");
    }

    if (newPassword.length < 8) {
        throw new Error(
            "New password must contain at least 8 characters"
        );
    }

    if (currentPassword === newPassword) {
        throw new Error(
            "New password must be different from temporary password"
        );
    }

    const user = await findUserByIdRepository(userId);

    if (!user) {
        throw new Error("User not found");
    }

    if (user.role !== "employee") {
        throw new Error("This operation is only for employees");
    }

    if (!user.mustChangePassword) {
        throw new Error("Temporary password change is not required");
    }

    const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(
        newPassword,
        10
    );

    await updateUserRepository(userId, {
        password: hashedPassword,
        mustChangePassword: false,
    });

    return {
        message: "Password changed successfully",
    };
}

// LOGIN USER

export async function loginUserUsecase(
    email: string,
    password: string
) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await findUserByEmailRepository(
        normalizedEmail
    );

    if (!user) {
        console.log(`[LOGIN_DEBUG] User not found for email: '${normalizedEmail}'`);
        throw new Error("Invalid email or password");
    }

    if (!user.isVerified) {
        console.log(`[LOGIN_DEBUG] User '${normalizedEmail}' exists but isVerified is false`);
        throw new Error("Please verify your email before login");
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        console.log(`[LOGIN_DEBUG] Password mismatch for user '${normalizedEmail}'`);
        throw new Error("Invalid email or password");
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error("JWT_SECRET is missing");
    }

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

    const { password: _, ...safeUser } = user;

    return {
        message: "Login successful",
        token,
        user: safeUser,
        mustChangePassword: user.mustChangePassword,
    };
}

// ================= CUSTOMER USECASES =================
export async function createCustomerUseCase(data: any) {
    if (!data.name || !data.phone) {
        throw new Error("Customer name and phone are required");
    }
    const { createCustomerRepository } = await import("./repositories");
    return createCustomerRepository(data);
}

export async function getAllCustomersUseCase() {
    const { getAllCustomersRepository } = await import("./repositories");
    return getAllCustomersRepository();
}

export async function getCustomerByIdUseCase(id: string) {
    const { findCustomerByIdRepository } = await import("./repositories");
    const customer = await findCustomerByIdRepository(id);
    if (!customer) throw new Error("Customer not found");
    return customer;
}

export async function updateCustomerUseCase(id: string, data: any) {
    const { updateCustomerRepository } = await import("./repositories");
    const updated = await updateCustomerRepository(id, data);
    if (!updated) throw new Error("Customer not found");
    return updated;
}

export async function deleteCustomerUseCase(id: string) {
    const { deleteCustomerRepository } = await import("./repositories");
    return deleteCustomerRepository(id);
}

// ================= DELIVERY USECASES =================
export async function createDeliveryUseCase(data: any) {
    const { createDeliveryRepository } = await import("./repositories");
    return createDeliveryRepository(data);
}

export async function getDeliveriesUseCase(date?: string) {
    const { getDeliveriesByDateRepository, getAllDeliveriesRepository } = await import("./repositories");
    if (date) {
        return getDeliveriesByDateRepository(date);
    }
    return getAllDeliveriesRepository();
}

// ================= PAYMENT USECASES =================
export async function createPaymentUseCase(data: any) {
    const { createPaymentRepository } = await import("./repositories");
    return createPaymentRepository(data);
}

export async function getPaymentsUseCase() {
    const { getAllPaymentsRepository } = await import("./repositories");
    return getAllPaymentsRepository();
}

// ================= PRICE USECASES =================
export async function createPriceUseCase(data: any) {
    const { createPriceRepository } = await import("./repositories");
    return createPriceRepository(data);
}

export async function getPricesUseCase() {
    const { getAllPricesRepository } = await import("./repositories");
    return getAllPricesRepository();
}

// ================= ATTENDANCE USECASES =================
export async function recordAttendanceUseCase(data: any) {
    const { recordAttendanceRepository } = await import("./repositories");
    return recordAttendanceRepository(data);
}

export async function getAttendanceUseCase(date?: string) {
    const { getAttendanceByDateRepository } = await import("./repositories");
    let targetDate: string = new Date().toISOString().split("T")[0]!;
    if (date && typeof date === "string" && date.trim().length > 0) {
        targetDate = date.trim();
    }
    return getAttendanceByDateRepository(targetDate);
}


