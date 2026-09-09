import express, { Request,  Response } from 'express'
import { router } from './app/routes'
import { globalErrorHandler } from './app/middleware/globalErrorHandler'
import NotFound from './app/middleware/NotFound'

const app = express()

app.use(express.json())

app.use('/api/v1', router)


app.get("/", (req:Request, res:Response)=>{
    res.status(200).json({
        message:"welcome  to the  server"
    })
})


app.use(globalErrorHandler)
app.use(NotFound)

export default app