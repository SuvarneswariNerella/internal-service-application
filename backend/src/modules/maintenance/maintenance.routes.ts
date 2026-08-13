import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import {
  listMaintenanceRecords,
  getMaintenanceRecord,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  addComment,
} from "./maintenance.controller";
import { createMaintenanceSchema, updateMaintenanceSchema } from "./maintenance.validation";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(listMaintenanceRecords));
router.get("/:id", asyncHandler(getMaintenanceRecord));
router.post("/", validate(createMaintenanceSchema), asyncHandler(createMaintenanceRecord));
router.put("/:id", validate(updateMaintenanceSchema), asyncHandler(updateMaintenanceRecord));
router.delete("/:id", asyncHandler(deleteMaintenanceRecord));
router.post("/:id/comments", asyncHandler(addComment));

export default router;
