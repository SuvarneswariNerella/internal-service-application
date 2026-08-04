import { Router } from "express";
import { register, login, refreshToken, me } from "./auth.controller";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { loginSchema, registerSchema, refreshTokenSchema } from "./auth.validation";

const router = Router();

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    await register(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    await login(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", validate(refreshTokenSchema), async (req, res, next) => {
  try {
    await refreshToken(req, res);
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    await me(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
