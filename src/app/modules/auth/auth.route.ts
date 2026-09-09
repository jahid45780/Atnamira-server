import { Router } from "express";
import { authController } from "./auth.controller";

 const router = Router();



 router.post('/login',authController.credentialsLogin)


 export const authRoutes = router;