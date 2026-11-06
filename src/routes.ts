
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
} from "./controller";

import { authMiddleware } from "./auth.middleware";

const router = Router();

// REGISTER USER (PUBLIC)
router.post("/registeruser", registeruser);

// VERIFY REGISTER OTP (PUBLIC)
router.post("/verify-otp", verifyRegisterOtp);

// LOGIN USER (PUBLIC)
router.post("/login", loginUser);

// FORGOT PASSWORD (PUBLIC)
router.post("/forgot-password", forgetPassword);

// RESET PASSWORD (PUBLIC)
router.post("/reset-password", resetPassword);

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

export default router;
