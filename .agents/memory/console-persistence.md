---
name: Console persistence
description: Durable persistence rule for the XTREAM CABLE operator console.
---

All operator-facing mutations should be validated and committed by the Express/PostgreSQL backend, then the client should reload its authenticated bootstrap payload. Do not treat browser state as the source of truth.

**Why:** The console is expected to be usable across devices and servers; local-only changes disappear on refresh or appear inconsistent between operators.

**How to apply:** Add a protected API route for each new resource or mutation, log the activity where appropriate, and call the shared client refresh path after a successful write.