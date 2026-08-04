import { Router } from "express";
import { listPlatforms, createPlatform } from "./platforms.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try { await listPlatforms(req, res); } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try { await createPlatform(req, res); } catch (e) { next(e); }
});

export default router;
