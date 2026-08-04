import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@expinova.io" },
    update: {},
    create: {
      email: "admin@expinova.io",
      password: hashedPassword,
      name: "Admin User",
      role: Role.ADMIN,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: "pm@expinova.io" },
    update: {},
    create: {
      email: "pm@expinova.io",
      password: hashedPassword,
      name: "Project Manager",
      role: Role.PROJECT_MANAGER,
    },
  });

  const dev = await prisma.user.upsert({
    where: { email: "dev@expinova.io" },
    update: {},
    create: {
      email: "dev@expinova.io",
      password: hashedPassword,
      name: "Developer",
      role: Role.DEVELOPER,
    },
  });

  const accounts = await prisma.user.upsert({
    where: { email: "accounts@expinova.io" },
    update: {},
    create: {
      email: "accounts@expinova.io",
      password: hashedPassword,
      name: "Accounts Team",
      role: Role.ACCOUNTS,
    },
  });

  const ops = await prisma.user.upsert({
    where: { email: "ops@expinova.io" },
    update: {},
    create: {
      email: "ops@expinova.io",
      password: hashedPassword,
      name: "Operations Team",
      role: Role.OPERATIONS,
    },
  });

  console.log("Users created:", { admin: admin.email, pm: pm.email, dev: dev.email, accounts: accounts.email, ops: ops.email });

  let client1 = await prisma.client.findFirst({ where: { email: "john@acme.com" } });
  if (!client1) {
    client1 = await prisma.client.create({
      data: {
        name: "Acme Corp",
        company: "Acme Corporation",
        contactPerson: "John Smith",
        email: "john@acme.com",
        phone: "+1-555-0101",
        address: "123 Business St, New York, NY 10001",
        status: "ACTIVE",
      },
    });
  }

  let client2 = await prisma.client.findFirst({ where: { email: "sarah@techstart.io" } });
  if (!client2) {
    client2 = await prisma.client.create({
      data: {
        name: "TechStart Inc",
        company: "TechStart Incorporated",
        contactPerson: "Sarah Johnson",
        email: "sarah@techstart.io",
        phone: "+1-555-0202",
        address: "456 Tech Ave, San Francisco, CA 94105",
        status: "ACTIVE",
      },
    });
  }

  let client3 = await prisma.client.findFirst({ where: { email: "Apex@gmail.com" } });
  if (!client3) {
    client3 = await prisma.client.findFirst({ where: { name: "Apex Cloud Tech" } });
  }
  if (!client3) {
    client3 = await prisma.client.create({
      data: {
        name: "Apex Cloud Tech",
        company: "Apex Cloud Technologies",
        contactPerson: "Apex",
        email: "Apex@gmail.com",
        phone: "+1-555-0303",
        address: "Tech Tower 1, Cyber City DLF, Gurugram, Haryana 122002",
        status: "ACTIVE",
      },
    });
  }

  console.log("Clients ready:", client1.name, client2.name, client3.name);

  // Ensure every default client has projects
  const clientsList = [client1, client2, client3];
  for (const client of clientsList) {
    const existingProjects = await prisma.project.findMany({ where: { clientId: client.id } });
    if (existingProjects.length === 0) {
      console.log(`Creating default projects for client: ${client.name}`);
      await prisma.project.create({
        data: {
          name: `${client.name} Primary Application`,
          description: `Core platform project for ${client.name}`,
          technology: "React, Node.js",
          startDate: new Date("2024-01-15"),
          status: "IN_PROGRESS",
          clientId: client.id,
          managerId: pm.id,
        },
      });
      await prisma.project.create({
        data: {
          name: `${client.name} Infrastructure & API`,
          description: `Backend services and cloud infrastructure for ${client.name}`,
          technology: "TypeScript, AWS, Docker",
          startDate: new Date("2024-02-01"),
          status: "PLANNING",
          clientId: client.id,
          managerId: pm.id,
        },
      });
    }

    if (client.name === "Acme Corp") {
      const acmeWeb = await prisma.project.findFirst({ where: { clientId: client.id, name: "Acme Website Design" } });
      if (!acmeWeb) {
        await prisma.project.create({
          data: {
            name: "Acme Website Design",
            description: "Website design project for Acme Corp",
            technology: "React, Tailwind, Figma",
            startDate: new Date(),
            status: "IN_PROGRESS",
            clientId: client.id,
            managerId: pm.id,
          },
        });
        console.log("Created specific project: Acme Website Design");
      }
    }
  }

  // Ensure every project in database has technical & creative assets seeded
  const allProjects = await prisma.project.findMany({ include: { assets: true, client: true } });
  for (const proj of allProjects) {
    const slug = (proj.name || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const clientName = proj.client?.name || "Client";

    await (prisma.asset as any).upsert({
      where: { projectId: proj.id },
      update: {
        gitRepo: `https://github.com/SuvarneswariNerella/${slug}`,
        productionUrl: `https://${slug}.app.com`,
        stagingUrl: `https://staging.${slug}.app.com`,
        documentation: `https://wiki.${slug}.com/technical-docs`,
        database: "PostgreSQL 16 (AWS RDS Cluster)",
        apiCollection: `https://api.${slug}.com/postman-collection`,
        designFiles: `https://figma.com/file/${slug}-design-specs`,
        customAssets: [
          {
            id: `seed-asset-1-${proj.id}`,
            title: `${proj.name} UI Specs v2`,
            type: "Figma",
            url: `https://figma.com/file/${slug}-design-specs`,
            createdAt: new Date().toISOString(),
          },
          {
            id: `seed-asset-2-${proj.id}`,
            title: `${clientName} Brand Guidelines PDF`,
            type: "Brand Guidelines PDF",
            url: `https://drive.google.com/file/d/${slug}-brand-guidelines.pdf`,
            createdAt: new Date().toISOString(),
          },
          {
            id: `seed-asset-3-${proj.id}`,
            title: `Cloud Assets Drive Folder`,
            type: "Google Drive",
            url: `https://drive.google.com/drive/folders/${slug}-assets`,
            createdAt: new Date().toISOString(),
          },
        ],
      },
      create: {
        projectId: proj.id,
        gitRepo: `https://github.com/SuvarneswariNerella/${slug}`,
        productionUrl: `https://${slug}.app.com`,
        stagingUrl: `https://staging.${slug}.app.com`,
        documentation: `https://wiki.${slug}.com/technical-docs`,
        database: "PostgreSQL 16 (AWS RDS Cluster)",
        apiCollection: `https://api.${slug}.com/postman-collection`,
        designFiles: `https://figma.com/file/${slug}-design-specs`,
        customAssets: [
          {
            id: `seed-asset-1-${proj.id}`,
            title: `${proj.name} UI Specs v2`,
            type: "Figma",
            url: `https://figma.com/file/${slug}-design-specs`,
            createdAt: new Date().toISOString(),
          },
          {
            id: `seed-asset-2-${proj.id}`,
            title: `${clientName} Brand Guidelines PDF`,
            type: "Brand Guidelines PDF",
            url: `https://drive.google.com/file/d/${slug}-brand-guidelines.pdf`,
            createdAt: new Date().toISOString(),
          },
          {
            id: `seed-asset-3-${proj.id}`,
            title: `Cloud Assets Drive Folder`,
            type: "Google Drive",
            url: `https://drive.google.com/drive/folders/${slug}-assets`,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
  }

  console.log("Projects and assets seed completed successfully!");

  // ── Seed Finance Records ──
  const refreshedProjects = await prisma.project.findMany({ include: { client: true } });

  const financeRecordsData = [
    // Acme Corp projects
    {
      type: "INVOICE",
      title: "Website Development - Phase 1",
      amount: 15000,
      currency: "USD",
      status: "PAID",
      dueDate: new Date("2024-03-15"),
      paidDate: new Date("2024-03-10"),
      notes: "Initial development milestone payment",
    },
    {
      type: "INVOICE",
      title: "Monthly Hosting & Maintenance",
      amount: 2500,
      currency: "USD",
      status: "PENDING",
      dueDate: new Date("2026-08-30"),
      paidDate: null,
      notes: "August 2026 hosting and maintenance invoice",
    },
    {
      type: "RECEIPT",
      title: "AWS Cloud Services Payment",
      amount: 850,
      currency: "USD",
      status: "PAID",
      dueDate: new Date("2024-06-01"),
      paidDate: new Date("2024-05-28"),
      notes: "Cloud infrastructure costs Q2 2024",
    },
    {
      type: "CONTRACT",
      title: "Annual Service Agreement 2024-2025",
      amount: 48000,
      currency: "USD",
      status: "PAID",
      dueDate: new Date("2024-01-15"),
      paidDate: new Date("2024-01-10"),
      notes: "Full year retainer contract",
    },
    // TechStart Inc projects
    {
      type: "INVOICE",
      title: "API Integration Development",
      amount: 12000,
      currency: "USD",
      status: "OVERDUE",
      dueDate: new Date("2026-07-15"),
      paidDate: null,
      notes: "Backend API development and integration",
    },
    {
      type: "QUOTATION",
      title: "Mobile App Development Estimate",
      amount: 35000,
      currency: "USD",
      status: "DRAFT",
      dueDate: null,
      paidDate: null,
      notes: "Quotation for native mobile app development",
    },
    {
      type: "EXPENSE",
      title: "Third-party API Licenses",
      amount: 1200,
      currency: "USD",
      status: "PAID",
      dueDate: new Date("2024-04-01"),
      paidDate: new Date("2024-04-01"),
      notes: "Annual license fees for Twilio, SendGrid",
    },
    {
      type: "RECEIPT",
      title: "Domain & SSL Certificate Purchase",
      amount: 320,
      currency: "USD",
      status: "PAID",
      dueDate: new Date("2024-02-15"),
      paidDate: new Date("2024-02-14"),
      notes: "Domain renewal and SSL for techstart platform",
    },
    // Apex Cloud Tech projects
    {
      type: "INVOICE",
      title: "Cloud Infrastructure Setup",
      amount: 22000,
      currency: "USD",
      status: "PENDING",
      dueDate: new Date("2026-09-01"),
      paidDate: null,
      notes: "Initial cloud architecture and deployment setup",
    },
    {
      type: "EXPENSE",
      title: "DevOps Tooling & CI/CD Pipeline",
      amount: 4500,
      currency: "USD",
      status: "PAID",
      dueDate: new Date("2024-05-20"),
      paidDate: new Date("2024-05-18"),
      notes: "GitHub Actions, Docker registry, monitoring tools",
    },
    {
      type: "CONTRACT",
      title: "Support & Maintenance SLA",
      amount: 18000,
      currency: "INR",
      status: "PENDING",
      dueDate: new Date("2026-08-15"),
      paidDate: null,
      notes: "6-month support agreement (Aug 2026 - Jan 2027)",
    },
    {
      type: "QUOTATION",
      title: "Enterprise Security Audit",
      amount: 8500,
      currency: "USD",
      status: "DRAFT",
      dueDate: null,
      paidDate: null,
      notes: "Proposed security audit and penetration testing",
    },
  ];

  // Distribute finance records across projects
  for (let i = 0; i < financeRecordsData.length; i++) {
    const projectIndex = i % refreshedProjects.length;
    const project = refreshedProjects[projectIndex];
    if (!project) continue;

    const recordData = financeRecordsData[i];

    // Check if a record with the same title already exists for this project
    const existing = await prisma.financeRecord.findFirst({
      where: { title: recordData.title, projectId: project.id },
    });

    if (!existing) {
      await prisma.financeRecord.create({
        data: {
          projectId: project.id,
          type: recordData.type,
          title: recordData.title,
          amount: recordData.amount,
          currency: recordData.currency,
          status: recordData.status,
          dueDate: recordData.dueDate,
          paidDate: recordData.paidDate,
          notes: recordData.notes || null,
        },
      });
    }
  }

  console.log(`Finance records seeded: ${financeRecordsData.length} records processed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
