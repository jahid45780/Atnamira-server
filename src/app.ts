import express, { Request,  Response } from 'express'
import { router } from './app/routes'
import cors from "cors";
import { globalErrorHandler } from './app/middleware/globalErrorHandler'
import NotFound from './app/middleware/NotFound'
import { envVers } from './app/config/env'
import "./app/config/passport";



const app = express()

app.use(express.json())



app.use(cors({
  origin:envVers.FRONTEND_URL,
  credentials:true
}))
app.use('/api/v1', router)


app.get("/", (req:Request, res:Response)=>{
    res.status(200).json({
        message:"welcome  to the  server"
    })
})


app.use(globalErrorHandler)
app.use(NotFound)

export default app


