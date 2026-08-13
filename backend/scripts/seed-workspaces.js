const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding workspaces...");

  const workspaces = [
    {
      displayName: "Edunura",
      shortCode: "EDN",
      legalName: "Edunura Education Tech Private Limited",
      gstin: "27AAACE1234F1Z1",
      state: "27 - Maharashtra",
      defaultCurrency: "INR",
      invoicePrefix: "EDU/2026/002",
      estimatePrefix: "EDU/EST/2026/001",
      poPrefix: "EDU/PO/2026/001",
      bankName: "HDFC Bank",
      bankBranch: "Vashi",
      accountNumber: "50200088112233",
      ifscCode: "HDFC0000123",
      activeClients: 5,
      logoUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&h=120&fit=crop"
    },
    {
      displayName: "Bigfish Cinema",
      shortCode: "BFC",
      legalName: "Bigfish Cinema & Media Studios Pvt Ltd",
      gstin: "27AAACB5678G1Z9",
      state: "27 - Maharashtra",
      defaultCurrency: "INR",
      invoicePrefix: "BIG/2026/001",
      estimatePrefix: "BIG/EST/2026/001",
      poPrefix: "BIG/PO/2026/001",
      bankName: "ICICI Bank",
      bankBranch: "Juhu",
      accountNumber: "000405019988",
      ifscCode: "ICIC0000004",
      activeClients: 50,
      logoUrl: "https://images.unsplash.com/photo-1485230405346-71acb9518d9c?w=120&h=120&fit=crop"
    },
    {
      displayName: "Vollywide Media",
      shortCode: "VWM",
      legalName: "Vollywide Media Services",
      gstin: "29AAACV9012H1Z2",
      state: "29 - Karnataka",
      defaultCurrency: "INR",
      invoicePrefix: "VWM/2026/001",
      estimatePrefix: "VWM/EST/2026/001",
      poPrefix: "VWM/PO/2026/001",
      bankName: "Axis Bank",
      bankBranch: "Indiranagar",
      accountNumber: "910200012345678",
      ifscCode: "UTIB0000123",
      activeClients: 10,
      logoUrl: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=120&h=120&fit=crop"
    },
    {
      displayName: "Aprogra",
      shortCode: "APR",
      legalName: "Aprogra Tech Solutions",
      gstin: "07AAACA3456J1Z5",
      state: "07 - Delhi",
      defaultCurrency: "INR",
      invoicePrefix: "APR/2026/001",
      estimatePrefix: "APR/EST/2026/001",
      poPrefix: "APR/PO/2026/001",
      bankName: "SBI",
      bankBranch: "Connaught Place",
      accountNumber: "12345678901",
      ifscCode: "SBIN0000691",
      activeClients: 30,
      logoUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=120&h=120&fit=crop"
    }
  ];

  for (const wp of workspaces) {
    const existing = await prisma.workspace.findFirst({
      where: { shortCode: wp.shortCode }
    });
    
    if (!existing) {
      await prisma.workspace.create({
        data: wp
      });
      console.log(`Created workspace: ${wp.displayName}`);
    } else {
      console.log(`Workspace ${wp.displayName} already exists.`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
