import prisma from "@/config/db";

export async function logAudit(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details ? JSON.parse(JSON.stringify(params.details)) : undefined,
      },
    });
  } catch (error) {
    console.error("[AuditLog] Failed to create audit log:", error);
  }
}

export async function logLogin(params: {
  userId: string;
  email: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.loginLog.create({
      data: {
        userId: params.userId,
        email: params.email,
        success: params.success,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("[LoginLog] Failed to create login log:", error);
  }
}
