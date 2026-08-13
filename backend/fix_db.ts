import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const records = await prisma.maintenanceRecord.findMany({
    where: {
      status: {
        in: ['RESOLVED', 'CANCELLED']
      },
      completedDate: null
    }
  });

  console.log(`Found ${records.length} records to update.`);

  for (const record of records) {
    await prisma.maintenanceRecord.update({
      where: { id: record.id },
      data: { completedDate: record.updatedAt || new Date() }
    });
  }

  console.log("Database update complete.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
