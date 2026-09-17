import { z } from "zod";

export const createBookingSchema = z.object({});

export type CreateBookingPayload = z.infer<
  typeof createBookingSchema
>;