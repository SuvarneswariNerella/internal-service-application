import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate } from "./templates.controller";

const router = Router();

router.use(authenticate);

router.get("/", getTemplates);
router.get("/:id", getTemplate);
router.post("/", createTemplate);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

export default router;
