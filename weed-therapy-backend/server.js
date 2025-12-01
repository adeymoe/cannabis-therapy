import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import userRouter from './routes/userRoute.js'
import chatRouter from './routes/chatRoute.js'
import checkinRouter from './routes/checkinRoute.js'
import sessionRouter from './routes/sessionRoute.js';


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



app.get('/', (req, res)=>{
    res.send("API Working")
})



app.listen(port, ()=> console.log('Server started on PORT : '+ port))