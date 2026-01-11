import express from 'express';
import authUser from '../middleware/auth.js';
import { recommendStrainsFromCheckin } from '../controllers/strainController.js';

const strainRouter = express.Router();


strainRouter.get('/recommend', authUser, recommendStrainsFromCheckin);



export default strainRouter;