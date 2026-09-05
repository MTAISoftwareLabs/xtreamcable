---
name: Stripe connector runtime
description: Runtime constraint for using the connected Stripe account from the Express server.
---

Use the Replit Connectors SDK proxy for server-side Stripe API calls instead of assuming raw connector identity variables or secret-key settings are available in the workflow environment.

**Why:** The workflow exposes the connector host but may withhold the raw identity variables used by lower-level connection lookups. The SDK resolves the runtime identity without placing credentials in application code.

**How to apply:** Keep Stripe reads and writes behind a small server-side proxy helper, and treat live catalog/invoice reads as the source of truth when webhook-secret setup is unavailable.