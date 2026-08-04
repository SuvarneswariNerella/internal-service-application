import { describe, it, expect } from "vitest";
import { cn } from "@/utils/cn";

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("should handle conditional classes", () => {
    const result = cn("base", false && "hidden", true && "visible");
    expect(result).toContain("base");
    expect(result).toContain("visible");
    expect(result).not.toContain("hidden");
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle single class", () => {
    const result = cn("text-lg");
    expect(result).toBe("text-lg");
  });

  it("should handle Tailwind merge conflicts", () => {
    const result = cn("px-4 py-2", "px-8");
    expect(result).toBe("py-2 px-8");
  });
});
