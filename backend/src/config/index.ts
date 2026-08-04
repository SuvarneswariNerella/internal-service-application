import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY || "",
};
