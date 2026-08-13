import { Router } from "express";
import {
  getFinanceRecords,
  getFinanceRecordById,
  createFinanceRecord,
  updateFinanceRecord,
  deleteFinanceRecord,
  downloadFinancePdf,
  sendFinanceDocument,
  convertFinanceDocument,
} from "./finance.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getFinanceRecords);
router.get("/:id", getFinanceRecordById);
router.post("/", createFinanceRecord);
router.put("/:id", updateFinanceRecord);
router.delete("/:id", deleteFinanceRecord);
router.get("/:id/pdf", downloadFinancePdf);
router.post("/:id/send", sendFinanceDocument);
router.post("/:id/convert", convertFinanceDocument);

export default router;
