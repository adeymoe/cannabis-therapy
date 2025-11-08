import express from 'express';
import { getAllChat, saveMessage } from '../controllers/chatController.js';
import authUser from '../middleware/auth.js';


const chatRouter = express.Router();

chatRouter.get('/all', authUser, getAllChat);
chatRouter.post('/save-message', authUser, saveMessage);

export default chatRouter;
