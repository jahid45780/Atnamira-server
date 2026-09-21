import { Router } from "express";
import { systemHealthController } from "./system-health.controller";
import { checkAuth } from "../auth/authCheck";
import { Role } from "../user/user.interface";

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN,),
  systemHealthController.getSystemHealth
);

export const systemHealthRoutes = router;