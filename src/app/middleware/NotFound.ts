import { Request, Response } from "express";


const NotFound = (req:Request, res:Response)=>{
      res.status(404).json({
        success:false,
        message:"route not found"
      })
}

export default NotFound