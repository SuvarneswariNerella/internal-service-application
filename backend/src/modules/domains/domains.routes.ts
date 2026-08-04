import { Router } from "express";
import { listDomains, getDomain, createDomain, updateDomain, deleteDomain, getExpiringDomains } from "./domains.controller";
import { authenticate, authorize } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { createDomainSchema, updateDomainSchema } from "./domains.validation";

const router = Router();

router.use(authenticate);

router.get("/expiring", async (req, res, next) => {
  try { await getExpiringDomains(req, res); } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try { await listDomains(req, res); } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try { await getDomain(req, res); } catch (e) { next(e); }
});

router.post("/", authorize("ADMIN", "OPERATIONS"), validate(createDomainSchema), async (req, res, next) => {
  try { await createDomain(req, res); } catch (e) { next(e); }
});

router.put("/:id", authorize("ADMIN", "OPERATIONS"), validate(updateDomainSchema), async (req, res, next) => {
  try { await updateDomain(req, res); } catch (e) { next(e); }
});

router.delete("/:id", authorize("ADMIN"), async (req, res, next) => {
  try { await deleteDomain(req, res); } catch (e) { next(e); }
});

export default router;
