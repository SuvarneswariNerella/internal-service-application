const { execSync } = require("child_process");
const path = require("path");

try {
  console.log("Running prisma generate with stdio ignore...");
  execSync("npx prisma generate", {
    cwd: path.join(__dirname, ".."),
    stdio: "ignore"
  });
  console.log("Prisma generate completed successfully!");
} catch (err) {
  console.error("Prisma generate error:", err);
}
