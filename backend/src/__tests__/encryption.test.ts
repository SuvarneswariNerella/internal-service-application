import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt } from "@/utils/encryption";

beforeAll(() => {
  process.env.CREDENTIAL_ENCRYPTION_KEY = "test-encryption-key-for-testing-1234";
});

describe("Encryption Utils", () => {
  it("should encrypt and decrypt text correctly", () => {
    const originalText = "my-secret-password-123";
    const encrypted = encrypt(originalText);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it("should produce different encrypted output for the same input (random IV)", () => {
    const text = "same-password";
    const encrypted1 = encrypt(text);
    const encrypted2 = encrypt(text);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("should handle empty strings", () => {
    const encrypted = encrypt("");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("should handle special characters", () => {
    const text = "p@$$w0rd!#%^&*()_+-=[]{}|;':\",./<>?";
    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it("should handle long strings", () => {
    const text = "a".repeat(10000);
    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it("should throw on invalid encrypted text", () => {
    expect(() => decrypt("invalid")).toThrow();
  });
});
