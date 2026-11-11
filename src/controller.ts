
import type { Request, Response } from "express";

import {
    getAllUsersUseCase,
    getUserByIdUseCase,
    getUserByMobileUseCase,
    getUserByNameUseCase,
    registerUserUsecase,
    getUserByEmailUseCase,
    updateUserUseCase,
    deleteUserUseCase,
    loginUserUsecase,
    verifyRegisterOtpUsecase,
    forgetPasswordUsecase,
    resetPasswordUsecase,
    createUserByAdminUsecase,
    changeTemporaryPasswordUsecase,
} from "./usecase";

// Helper function for error messages
function getErrorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : "Internal server error";
}

// REGISTER FIRST ADMIN
export async function registeruser(req: Request, res: Response) {
    try {
        const { name, email, phoneNumber, password } = req.body ?? {};

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof phoneNumber !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !phoneNumber.trim() ||
            !password.trim()
        ) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters",
            });
        }

        const user = await registerUserUsecase({
            name,
            email,
            phoneNumber,
            password,
        });

        return res.status(201).json({
            message: user.message,
            email: email.trim().toLowerCase(),
        });
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Registration Error:", error);

        if (message === "Email already exists") {
            return res.status(409).json({ message });
        }

        if (
            message === "Public registration is closed" ||
            message.includes("Public registration is closed")
        ) {
            return res.status(403).json({ message });
        }

        if (message.includes("All fields are required") || message.includes("Password must")) {
            return res.status(400).json({ message });
        }

        return res.status(500).json({
            message: message || "Registration failed",
            error: message,
        });
    }
}

// VERIFY ADMIN REGISTER OTP
export async function verifyRegisterOtp(req: Request, res: Response) {
    try {
        const { email, otp } = req.body ?? {};

        if (
            typeof email !== "string" ||
            typeof otp !== "string" ||
            !email.trim() ||
            !otp.trim()
        ) {
            return res.status(400).json({
                message: "Email and OTP are required",
            });
        }

        const result = await verifyRegisterOtpUsecase(
            email.trim(),
            otp.trim()
        );

        return res.status(200).json(result);
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("OTP Verification Error:", error);

        return res.status(400).json({ message });
    }
}

// GET ALL USERS
export async function getAllUsers(req: Request, res: Response) {
    try {
        const users = await getAllUsersUseCase();

        return res.status(200).json({
            message: "Users fetched successfully",
            users,
        });
    } catch (error: unknown) {
        console.error("Get All Users Error:", error);

        return res.status(500).json({
            message: "Failed to fetch users",
        });
    }
}

// GET USER BY ID
export async function getUserById(
    req: Request<{ id: string }>,
    res: Response
) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: "User ID is required",
            });
        }

        const user = await getUserByIdUseCase(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            user,
        });
    } catch (error: unknown) {
        console.error("Get User By ID Error:", error);

        return res.status(500).json({
            message: "Failed to fetch user",
        });
    }
}

// GET USER BY NAME
export async function getUserByName(
    req: Request<{ name: string }>,
    res: Response
) {
    try {
        const { name } = req.params;

        if (!name) {
            return res.status(400).json({
                message: "User name is required",
            });
        }

        const users = await getUserByNameUseCase(name);

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "Users fetched successfully",
            users,
        });
    } catch (error: unknown) {
        console.error("Get User By Name Error:", error);

        return res.status(500).json({
            message: "Failed to fetch users",
        });
    }
}

// GET USER BY MOBILE
export async function getUserByMobile(
    req: Request<{ phoneNumber: string }>,
    res: Response
) {
    try {
        const { phoneNumber } = req.params;

        if (!phoneNumber) {
            return res.status(400).json({
                message: "Phone number is required",
            });
        }

        const user = await getUserByMobileUseCase(phoneNumber);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            user,
        });
    } catch (error: unknown) {
        console.error("Get User By Mobile Error:", error);

        return res.status(500).json({
            message: "Failed to fetch user",
        });
    }
}

// GET USER BY EMAIL
export async function getUserByEmail(
    req: Request<{ email: string }>,
    res: Response
) {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const user = await getUserByEmailUseCase(email);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            user,
        });
    } catch (error: unknown) {
        console.error("Get User By Email Error:", error);

        return res.status(500).json({
            message: "Failed to fetch user",
        });
    }
}

// UPDATE USER
export async function updateUser(
    req: Request<{ id: string }>,
    res: Response
) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: "User ID is required",
            });
        }

        // Validate UUID format to prevent PostgreSQL 'string_to_uuid' syntax error
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!isUUID) {
            return res.status(400).json({
                message: "Invalid User UUID format",
            });
        }

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body) ||
            Object.keys(req.body).length === 0
        ) {
            return res.status(400).json({
                message: "Update data is required",
            });
        }

        const user = await updateUserUseCase(id, req.body);

        return res.status(200).json({
            message: "User updated successfully",
            user,
        });
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Update User Error:", error);

        if (message === "User not found") {
            return res.status(404).json({ message });
        }

        if (message === "Email already exists") {
            return res.status(409).json({ message });
        }

        return res.status(500).json({
            message: "Failed to update user",
        });
    }
}

