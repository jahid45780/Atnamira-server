import { stripe } from "../../config/stripe.config";


// ======================================================
// GET CHECKOUT SESSION
// ======================================================

const getCheckoutSession = async (
  sessionId: string,
) => {
  const session =
    await stripe.checkout.sessions.retrieve(
      sessionId,
    );

  return session;
};


export const paymentService = {
  getCheckoutSession,
};