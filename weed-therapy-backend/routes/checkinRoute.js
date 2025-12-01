import express from 'express';
import {
  createCheckin,
  getAllCheckins,
  getTodayCheckin,
  updateCheckin,
  getCheckinStats,
  weeklyInsights, 
  monthlyInsights, 
  allTimeInsights
} from '../controllers/checkinController.js';
import authUser from '../middleware/auth.js';

const checkinRouter = express.Router();

// All routes require authentication
checkinRouter.post('/create', authUser, createCheckin);
checkinRouter.get('/all', authUser, getAllCheckins);
checkinRouter.get('/today', authUser, getTodayCheckin);
checkinRouter.put('/update/:id', authUser, updateCheckin);
checkinRouter.get('/stats', authUser, getCheckinStats);
checkinRouter.get('/insights/weekly', authUser, weeklyInsights);
checkinRouter.get('/insights/monthly', authUser, monthlyInsights);
checkinRouter.get('/insights/alltime', authUser, allTimeInsights);

export default checkinRouter;