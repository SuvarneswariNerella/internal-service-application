const { execSync } = require('child_process');

try {
  console.log("Running prisma db push...");
  const output = execSync('npx prisma db push', { encoding: 'utf-8' });
  console.log(output);
} catch (error) {
  console.error("Failed to run prisma db push:");
  console.error(error.message);
  if (error.stdout) console.error("Stdout:", error.stdout);
  if (error.stderr) console.error("Stderr:", error.stderr);
}
