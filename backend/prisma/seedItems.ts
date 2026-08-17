import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCodes = [
  { name: "IT Consulting and Support", code: "998311", type: "SAC", description: "IT consulting and support services" },
  { name: "IT Design and Development", code: "998312", type: "SAC", description: "Web, App, Software Development" },
  { name: "IT Hosting Services", code: "998313", type: "SAC", description: "Cloud hosting, Servers" },
  { name: "IT Infrastructure Management", code: "998314", type: "SAC", description: "IT infrastructure and network management" },
  { name: "Computer Maintenance", code: "998315", type: "SAC", description: "Maintenance and repair services of computers" },
  { name: "IT Security Services", code: "998316", type: "SAC", description: "Cybersecurity, Audits" },
  { name: "Legal Advisory", code: "998111", type: "SAC", description: "Legal advisory and representation services" },
  { name: "Other Professional Services", code: "998399", type: "SAC", description: "Other professional, technical and business services" },
  { name: "Computers and Servers", code: "8471", type: "HSN", description: "Computers, Laptops, Servers" },
  { name: "Networking Equipment", code: "8517", type: "HSN", description: "Telephones, routers, switches" },
  { name: "Storage Devices", code: "8523", type: "HSN", description: "Hard drives, USB flash drives, pre-packaged software on physical media" },
];

async function main() {
  console.log("Seeding Item/HSN/SAC codes...");

  for (const item of defaultCodes) {
    const existing = await prisma.itemCode.findUnique({
      where: { name: item.name },
    });

    if (!existing) {
      await prisma.itemCode.create({
        data: item,
      });
      console.log(`Created: ${item.name}`);
    } else {
      console.log(`Already exists: ${item.name}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
