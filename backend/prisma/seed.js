import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database via JS runner...");

  const pm = await prisma.user.findFirst({ where: { role: "PROJECT_MANAGER" } });
  const pmId = pm ? pm.id : null;

  const allClients = await prisma.client.findMany({
    include: { _count: { select: { projects: true } } },
  });

  console.log(`Found ${allClients.length} clients in database.`);

  for (const client of allClients) {
    console.log(`Client ${client.name} (${client.id}) has ${client._count.projects} projects.`);
    if (client._count.projects === 0) {
      console.log(`Creating sample projects for client: ${client.name}...`);
      await prisma.project.create({
        data: {
          name: `${client.name} Primary Portal`,
          description: `Main corporate system for ${client.name}`,
          technology: "React, Node.js",
          startDate: new Date(),
          status: "IN_PROGRESS",
          clientId: client.id,
          managerId: pmId,
        },
      });
      await prisma.project.create({
        data: {
          name: `${client.name} Infrastructure & API`,
          description: `Cloud backend services for ${client.name}`,
          technology: "TypeScript, AWS, Docker",
          startDate: new Date(),
          status: "PLANNING",
          clientId: client.id,
          managerId: pmId,
        },
      });
      console.log(`Successfully created 2 projects for ${client.name}.`);
    }
  }

  const allProjects = await prisma.project.findMany({ include: { client: true } });
  for (const proj of allProjects) {
    const slug = (proj.name || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const clientName = proj.client?.name || "Client";

    await prisma.asset.upsert({
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

  console.log("All clients and project assets seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
