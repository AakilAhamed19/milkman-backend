import { Router } from "express";

import {
    getAllUsers,
    getUserById,
    getUserByMobile,
    getUserByName,
    registeruser,
    getUserByEmail,
    updateUser,
    deleteUser,
    loginUser,
    verifyRegisterOtp,
    forgetPassword,
    resetPassword,
    createUserByAdmin,
    changeTemporaryPassword,
    getFarmDetails,
    updateFarmDetails,
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getDeliveries,
    createDelivery,
    getPayments,
    createPayment,
    getPrices,
    createPrice,
    getAttendance,
    recordAttendance,
} from "./controller";

import { authMiddleware, adminOnly } from "./auth.middleware";

const router = Router();

// FIRST ADMIN REGISTRATION (PUBLIC)
router.post("/registeruser", registeruser);

// VERIFY ADMIN REGISTRATION OTP (PUBLIC)
router.post("/verify-otp", verifyRegisterOtp);

// LOGIN USER (PUBLIC)
router.post("/login", loginUser);

// FORGOT PASSWORD (PUBLIC)
router.post("/forgot-password", forgetPassword);

// RESET PASSWORD (PUBLIC)
router.post("/reset-password", resetPassword);

// FARM DETAILS (PROTECTED)
router.get("/farm", authMiddleware, getFarmDetails);
router.put("/farm", authMiddleware, adminOnly, updateFarmDetails);

// CREATE EMPLOYEE (ADMIN ONLY)
router.post(
    "/add-user",
    authMiddleware,
    adminOnly,
    createUserByAdmin
);

// EMPLOYEE CHANGE TEMPORARY PASSWORD (AUTHENTICATED)
router.post(
    "/change-temporary-password",
    authMiddleware,
    changeTemporaryPassword
);

// GET ALL USERS (PROTECTED)
router.get("/users", authMiddleware, getAllUsers);

// GET USER BY ID (PROTECTED)
router.get("/users/:id", authMiddleware, getUserById);

// GET USER BY NAME (PROTECTED)
router.get("/users/name/:name", authMiddleware, getUserByName);

// GET USER BY MOBILE (PROTECTED)
router.get("/users/mobile/:phoneNumber", authMiddleware, getUserByMobile);

// GET USER BY EMAIL (PROTECTED)
router.get("/users/email/:email", authMiddleware, getUserByEmail);

// UPDATE USER (PROTECTED)
router.put("/users/:id", authMiddleware, updateUser);

// DELETE USER (PROTECTED)
router.delete("/users/:id", authMiddleware, deleteUser);

// CUSTOMER ROUTES (PROTECTED)
router.get("/customers", authMiddleware, getCustomers);
router.post("/customers", authMiddleware, createCustomer);
router.put("/customers/:id", authMiddleware, updateCustomer);
router.delete("/customers/:id", authMiddleware, deleteCustomer);

// DELIVERY ROUTES (PROTECTED)
router.get("/deliveries", authMiddleware, getDeliveries);
router.post("/deliveries", authMiddleware, createDelivery);

// PAYMENT ROUTES (PROTECTED)
router.get("/payments", authMiddleware, getPayments);
router.post("/payments", authMiddleware, createPayment);

// PRICE ROUTES (PROTECTED)
router.get("/prices", authMiddleware, getPrices);
router.post("/prices", authMiddleware, createPrice);

// ATTENDANCE ROUTES (PROTECTED)
router.get("/attendance", authMiddleware, getAttendance);
router.post("/attendance", authMiddleware, recordAttendance);

export default router;
