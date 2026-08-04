import { Router } from "express";
import { listServers, getServer, createServer, updateServer, deleteServer, getExpiringServers } from "./servers.controller";
import { authenticate, authorize } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { createServerSchema, updateServerSchema } from "./servers.validation";

const router = Router();

router.use(authenticate);

router.get("/expiring", async (req, res, next) => {
  try { await getExpiringServers(req, res); } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try { await listServers(req, res); } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try { await getServer(req, res); } catch (e) { next(e); }
});

router.post("/", authorize("ADMIN", "OPERATIONS"), validate(createServerSchema), async (req, res, next) => {
  try { await createServer(req, res); } catch (e) { next(e); }
});

router.put("/:id", authorize("ADMIN", "OPERATIONS"), validate(updateServerSchema), async (req, res, next) => {
  try { await updateServer(req, res); } catch (e) { next(e); }
});

router.delete("/:id", authorize("ADMIN"), async (req, res, next) => {
  try { await deleteServer(req, res); } catch (e) { next(e); }
});

export default router;
