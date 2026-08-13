const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany();
  console.log(`Found ${clients.length} clients`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
