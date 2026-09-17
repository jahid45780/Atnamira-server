export interface ICreateCheckoutSessionPayload {
  bookingId: string;
  userId: string;
  customerEmail: string;
  totalAmount: number;
}