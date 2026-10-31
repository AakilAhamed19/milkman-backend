import { Router } from "express"
import { getAllUsers, getUserById, getUserByMobile, getUserByName, registeruser, getUserByEmail, updateUser ,deleteUser } from "./controller";

const router = Router();
router.post("/registeruser", registeruser);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.get("/users/name/:name", getUserByName);
router.get("/users/mobile/:phoneNumber", getUserByMobile);
router.get("/users/email/:email", getUserByEmail);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
export default router   
