import { Router } from "express";
import { globalSearch } from "./search.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    await globalSearch(req, res);
  } catch (e) {
    next(e);
  }
});

export default router;
