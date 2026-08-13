import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.maintenanceRecord.findMany({
    orderBy: { createdAt: 'asc' }
  });

  let seq = 1001;
  for (const record of records) {
    if (!record.ticketNumber || record.ticketNumber.startsWith('TKT-17')) { // check if it's the old timestamp format or null
      await prisma.maintenanceRecord.update({
        where: { id: record.id },
        data: { ticketNumber: `TKT-${seq}` }
      });
      seq++;
    } else if (record.ticketNumber.startsWith('TKT-')) {
      const num = parseInt(record.ticketNumber.replace('TKT-', ''));
      if (!isNaN(num) && num >= seq) {
        seq = num + 1;
      }
    }
  }

  // Update workspaces to sync their next seq
  await prisma.workspace.updateMany({
    data: { ticketNextSeq: seq }
  });

  console.log('Successfully backfilled ticket numbers.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
