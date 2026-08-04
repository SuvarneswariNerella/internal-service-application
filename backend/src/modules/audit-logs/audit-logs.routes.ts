import { Router } from "express";
import { listAuditLogs, listLoginLogs } from "./audit-logs.controller";
import { authenticate, authorize } from "@/middleware/auth";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", async (req, res, next) => {
  try {
    await listAuditLogs(req, res);
  } catch (e) {
    next(e);
  }
});

router.get("/logins", async (req, res, next) => {
  try {
    await listLoginLogs(req, res);
  } catch (e) {
    next(e);
  }
});

export default router;
