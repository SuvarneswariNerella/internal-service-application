import { Router } from "express";
import { getGeneralSettings, updateGeneralSettings } from "./settings.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/general", getGeneralSettings);
router.put("/general", updateGeneralSettings);

export default router;
