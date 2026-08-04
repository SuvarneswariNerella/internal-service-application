import { Router } from "express";
import { listProjects, getProject, createProject, updateProject, deleteProject, updateProjectAssets } from "./projects.controller";
import { authenticate, authorize } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { createProjectSchema, updateProjectSchema } from "./projects.validation";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try { await listProjects(req, res); } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try { await getProject(req, res); } catch (e) { next(e); }
});

router.post("/", authorize("ADMIN", "PROJECT_MANAGER"), validate(createProjectSchema), async (req, res, next) => {
  try { await createProject(req, res); } catch (e) { next(e); }
});

router.put("/:id", authorize("ADMIN", "PROJECT_MANAGER"), validate(updateProjectSchema), async (req, res, next) => {
  try { await updateProject(req, res); } catch (e) { next(e); }
});

router.put("/:id/assets", authorize("ADMIN", "PROJECT_MANAGER"), async (req, res, next) => {
  try { await updateProjectAssets(req, res); } catch (e) { next(e); }
});

router.delete("/:id", authorize("ADMIN"), async (req, res, next) => {
  try { await deleteProject(req, res); } catch (e) { next(e); }
});

export default router;
