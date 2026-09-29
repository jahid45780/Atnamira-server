
import { Router } from "express";
import { seoController } from "./seo.controller";
import { Role } from "../user/user.interface";
import { checkAuth } from "../auth/authCheck";

const router = Router();

router.post(
  "/audit",
  checkAuth(Role.ADMIN),
  seoController.auditPage,
);

export const seoRoutes = router;