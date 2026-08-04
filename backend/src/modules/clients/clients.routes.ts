import { Router } from "express";
import { listClients, getClient, createClient, updateClient, deleteClient, getClientOptions } from "./clients.controller";
import { authenticate, authorize } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { createClientSchema, updateClientSchema } from "./clients.validation";

const router = Router();

router.use(authenticate);

router.get("/options", async (req, res, next) => {
  try { await getClientOptions(req, res); } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try { await listClients(req, res); } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try { await getClient(req, res); } catch (e) { next(e); }
});

router.post("/", authorize("ADMIN", "PROJECT_MANAGER"), validate(createClientSchema), async (req, res, next) => {
  try { await createClient(req, res); } catch (e) { next(e); }
});

router.put("/:id", authorize("ADMIN", "PROJECT_MANAGER"), validate(updateClientSchema), async (req, res, next) => {
  try { await updateClient(req, res); } catch (e) { next(e); }
});

router.delete("/:id", authorize("ADMIN"), async (req, res, next) => {
  try { await deleteClient(req, res); } catch (e) { next(e); }
});

export default router;
