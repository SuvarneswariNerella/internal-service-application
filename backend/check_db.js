const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany();
  console.log("Clients:", clients.map(c => c.name));
  
  const projects = await prisma.project.findMany({
    include: { client: true }
  });
  console.log("Projects:", projects.map(p => `${p.name} (Client: ${p.client?.name})`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
