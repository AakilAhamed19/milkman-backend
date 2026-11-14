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
    getFarmDetailsUseCase,
    updateFarmDetailsUseCase,
} from "./usecase";

// Helper function for error messages
function getErrorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : "Internal server error";
}

// REGISTER FIRST ADMIN (CREATES FARM ORGANIZATION)
export async function registeruser(req: Request, res: Response) {
    try {
        const { name, farmName, dairyName, email, phoneNumber, password } = req.body ?? {};

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

        const farm = typeof farmName === "string" && farmName.trim() ? farmName : (typeof dairyName === "string" ? dairyName : undefined);

        const user = await registerUserUsecase({
            name,
            farmName: farm,
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

// ================= FARM DETAILS CONTROLLERS =================
export async function getFarmDetails(req: Request, res: Response) {
    try {
        const farmId = req.user?.farmId;
        if (!farmId) {
            return res.status(400).json({ message: "No farm associated with this user" });
        }
        const farm = await getFarmDetailsUseCase(farmId);
        return res.status(200).json({
            message: "Farm details fetched successfully",
            farm,
        });
    } catch (error: unknown) {
        return res.status(500).json({
            message: "Failed to fetch farm details",
            error: getErrorMessage(error),
        });
    }
}

export async function updateFarmDetails(req: Request, res: Response) {
    try {
        const farmId = req.user?.farmId;
        if (!farmId) {
            return res.status(400).json({ message: "No farm associated with this user" });
        }
        const updated = await updateFarmDetailsUseCase(farmId, req.body);
        return res.status(200).json({
            message: "Farm details updated successfully",
            farm: updated,
        });
    } catch (error: unknown) {
        return res.status(400).json({
            message: "Failed to update farm details",
            error: getErrorMessage(error),
        });
    }
}

// GET ALL USERS (SCOPED TO FARM)
export async function getAllUsers(req: Request, res: Response) {
    try {
        const farmId = req.user?.farmId;
        const users = await getAllUsersUseCase(farmId);

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

        const farmId = req.user?.farmId;
        const users = await getUserByNameUseCase(name, farmId);

        return res.status(200).json({
            message: "Users fetched successfully",
            users,
        });
    } catch (error: unknown) {
        console.error("Get User By Name Error:", error);

        return res.status(500).json({
            message: "Failed to fetch user",
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

        const farmId = req.user?.farmId;
        const user = await getUserByMobileUseCase(phoneNumber, farmId);

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

        const { name, email, phoneNumber } = req.body ?? {};

        if (
            name === undefined &&
            email === undefined &&
            phoneNumber === undefined
        ) {
            return res.status(400).json({
                message: "At least one field (name, email, phoneNumber) is required to update",
            });
        }

        const updatedUser = await updateUserUseCase(id, {
            name,
            email,
            phoneNumber,
        });

        return res.status(200).json({
            message: "User updated successfully",
            user: updatedUser,
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

        return res.status(400).json({ message });
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

        return res.status(200).json(result);
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Delete User Error:", error);

        if (message === "User not found") {
            return res.status(404).json({ message });
        }

        return res.status(400).json({ message });
    }
}

// ADMIN CREATES EMPLOYEE
export async function createUserByAdmin(
    req: Request,
    res: Response
) {
    try {
        const { name, email, phoneNumber } = req.body ?? {};

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof phoneNumber !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !phoneNumber.trim()
        ) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const createdByRole = req.user?.role as any;
        const adminFarmId = req.user?.farmId;
        const adminFarmName = req.user?.farmName;

        const result = await createUserByAdminUsecase(
            {
                name,
                email,
                phoneNumber,
            },
            createdByRole,
            adminFarmId,
            adminFarmName
        );

        return res.status(201).json(result);
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Create User By Admin Error:", error);

        if (message === "Email already exists") {
            return res.status(409).json({ message });
        }

        return res.status(400).json({ message });
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

        const result = await loginUserUsecase(
            email.trim(),
            password.trim()
        );

        return res.status(200).json(result);
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Login Error:", error);

        if (
            message === "Invalid email or password" ||
            message === "Please verify your email before login"
        ) {
            return res.status(401).json({ message });
        }

        return res.status(500).json({
            message: "Failed to login. Please try again",
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

        const result = await forgetPasswordUsecase(
            email.trim()
        );

        return res.status(200).json(result);
    } catch (error: unknown) {
        console.error("Forgot Password Error:", error);

        return res.status(500).json({
            message: "Failed to process request. Please try again",
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
                message: "All fields are required",
            });
        }

        const result = await resetPasswordUsecase(
            email.trim(),
            otp.trim(),
            newPassword.trim()
        );

        return res.status(200).json(result);
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Reset Password Error:", error);

        return res.status(400).json({ message });
    }
}

// CHANGE EMPLOYEE TEMPORARY PASSWORD
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
                message: "Both passwords are required",
            });
        }

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const result = await changeTemporaryPasswordUsecase(
            userId,
            currentPassword.trim(),
            newPassword.trim()
        );

        return res.status(200).json(result);
    } catch (error: unknown) {
        const message = getErrorMessage(error);

        console.error("Change Password Error:", error);

        return res.status(400).json({ message });
    }
}

// ================= CUSTOMER CONTROLLERS (FARM SCOPED) =================
export async function getCustomers(req: Request, res: Response) {
    try {
        const farmId = req.user?.farmId;
        const { getAllCustomersUseCase } = await import("./usecase");
        const customers = await getAllCustomersUseCase(farmId);
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
        const farmId = req.user?.farmId;
        const { createCustomerUseCase } = await import("./usecase");
        const customer = await createCustomerUseCase(req.body, farmId);
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
        const farmId = req.user?.farmId;
        const { id } = req.params;
        const { updateCustomerUseCase } = await import("./usecase");
        const customer = await updateCustomerUseCase(id, req.body, farmId);
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
        const farmId = req.user?.farmId;
        const { id } = req.params;
        const { deleteCustomerUseCase } = await import("./usecase");
        await deleteCustomerUseCase(id, farmId);
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

// ================= DELIVERY CONTROLLERS (FARM SCOPED) =================
export async function getDeliveries(req: Request, res: Response) {
    try {
        const farmId = req.user?.farmId;
        const date = typeof req.query.date === "string" ? req.query.date : undefined;
        const { getDeliveriesUseCase } = await import("./usecase");
        const deliveries = await getDeliveriesUseCase(date, farmId);
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
        const farmId = req.user?.farmId;
        const { createDeliveryUseCase } = await import("./usecase");
        const delivery = await createDeliveryUseCase(req.body, farmId);
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

// ================= PAYMENT CONTROLLERS (FARM SCOPED) =================
export async function getPayments(req: Request, res: Response) {
    try {
        const farmId = req.user?.farmId;
        const { getPaymentsUseCase } = await import("./usecase");
        const payments = await getPaymentsUseCase(farmId);
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
        const farmId = req.user?.farmId;
        const { createPaymentUseCase } = await import("./usecase");
        const payment = await createPaymentUseCase(req.body, farmId);
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

// ================= PRICE CONTROLLERS (FARM SCOPED) =================
export async function getPrices(req: Request, res: Response) {
    try {
        const farmId = req.user?.farmId;
        const { getPricesUseCase } = await import("./usecase");
        const prices = await getPricesUseCase(farmId);
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
        const farmId = req.user?.farmId;
        const { createPriceUseCase } = await import("./usecase");
        const price = await createPriceUseCase(req.body, farmId);
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

// ================= ATTENDANCE CONTROLLERS (FARM SCOPED) =================
export async function getAttendance(req: Request, res: Response) {
    try {
        const farmId = req.user?.farmId;
        const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;
        const { getAttendanceUseCase } = await import("./usecase");
        const attendance = await getAttendanceUseCase(dateParam, farmId);
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
        const farmId = req.user?.farmId;
        const { recordAttendanceUseCase } = await import("./usecase");
        const attendance = await recordAttendanceUseCase(req.body, farmId);
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
