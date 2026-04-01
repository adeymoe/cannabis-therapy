import express from "express";
import {
  submitScreening,
  getScreeningHistory,
  getLatestScreening,
  getQuestions,
} from "../controllers/cudController.js";
import authUser from '../middleware/auth.js';

const router = express.Router();

// Public — fetch DSM-5 questions (no auth needed)
router.get("/questions", getQuestions);

// Protected — all below require valid JWT
router.post("/submit", authUser, submitScreening);
router.get("/history", authUser, getScreeningHistory);
router.get("/latest", authUser, getLatestScreening);

export default router;