import { Router } from "express";

import { statsController } from "./stats.controller";

import { Role } from "../user/user.interface";

import { checkAuth } from "../auth/authCheck";

const router = Router();


// ADMIN
router.get(
  "/admin",
  checkAuth(Role.ADMIN),
  statsController.getAdminStats,
);


// USER
router.get(
  "/user",
  checkAuth(...Object.values(Role)),
  statsController.getUserStats,
);

router.get(
  "/orders",
  checkAuth(Role.ADMIN),
  statsController.getAllOrders,
);


export const statsRoutes = router;