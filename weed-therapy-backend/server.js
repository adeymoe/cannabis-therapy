import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import userRouter from './routes/userRoute.js'
import chatRouter from './routes/chatRoute.js'
import checkinRouter from './routes/checkinRoute.js'
import sessionRouter from './routes/sessionRoute.js';
import strainRouter from './routes/strainRoute.js';
import cudRoute from "./routes/cudRoute.js";
import interactionRoute from "./routes/interactionRoute.js";
import doseRoute from './routes/doseRoute.js';
import tplanRouter from './routes/tplanRoute.js';


//App Config
const app = express()
const port = process.env.PORT || 4000
connectDB()

//Middlewares
app.use(express.json())
app.use(cors())

//api endpoint
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/checkin', checkinRouter)
app.use('/api/session', sessionRouter);
app.use('/api/strain', strainRouter);
app.use("/api/cud", cudRoute);
app.use("/api/interaction", interactionRoute);
app.use("/api/dose", doseRoute);
app.use('/api/tplan', tplanRouter);



app.get('/', (req, res)=>{
    res.send("API Working")
})



app.listen(port, ()=> console.log('Server started on PORT : '+ port))