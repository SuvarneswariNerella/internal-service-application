import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { createUrlSchema, listUrlsSchema } from "./validation";
import {
  createShortUrl,
  updateShortUrl,
  listUrls,
  getUrlById,
  getUrlStats,
  deleteUrl,
} from "./controller";

const router = Router();

router.get("/", authenticate, validate(listUrlsSchema), listUrls);
router.get("/:id", authenticate, getUrlById);
router.get("/:id/stats", authenticate, getUrlStats);
router.post("/", authenticate, validate(createUrlSchema), createShortUrl);
router.put("/:id", authenticate, updateShortUrl);
router.delete("/:id", authenticate, authorize("ADMIN", "PROJECT_MANAGER"), deleteUrl);

export default router;
