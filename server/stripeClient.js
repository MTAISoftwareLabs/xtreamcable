import { ReplitConnectors } from '@replit/connectors-sdk'

const connectors = new ReplitConnectors()

export async function stripeRequest(path, options = {}) {
  const response = await connectors.proxy('stripe', path, options)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `Stripe request failed with ${response.status}.`
    throw new Error(message)
  }
  return payload
}