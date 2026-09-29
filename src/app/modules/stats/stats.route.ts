import { Router } from "express";

import { statsController } from "./stats.controller";
import { Role } from "../user/user.interface";
import { checkAuth } from "../auth/authCheck";

const router = Router();

router.get(
  "/admin",
  checkAuth(Role.ADMIN),
  statsController.getAdminStats,
);

router.get(
  "/user",
  checkAuth(...Object.values(Role)),
  statsController.getUserStats,
);

export const statsRoutes = router;