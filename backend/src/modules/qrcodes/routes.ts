import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { qrCodeSchema, previewQrSchema } from "./validation";
import {
  generateQrCode,
  updateQrCode,
  listQrCodes,
  getQrCodeById,
  deleteQrCode,
  previewQrCode,
  downloadQrCode,
} from "./controller";

const router = Router();

router.get("/", authenticate, listQrCodes);
router.get("/:id", authenticate, getQrCodeById);
router.post("/preview", authenticate, validate(previewQrSchema), previewQrCode);
router.post("/generate", authenticate, validate(qrCodeSchema), generateQrCode);
router.post("/", authenticate, validate(qrCodeSchema), generateQrCode);
router.put("/:id", authenticate, updateQrCode);
router.delete("/:id", authenticate, deleteQrCode);
router.get("/:id/download", downloadQrCode);

export default router;
