import express from "express";
import {
  getResumeStats,
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  trackDownload,
} from "../controllers/resumeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All resume routes require authentication
router.use(protect);

router.get("/stats", getResumeStats);
router.get("/", getResumes);
router.get("/:id", getResumeById);
router.post("/", createResume);
router.put("/:id", updateResume);
router.delete("/:id", deleteResume);
router.post("/:id/download", trackDownload);

export default router;