// DELETE USER
export async function deleteUser(
    req: Request<{ id: string }>,
    res: Response
) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: "User ID is required",
            });
        }

        const result = await deleteUserUseCase(id);

        return res.status(200).json({
            message: "User deleted successfully",
            result,
        });
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Delete User Error:", error);

        if (message === "User not found") {
            return res.status(404).json({ message });
        }

        return res.status(500).json({
            message: "Failed to delete user",
        });
    }
}

// LOGIN USER
export async function loginUser(req: Request, res: Response) {
    try {
        const { email, password } = req.body ?? {};

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password.trim()
        ) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const result = await loginUserUsecase(email, password);

        return res.status(200).json(result);
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Login Error:", error);

        if (message === "Invalid email or password") {
            return res.status(401).json({ message });
        }

        if (message === "Please verify your email before login") {
            return res.status(403).json({ message });
        }

        return res.status(500).json({
            message: "Login failed",
        });
    }
}

// FORGOT PASSWORD
export async function forgetPassword(req: Request, res: Response) {
    try {
        const { email } = req.body ?? {};

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const result = await forgetPasswordUsecase(email);

        return res.status(200).json(result);
    } catch (error: unknown) {
        console.error("Forgot Password Error:", error);

        return res.status(500).json({
            message: "Failed to process forgot password request",
        });
    }
}

// RESET PASSWORD
export async function resetPassword(req: Request, res: Response) {
    try {
        const { email, otp, newPassword } = req.body ?? {};

        if (
            typeof email !== "string" ||
            typeof otp !== "string" ||
            typeof newPassword !== "string" ||
            !email.trim() ||
            !otp.trim() ||
            !newPassword.trim()
        ) {
            return res.status(400).json({
                message: "Email, OTP and new password are required",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters",
            });
        }

        const result = await resetPasswordUsecase(
            email.trim(),
            otp.trim(),
            newPassword
        );

        return res.status(200).json(result);
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Reset Password Error:", error);

        if (
            message === "Invalid or expired OTP" ||
            message === "OTP expired" ||
            message === "OTP not found. Please request a new OTP" ||
            message === "Invalid OTP" ||
            message === "Too many incorrect attempts"
        ) {
            return res.status(400).json({ message });
        }

        return res.status(500).json({
            message: "Password reset failed",
        });
    }
}

// CREATE EMPLOYEE BY ADMIN
export async function createUserByAdmin(req: Request, res: Response) {
    try {
        const { name, email, phoneNumber } = req.body ?? {};

        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admin only",
            });
        }

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof phoneNumber !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !phoneNumber.trim()
        ) {
            return res.status(400).json({
                message: "Name, email and phone number are required",
            });
        }

        const result = await createUserByAdminUsecase(
            {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phoneNumber: phoneNumber.trim(),
            },
            req.user.role
        );

        return res.status(201).json({
            message: result.message,
            employee: result.employee,
        });
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Admin Create Employee Error:", error);

        if (message === "Email already exists") {
            return res.status(409).json({ message });
        }

        if (message === "Access denied. Admin only") {
            return res.status(403).json({ message });
        }

        if (message === "All fields are required") {
            return res.status(400).json({ message });
        }

        return res.status(500).json({
            message: "Failed to create employee",
            error: message,
        });
    }
}

// EMPLOYEE CHANGE TEMPORARY PASSWORD
export async function changeTemporaryPassword(
    req: Request,
    res: Response
) {
    try {
        const { currentPassword, newPassword } = req.body ?? {};

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            !currentPassword.trim() ||
            !newPassword.trim()
        ) {
            return res.status(400).json({
                message: "Current password and new password are required",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "New password must be at least 8 characters",
            });
        }

        if (!req.user?.userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const result = await changeTemporaryPasswordUsecase(
            req.user.userId,
            currentPassword,
            newPassword
        );

        return res.status(200).json(result);
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Change Temporary Password Error:", error);

        if (message === "Invalid current password") {
            return res.status(401).json({ message });
        }

        if (
            message === "User not found" ||
            message === "Employee does not need to change password" ||
            message.includes("User not found")
        ) {
            return res.status(404).json({ message });
        }

        return res.status(500).json({
            message: "Failed to change password",
            error: message,
        });
    }
}

// ================= CUSTOMER CONTROLLERS =================
export async function getCustomers(req: Request, res: Response) {
    try {
        const { getAllCustomersUseCase } = await import("./usecase");
        const customers = await getAllCustomersUseCase();
        return res.status(200).json({
            message: "Customers fetched successfully",
            customers,
        });
    } catch (error: unknown) {
        return res.status(500).json({
            message: "Failed to fetch customers",
            error: getErrorMessage(error),
        });
    }
}

