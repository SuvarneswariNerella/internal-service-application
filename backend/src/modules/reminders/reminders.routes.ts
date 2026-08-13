import { Router } from "express";
import { listNotifications, markAsRead, markAllAsRead, deleteNotification, getReminders, getRemindersSummary } from "./reminders.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try { await getReminders(req, res); } catch (e) { next(e); }
});

router.get("/summary", async (req, res, next) => {
  try { await getRemindersSummary(req, res); } catch (e) { next(e); }
});

router.get("/notifications", async (req, res, next) => {
  try { await listNotifications(req, res); } catch (e) { next(e); }
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
