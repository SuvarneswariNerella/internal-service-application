import { Router } from "express";
import { listNotifications, markAsRead, markAllAsRead, deleteNotification, getExpiringItems } from "./reminders.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/notifications", async (req, res, next) => {
  try { await listNotifications(req, res); } catch (e) { next(e); }
});

router.get("/expiring", async (req, res, next) => {
  try { await getExpiringItems(req, res); } catch (e) { next(e); }
});

router.put("/notifications/:id/read", async (req, res, next) => {
  try { await markAsRead(req, res); } catch (e) { next(e); }
});

router.put("/notifications/read-all", async (req, res, next) => {
  try { await markAllAsRead(req, res); } catch (e) { next(e); }
});

router.delete("/notifications/:id", async (req, res, next) => {
  try { await deleteNotification(req, res); } catch (e) { next(e); }
});

export default router;
