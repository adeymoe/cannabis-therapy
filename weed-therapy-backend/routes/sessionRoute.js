// backend/routes/sessionRoute.js
import express from 'express';
import { 
  startSession, 
  continueSession, 
  endSession, 
  resumeSession,
  listSessions, 
  getSession, 
  listSessionTypes,
  deleteSession, 
} from '../controllers/sessionController.js';
import authUser from '../middleware/auth.js';

const router = express.Router();

router.post('/start', authUser, startSession);
router.post('/continue', authUser, continueSession);
router.post('/end', authUser, endSession);
router.post('/resume', authUser, resumeSession);
router.get('/my', authUser, listSessions);
router.get('/types', authUser, listSessionTypes);
router.delete('/:id', authUser, deleteSession);
router.get('/:id', authUser, getSession);

export default router;