import { Router } from "express";
import { getGeneralSettings, updateGeneralSettings, testSmtpConnectionHandler } from "./settings.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/general", getGeneralSettings);
router.put("/general", updateGeneralSettings);
router.post("/general/test-smtp", testSmtpConnectionHandler);

export default router;
