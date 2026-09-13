import express, { Request,  Response } from 'express'
import { router } from './app/routes'
import cors from "cors";
import { globalErrorHandler } from './app/middleware/globalErrorHandler'
import NotFound from './app/middleware/NotFound'
import { envVers } from './app/config/env'
import "./app/config/passport";
import passport from 'passport';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session'
// import passport from 'passport';



const app = express()

app.use(expressSession({
    secret: envVers.EXPRESS_SESSION_SECRET,
    resave:false,
    saveUninitialized:false
}))
app.use(express.json());
app.use(passport.initialize())
app.use(passport.session())
app.use(cookieParser())
app.use(cors({
  origin:envVers.FRONTEND_URL,
  credentials:true
}))


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


