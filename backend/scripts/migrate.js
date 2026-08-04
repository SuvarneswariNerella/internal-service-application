const { execSync } = require("child_process");
try {
  console.log("Running prisma db push...");
  execSync("npx prisma db push", { stdio: "inherit" });
  console.log("Running prisma generate...");
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("Database schema updated successfully!");
} catch (err) {
  console.error("Migration error:", err);
}
