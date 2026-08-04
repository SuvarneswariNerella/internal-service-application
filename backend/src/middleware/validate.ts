import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      res.status(400).json({ success: false, error: "Validation failed", details: errors });
      return;
    }
    req.body = result.data;
    next();
  };
}
