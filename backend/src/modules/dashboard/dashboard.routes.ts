import { Router } from "express";
import { getDashboardStats } from "./dashboard.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/stats", async (req, res, next) => {
  try {
    await getDashboardStats(req, res);
  } catch (e) {
    next(e);
  }
});

export default router;
