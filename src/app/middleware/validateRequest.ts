
import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type RequestSchema = {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
};

export const validateRequest =
  <T extends RequestSchema>(schema: ZodSchema<T>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Body validation
      if (validatedData.body !== undefined) {
        req.body = validatedData.body;
      }

      // Params validation
      if (validatedData.params !== undefined) {
        req.params = validatedData.params as typeof req.params;
      }

      // Query validation
      if (validatedData.query !== undefined) {
        req.query = validatedData.query as typeof req.query;
      }

      next();
    } catch (error) {
      next(error);
    }
  };

