import { Router } from "express";
import { listCredentials, createCredential, updateCredential, deleteCredential, revealCredential } from "./credentials.controller";
import { authenticate, authorize } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { createCredentialSchema, updateCredentialSchema } from "./credentials.validation";

const router = Router();

router.use(authenticate);

router.get("/project/:projectId", async (req, res, next) => {
  try { await listCredentials(req, res); } catch (e) { next(e); }
});

router.post("/project/:projectId", authorize("ADMIN", "PROJECT_MANAGER"), validate(createCredentialSchema), async (req, res, next) => {
  try { await createCredential(req, res); } catch (e) { next(e); }
});

router.put("/:id", authorize("ADMIN", "PROJECT_MANAGER"), validate(updateCredentialSchema), async (req, res, next) => {
  try { await updateCredential(req, res); } catch (e) { next(e); }
});

router.delete("/:id", authorize("ADMIN", "PROJECT_MANAGER"), async (req, res, next) => {
  try { await deleteCredential(req, res); } catch (e) { next(e); }
});

router.get("/:id/reveal", authorize("ADMIN", "PROJECT_MANAGER"), async (req, res, next) => {
  try { await revealCredential(req, res); } catch (e) { next(e); }
});

export default router;
