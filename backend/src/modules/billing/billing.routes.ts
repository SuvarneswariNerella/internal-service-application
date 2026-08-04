import { Router } from "express";
import { listBilling, createBilling, updateBilling, deleteBilling } from "./billing.controller";
import { authenticate, authorize } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { createBillingSchema, updateBillingSchema } from "./billing.validation";

const router = Router();

router.use(authenticate);

router.get("/project/:projectId", async (req, res, next) => {
  try { await listBilling(req, res); } catch (e) { next(e); }
});

router.post("/project/:projectId", authorize("ADMIN", "ACCOUNTS"), validate(createBillingSchema), async (req, res, next) => {
  try { await createBilling(req, res); } catch (e) { next(e); }
});

router.put("/:id", authorize("ADMIN", "ACCOUNTS"), validate(updateBillingSchema), async (req, res, next) => {
  try { await updateBilling(req, res); } catch (e) { next(e); }
});

router.delete("/:id", authorize("ADMIN"), async (req, res, next) => {
  try { await deleteBilling(req, res); } catch (e) { next(e); }
});

export default router;
