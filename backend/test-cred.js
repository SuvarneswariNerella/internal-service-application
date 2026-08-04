const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const projects = await prisma.project.findMany({
    include: {
      credentials: true,
      billing: true,
      assets: true
    }
  });
  console.log(JSON.stringify(projects, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
