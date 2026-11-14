import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
    createTenantRepository,
} from "./repositories";

import {
    randomInt,
    createHash,
    randomBytes,
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
    dairyName?: string | undefined;
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

// GENERATE 6 DIGIT OTP
function generateOtp(): string {
    return randomInt(100000, 1000000).toString();
}

// HASH OTP FOR STORAGE
function hashOtp(otp: string): string {
    const secret = process.env.OTP_SECRET;

    if (!secret) {
        throw new Error("OTP_SECRET is missing");
    }

    return createHash("sha256")
        .update(otp + secret)
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

    if (new Date() > otpRecord.expiresAt) {
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

    const hashedInputOtp = hashOtp(otp);

    if (hashedInputOtp !== otpRecord.otpHash) {
        await updateOtpRepository(otpRecord.id, {
            attempts: otpRecord.attempts + 1,
        });

        throw new Error("Invalid OTP");
    }

    await updateOtpRepository(otpRecord.id, {
        isUsed: true,
    });
}

// REGISTER FIRST ADMIN (CREATES A NEW TENANT / DAIRY ORGANIZATION)
export async function registerUserUsecase(
    data: RegisterUserInput
) {
    const name = data.name.trim();
    const dairyName = (data.dairyName || `${name}'s Dairy`).trim();
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

    // Create a Tenant for this new Admin's Dairy Business
    const tenant = await createTenantRepository(dairyName, email);

    // Hash Admin password
    const hashedPassword = await bcrypt.hash(
        data.password,
        10
    );

    // Create Admin account attached to the Tenant
    await createuserRepository({
        tenantId: tenant.id,
        dairyName: dairyName,
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

// ADMIN CREATES EMPLOYEE (INHERITS ADMIN'S TENANT)
export async function createUserByAdminUsecase(
    data: AdminCreateUserInput,
    createdByRole: UserRole,
    adminTenantId?: string,
    adminDairyName?: string
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
    const existingUser = await findUserByEmailRepository(email);

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

    // Create verified Employee account within the Admin's Tenant
    const employee = await createuserRepository({
        tenantId: adminTenantId,
        dairyName: adminDairyName,
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
            tenantId: employee.tenantId,
        },
    };
}

// GET ALL USERS (SCOPED TO TENANT)
export async function getAllUsersUseCase(tenantId?: string) {
    return getAllUserRepository(tenantId);
}

// GET USER BY ID
export async function getUserByIdUseCase(id: string) {
    return findUserByIdRepository(id);
}

// GET USER BY NAME
export async function getUserByNameUseCase(name: string, tenantId?: string) {
    return findUserByNameRepository(name, tenantId);
}

// GET USER BY MOBILE
export async function getUserByMobileUseCase(
    phoneNumber: string,
    tenantId?: string
) {
    return findUserByMobileRepository(phoneNumber, tenantId);
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

            updateData.email = email;
        }
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

// VERIFY REGISTER OTP
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

    await verifyOtp(normalizedEmail, otp, "register");

    const updatedUser = await updateUserRepository(
        user.id,
        {
            isVerified: true,
        }
    );

    if (!updatedUser || !updatedUser.isVerified) {
        throw new Error("Email verification update failed");
    }

    return {
        message: "Email verified successfully. You can now login",
    };
}

// FORGOT PASSWORD
export async function forgetPasswordUsecase(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await findUserByEmailRepository(
        normalizedEmail
    );

    if (!user) {
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
        message: "Password reset successfully. You can now login with your new password",
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

    const fullUser = await findUserByEmailRepository(
        user.email
    );

    if (!fullUser) {
        throw new Error("User not found");
    }

    const isPasswordValid = await bcrypt.compare(
        currentPassword,
        fullUser.password
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
        message: "Password changed successfully. You can now use your new password",
    };
}

// LOGIN USER (RETURNS TOKEN WITH TENANT DETAILS)
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
            tenantId: user.tenantId,
            dairyName: user.dairyName,
        },
        jwtSecret,
        {
            expiresIn: "1d",
        }
    );

    return {
        message: "Login successful",
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            tenantId: user.tenantId,
            dairyName: user.dairyName,
            mustChangePassword: user.mustChangePassword,
        },
    };
}

// ================= CUSTOMER USECASES (TENANT SCOPED) =================
export async function createCustomerUseCase(data: any, tenantId?: string) {
    if (!data.name || !data.phone) {
        throw new Error("Customer name and phone are required");
    }
    const { createCustomerRepository } = await import("./repositories");
    return createCustomerRepository({ ...data, tenantId });
}

export async function getAllCustomersUseCase(tenantId?: string) {
    const { getAllCustomersRepository } = await import("./repositories");
    return getAllCustomersRepository(tenantId);
}

export async function getCustomerByIdUseCase(id: string, tenantId?: string) {
    const { findCustomerByIdRepository } = await import("./repositories");
    const customer = await findCustomerByIdRepository(id, tenantId);
    if (!customer) throw new Error("Customer not found");
    return customer;
}

export async function updateCustomerUseCase(id: string, data: any, tenantId?: string) {
    const { updateCustomerRepository } = await import("./repositories");
    const updated = await updateCustomerRepository(id, data, tenantId);
    if (!updated) throw new Error("Customer not found");
    return updated;
}

export async function deleteCustomerUseCase(id: string, tenantId?: string) {
    const { deleteCustomerRepository } = await import("./repositories");
    return deleteCustomerRepository(id, tenantId);
}

// ================= DELIVERY USECASES (TENANT SCOPED) =================
export async function createDeliveryUseCase(data: any, tenantId?: string) {
    const { createDeliveryRepository } = await import("./repositories");
    return createDeliveryRepository({ ...data, tenantId });
}

export async function getDeliveriesUseCase(date?: string, tenantId?: string) {
    const { getDeliveriesByDateRepository, getAllDeliveriesRepository } = await import("./repositories");
    if (date) {
        return getDeliveriesByDateRepository(date, tenantId);
    }
    return getAllDeliveriesRepository(tenantId);
}

// ================= PAYMENT USECASES (TENANT SCOPED) =================
export async function createPaymentUseCase(data: any, tenantId?: string) {
    const { createPaymentRepository } = await import("./repositories");
    return createPaymentRepository({ ...data, tenantId });
}

export async function getPaymentsUseCase(tenantId?: string) {
    const { getAllPaymentsRepository } = await import("./repositories");
    return getAllPaymentsRepository(tenantId);
}

// ================= PRICE USECASES (TENANT SCOPED) =================
export async function createPriceUseCase(data: any, tenantId?: string) {
    const { createPriceRepository } = await import("./repositories");
    return createPriceRepository({ ...data, tenantId });
}

export async function getPricesUseCase(tenantId?: string) {
    const { getAllPricesRepository } = await import("./repositories");
    return getAllPricesRepository(tenantId);
}

// ================= ATTENDANCE USECASES (TENANT SCOPED) =================
export async function recordAttendanceUseCase(data: any, tenantId?: string) {
    const { recordAttendanceRepository } = await import("./repositories");
    return recordAttendanceRepository({ ...data, tenantId });
}

export async function getAttendanceUseCase(date?: string, tenantId?: string) {
    const { getAttendanceByDateRepository } = await import("./repositories");
    let targetDate: string = new Date().toISOString().split("T")[0]!;
    if (date && typeof date === "string" && date.trim().length > 0) {
        targetDate = date.trim();
    }
    return getAttendanceByDateRepository(targetDate, tenantId);
}

