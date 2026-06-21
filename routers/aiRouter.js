import express from "express";
import { generateResumeContent, generateAndCreateResume } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/generate", generateResumeContent);
router.post("/generate-resume", generateAndCreateResume);

export default router;