import express from 'express';
import { logDose, getDoseHistory, getDoseStats, deleteDoseLog } from '../controllers/doseController.js';
import authUser from '../middleware/auth.js';

const router = express.Router();

router.post('/log', authUser, logDose);
router.get('/history', authUser, getDoseHistory);
router.get('/stats', authUser, getDoseStats);
router.delete('/:id', authUser, deleteDoseLog);

export default router;