export async function createCustomer(req: Request, res: Response) {
    try {
        const { createCustomerUseCase } = await import("./usecase");
        const customer = await createCustomerUseCase(req.body);
        return res.status(201).json({
            message: "Customer created successfully",
            customer,
        });
    } catch (error: unknown) {
        return res.status(400).json({
            message: "Failed to create customer",
            error: getErrorMessage(error),
        });
    }
}

export async function updateCustomer(req: Request<{ id: string }>, res: Response) {
    try {
        const { updateCustomerUseCase } = await import("./usecase");
        const customer = await updateCustomerUseCase(req.params.id, req.body);
        return res.status(200).json({
            message: "Customer updated successfully",
            customer,
        });
    } catch (error: unknown) {
        return res.status(400).json({
            message: "Failed to update customer",
            error: getErrorMessage(error),
        });
    }
}

export async function deleteCustomer(req: Request<{ id: string }>, res: Response) {
    try {
        const { deleteCustomerUseCase } = await import("./usecase");
        await deleteCustomerUseCase(req.params.id);
        return res.status(200).json({
            message: "Customer deleted successfully",
        });
    } catch (error: unknown) {
        return res.status(400).json({
            message: "Failed to delete customer",
            error: getErrorMessage(error),
        });
    }
}

// ================= DELIVERY CONTROLLERS =================
export async function getDeliveries(req: Request, res: Response) {
    try {
        const date = typeof req.query.date === "string" ? req.query.date : undefined;
        const { getDeliveriesUseCase } = await import("./usecase");
        const deliveries = await getDeliveriesUseCase(date);
        return res.status(200).json({
            message: "Deliveries fetched successfully",
            deliveries,
        });
    } catch (error: unknown) {
        return res.status(500).json({
            message: "Failed to fetch deliveries",
            error: getErrorMessage(error),
        });
    }
}

export async function createDelivery(req: Request, res: Response) {
    try {
        const { createDeliveryUseCase } = await import("./usecase");
        const delivery = await createDeliveryUseCase(req.body);
        return res.status(201).json({
            message: "Delivery recorded successfully",
            delivery,
        });
    } catch (error: unknown) {
        return res.status(400).json({
            message: "Failed to record delivery",
            error: getErrorMessage(error),
        });
    }
}

// ================= PAYMENT CONTROLLERS =================
export async function getPayments(req: Request, res: Response) {
    try {
        const { getPaymentsUseCase } = await import("./usecase");
        const payments = await getPaymentsUseCase();
        return res.status(200).json({
            message: "Payments fetched successfully",
            payments,
        });
    } catch (error: unknown) {
        return res.status(500).json({
            message: "Failed to fetch payments",
            error: getErrorMessage(error),
        });
    }
}

export async function createPayment(req: Request, res: Response) {
    try {
        const { createPaymentUseCase } = await import("./usecase");
        const payment = await createPaymentUseCase(req.body);
        return res.status(201).json({
            message: "Payment recorded successfully",
            payment,
        });
    } catch (error: unknown) {
        return res.status(400).json({
            message: "Failed to record payment",
            error: getErrorMessage(error),
        });
    }
}

// ================= PRICE CONTROLLERS =================
export async function getPrices(req: Request, res: Response) {
    try {
        const { getPricesUseCase } = await import("./usecase");
        const prices = await getPricesUseCase();
        return res.status(200).json({
            message: "Prices fetched successfully",
            prices,
        });
    } catch (error: unknown) {
        return res.status(500).json({
            message: "Failed to fetch prices",
            error: getErrorMessage(error),
        });
    }
}

export async function createPrice(req: Request, res: Response) {
    try {
        const { createPriceUseCase } = await import("./usecase");
        const price = await createPriceUseCase(req.body);
        return res.status(201).json({
            message: "Price saved successfully",
            price,
        });
    } catch (error: unknown) {
        return res.status(400).json({
            message: "Failed to save price",
            error: getErrorMessage(error),
        });
    }
}

// ================= ATTENDANCE CONTROLLERS =================
export async function getAttendance(req: Request, res: Response) {
    try {
        const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;
        const { getAttendanceUseCase } = await import("./usecase");
        const attendance = await getAttendanceUseCase(dateParam);
        return res.status(200).json({
            message: "Attendance fetched successfully",
            attendance,
        });
    } catch (error: unknown) {
        return res.status(500).json({
            message: "Failed to fetch attendance",
            error: getErrorMessage(error),
        });
    }
}

export async function recordAttendance(req: Request, res: Response) {
    try {
        const { recordAttendanceUseCase } = await import("./usecase");
        const attendance = await recordAttendanceUseCase(req.body);
        return res.status(200).json({
            message: "Attendance recorded successfully",
            attendance,
        });
    } catch (error: unknown) {
        return res.status(400).json({
            message: "Failed to record attendance",
            error: getErrorMessage(error),
        });
    }
}
