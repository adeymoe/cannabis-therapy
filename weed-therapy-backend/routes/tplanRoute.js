import express from 'express';
import {
  createTPlan,
  getActivePlan,
  getAllPlans,
  logProgress,
  updatePlanStatus,
  deleteTPlan,
} from '../controllers/tplanController.js';
import authUser from '../middleware/auth.js';

const tplanRouter = express.Router();

tplanRouter.post('/create', authUser, createTPlan);
tplanRouter.get('/active', authUser, getActivePlan);
tplanRouter.get('/all', authUser, getAllPlans);
tplanRouter.post('/log', authUser, logProgress);
tplanRouter.put('/:id/status', authUser, updatePlanStatus);
tplanRouter.delete('/:id', authUser, deleteTPlan);

export default tplanRouter;