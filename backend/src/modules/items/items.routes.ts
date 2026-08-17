import { Router } from "express";
import { getItems } from "./items.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

router.get("/", authenticate, getItems);

export default router;
