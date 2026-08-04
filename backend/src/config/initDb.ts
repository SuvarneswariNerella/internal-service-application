import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import path from "path";

const prisma = new PrismaClient();

export async function ensureQrCodeTableSchema() {
  try {
    // Run prisma generate in background dev process
    try {
      execSync("npx prisma generate", {
        cwd: path.join(process.cwd()),
        stdio: "ignore",
      });
      console.log("[DB] Prisma Client regenerated successfully.");
    } catch (e) {
      console.warn("[DB] Prisma generate skipped or executed with warning.");
    }

    // Ensure table exists in MySQL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS QrCode (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'URL',
        content TEXT NOT NULL,
        rawContent JSON NULL,
        clientId VARCHAR(191) NULL,
        projectId VARCHAR(191) NULL,
        shortUrlId VARCHAR(191) NULL,
        format VARCHAR(10) NOT NULL DEFAULT 'SVG',
        size INT NOT NULL DEFAULT 256,
        foregroundColor VARCHAR(50) NOT NULL DEFAULT '#000000',
        backgroundColor VARCHAR(50) NOT NULL DEFAULT '#FFFFFF',
        errorCorrectionLevel VARCHAR(10) NOT NULL DEFAULT 'M',
        expiryDate DATETIME(3) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        tags VARCHAR(255) NULL,
        createdBy VARCHAR(191) NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Query existing columns
    const columns: any = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'QrCode'
    `);

    const colNames = new Set(
      Array.isArray(columns)
        ? columns.map((c: any) => c.COLUMN_NAME || c.column_name)
        : []
    );

    if (!colNames.has("rawContent")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN rawContent JSON NULL`);
    }
    if (!colNames.has("clientId")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN clientId VARCHAR(191) NULL`);
    }
    if (!colNames.has("projectId")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN projectId VARCHAR(191) NULL`);
    }
    if (!colNames.has("shortUrlId")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN shortUrlId VARCHAR(191) NULL`);
    }
    if (!colNames.has("errorCorrectionLevel")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN errorCorrectionLevel VARCHAR(10) NOT NULL DEFAULT 'M'`);
    }
    if (!colNames.has("expiryDate")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN expiryDate DATETIME(3) NULL`);
    }
    if (!colNames.has("status")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'`);
    }
    if (!colNames.has("tags")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN tags VARCHAR(255) NULL`);
    }
    if (!colNames.has("createdBy")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN createdBy VARCHAR(191) NULL`);
    }
    if (!colNames.has("updatedAt")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`);
    }
    if (!colNames.has("foregroundColor") && colNames.has("foreground")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode CHANGE COLUMN foreground foregroundColor VARCHAR(50) NOT NULL DEFAULT '#000000'`);
    } else if (!colNames.has("foregroundColor")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN foregroundColor VARCHAR(50) NOT NULL DEFAULT '#000000'`);
    }
    if (!colNames.has("backgroundColor") && colNames.has("background")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode CHANGE COLUMN background backgroundColor VARCHAR(50) NOT NULL DEFAULT '#FFFFFF'`);
    } else if (!colNames.has("backgroundColor")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE QrCode ADD COLUMN backgroundColor VARCHAR(50) NOT NULL DEFAULT '#FFFFFF'`);
    }

    console.log("[DB] QrCode table schema verified successfully.");
  } catch (err) {
    console.error("[DB] Failed to verify QrCode table schema:", err);
  }
}

export async function seedInitialDataIfEmpty() {
  try {
    const pm = await prisma.user.findFirst({ where: { role: "PROJECT_MANAGER" } });
    const pmId = pm ? pm.id : null;

    const clients = await prisma.client.findMany({ include: { projects: true } });
    for (const client of clients) {
      if (client.projects.length === 0) {
        console.log(`[Seed] Creating sample projects for client: ${client.name}...`);
        const proj1 = await prisma.project.create({
          data: {
            name: `${client.name} Web App`,
            description: `Main application for ${client.name}`,
            technology: "React, Node.js",
            startDate: new Date(),
            status: "IN_PROGRESS",
            clientId: client.id,
            managerId: pmId,
          },
        });
        const proj2 = await prisma.project.create({
          data: {
            name: `${client.name} Cloud Platform`,
            description: `Cloud services for ${client.name}`,
            technology: "TypeScript, AWS",
            startDate: new Date(),
            status: "PLANNING",
            clientId: client.id,
            managerId: pmId,
          },
        });
        console.log(`[Seed] Created projects: ${proj1.name}, ${proj2.name}`);
      }
    }
  } catch (err) {
    console.error("[Seed] Error auto-seeding initial project servers:", err);
  }
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function ensureAssetPlatformsTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`AssetPlatform\` (
        \`id\`        VARCHAR(191) NOT NULL,
        \`name\`      VARCHAR(191) NOT NULL,
        \`slug\`      VARCHAR(191) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`AssetPlatform_name_key\` (\`name\`),
        UNIQUE KEY \`AssetPlatform_slug_key\` (\`slug\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM \`AssetPlatform\``
    );
    const count = Number(rows[0]?.cnt ?? 0);

    if (count === 0) {
      const { randomUUID } = await import("crypto");
      const defaults = [
        "Figma",
        "GitHub",
        "Google Drive",
        "Brand Guidelines PDF",
        "Production URL",
        "Staging Environment",
        "Database Cluster",
        "API Documentation",
        "Technical Documentation",
        "Other",
      ];
      for (const name of defaults) {
        await prisma.$executeRawUnsafe(
          `INSERT IGNORE INTO \`AssetPlatform\` (id, name, slug, createdAt, updatedAt) VALUES (?, ?, ?, NOW(3), NOW(3))`,
          randomUUID(),
          name,
          slugify(name)
        );
      }
      console.log("[DB] AssetPlatform table seeded with default platforms.");
    }

    console.log("[DB] AssetPlatform table verified successfully.");
  } catch (err) {
    console.error("[DB] Failed to ensure AssetPlatform table:", err);
  }
}

