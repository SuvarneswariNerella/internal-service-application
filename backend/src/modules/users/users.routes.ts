import { Router } from "express";
import { listUsers } from "./users.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    await listUsers(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
