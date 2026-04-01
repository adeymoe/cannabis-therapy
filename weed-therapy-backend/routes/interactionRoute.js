import express from "express";
import { checkInteraction, getInteractionHistory } from "../controllers/interactionController.js";
import authUser from '../middleware/auth.js';


const router = express.Router();

router.post("/check", authUser, checkInteraction);
router.get("/history", authUser, getInteractionHistory);

export default router;