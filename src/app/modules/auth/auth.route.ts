import { NextFunction, Request, Response, Router } from "express";
import { authController } from "./auth.controller";
import passport from "passport";

 const router = Router();



 router.post('/login',authController.credentialsLogin)




  router.get("/google", (req: Request, res: Response, next: NextFunction) => {

  const redirect = req.query.redirect || "/"

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: redirect as string
  })(req, res, next)

})

router.get("/google/callback", passport.authenticate("google", {failureRedirect:"/login"}),  authController.googleCallbackController)
    


 export const authRoutes = router;