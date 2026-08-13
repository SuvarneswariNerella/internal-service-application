import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/config/db";
import { config } from "@/config";
import { createError } from "@/middleware/errorHandler";
import { logAudit, logLogin } from "@/utils/audit";
import { authenticator } from "otplib";
import QRCode from "qrcode";

// Allow a window of 1 (30 seconds before and after) to account for clock drift
authenticator.options = { window: 1 };

function generateTokens(user: { id: string; email: string; role: string }) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwtRefreshSecret,
    { expiresIn: "7d" },
  );
  return { accessToken, refreshToken };
}

function generateTokensFromPayload(payload: { userId: string; email: string; role: string }) {
  const accessToken = jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role },
    config.jwtSecret,
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role },
    config.jwtRefreshSecret,
    { expiresIn: "7d" },
  );
  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw createError(409, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role as never,
    },
  });

  await logAudit({
    userId: user.id,
    action: "REGISTER",
    entity: "User",
    entityId: user.id,
    details: { email: user.email, name: user.name, role: user.role },
  });

  const tokens = generateTokens(user);
  res.status(201).json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive, createdAt: user.createdAt, updatedAt: user.updatedAt },
      ...tokens,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || "";
  const userAgent = req.get("User-Agent") || "";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await logLogin({ userId: "unknown", email, success: false, ipAddress, userAgent });
    throw createError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    await logLogin({ userId: user.id, email, success: false, ipAddress, userAgent });
    throw createError(403, "Account is deactivated");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await logLogin({ userId: user.id, email, success: false, ipAddress, userAgent });
    await logAudit({
      userId: user.id,
      action: "LOGIN_FAILED",
      entity: "User",
      entityId: user.id,
      details: { email, reason: "Invalid password", ipAddress },
    });
    throw createError(401, "Invalid email or password");
  }

  await logLogin({ userId: user.id, email, success: true, ipAddress, userAgent });
  await logAudit({
    userId: user.id,
    action: "LOGIN",
    entity: "User",
    entityId: user.id,
    details: { email, ipAddress },
  });

  const tokens = generateTokens(user);
  res.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive, createdAt: user.createdAt, updatedAt: user.updatedAt },
      ...tokens,
    },
  });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { userId: string; email: string; role: string };
    const tokens = generateTokensFromPayload(decoded);
    res.json({ success: true, data: tokens });
  } catch {
    throw createError(401, "Invalid refresh token");
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, role: true, avatar: true, isActive: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  res.json({ success: true, data: user });
}

export async function generateTotp(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { email: true, name: true },
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, "InternalService", secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

  res.json({
    success: true,
    data: {
      secret,
      qrCodeDataUrl,
    },
  });
}

export async function verifyTotp(req: Request, res: Response): Promise<void> {
  const { token, secret } = req.body;

  if (!token || !secret) {
    throw createError(400, "Token and secret are required");
  }

  const isValid = authenticator.check(token, secret);

  if (!isValid) {
    throw createError(400, "Invalid verification code");
  }

  await prisma.user.update({
    where: { id: req.user!.userId },
    // @ts-ignore - Prisma Client generation caching issue
    data: {
      totpSecret: secret,
      isTotpEnabled: true,
    },
  });

  res.json({
    success: true,
    message: "TOTP 2FA enabled successfully",
  });
}
