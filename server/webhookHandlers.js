export async function processStripeWebhook(payload, signature) {
  if (!Buffer.isBuffer(payload)) throw new Error('Stripe webhook payload must be a raw Buffer.')
  if (!signature) throw new Error('Stripe webhook signature is required.')
  throw new Error('Stripe webhook processing is managed by the Replit connector.')
}