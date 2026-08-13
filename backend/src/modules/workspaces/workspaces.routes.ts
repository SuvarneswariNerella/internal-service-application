import { Router } from "express";
import { getAllWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from "./workspaces.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getAllWorkspaces);
router.post("/", createWorkspace);
router.put("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);

export default router;