export async function ensureCredentialTableSchema() {
  try {
    const columns: any = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Credential'
    `);

    const colNames = new Set(
      Array.isArray(columns)
        ? columns.map((c: any) => c.COLUMN_NAME || c.column_name)
        : []
    );

    if (colNames.size > 0) {
      if (!colNames.has("assetCategory")) {
        await prisma.$executeRawUnsafe(`ALTER TABLE Credential ADD COLUMN assetCategory VARCHAR(191) NULL`);
      }
      if (!colNames.has("loginUrl")) {
        await prisma.$executeRawUnsafe(`ALTER TABLE Credential ADD COLUMN loginUrl VARCHAR(191) NULL`);
      }
      if (!colNames.has("minRoleAccess")) {
        await prisma.$executeRawUnsafe(`ALTER TABLE Credential ADD COLUMN minRoleAccess VARCHAR(191) NULL`);
      }
      console.log("[DB] Credential table schema verified successfully.");
    }
  } catch (err) {
    console.error("[DB] Failed to verify Credential table schema:", err);
  }
}

export async function ensureFinanceRecordTableSchema() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS FinanceRecord (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        projectId VARCHAR(191) NOT NULL,
        type VARCHAR(191) NOT NULL,
        title VARCHAR(191) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(191) NOT NULL DEFAULT 'USD',
        status VARCHAR(191) NOT NULL DEFAULT 'PENDING',
        dueDate DATETIME(3) NULL,
        paidDate DATETIME(3) NULL,
        fileUrl VARCHAR(191) NULL,
        notes TEXT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        CONSTRAINT FinanceRecord_projectId_fkey FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("[DB] FinanceRecord table schema verified successfully.");
  } catch (err) {
    console.error("[DB] Failed to verify FinanceRecord table schema:", err);
  }
}
