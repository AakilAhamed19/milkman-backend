
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
} from "./usecase";

// Helper function for error messages
function getErrorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : "Internal server error";
}

// REGISTER USER
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

        if (
            message === "Email already exists" ||
            message === "User with this mobile number already exists"
        ) {
            return res.status(409).json({ message });
        }

        return res.status(500).json({
            message: "Registration failed",
            error: message,
        });
    }
}

// VERIFY REGISTER OTP
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

        return res.status(400).json({
            message,
        });
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

        if (
            typeof email !== "string" ||
            !email.trim()
        ) {
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
