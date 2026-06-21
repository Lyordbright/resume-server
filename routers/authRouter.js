import express from "express";
import {
  signup,
  login,
  verifyEmail,
  verifyAuth,
  updateProfile,
  changePassword,
  resendVerification,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/verify-auth", verifyAuth);

// Account management (requires auth)
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/resend-verification", protect, resendVerification);

export default router;