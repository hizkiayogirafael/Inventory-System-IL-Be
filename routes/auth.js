import express from "express";
import { register, login } from "../controller/auth.js";
import { approveUser } from "../controller/user.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.patch("/approve/:userId", approveUser); // Route untuk menyetujui akun user

export default router;
