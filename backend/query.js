const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  console.log(projects.map(p => ({ id: p.id, name: p.name, clientId: p.clientId })));
  
  const clients = await prisma.client.findMany();
  console.log(clients.map(c => ({ id: c.id, name: c.name })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
