## Context
We need a simple way to map Zod error constants (e.g. `invalid_type`, `custom`) to localized Spanish strings without rewriting the entire Next.js routing architecture or maintaining our own massive key-value dictionary.

## Goals / Non-Goals

**Goals:**
- Translate Zod form errors to Spanish automatically.
- Keep the bundle footprint small and avoid touching core architecture like `app/`.

**Non-Goals:**
- Translating API response `detail` messages (those should be updated from the backend).
- Changing routing behavior.

## Decisions
- **`zod-i18n-map`**: We will rely on this library which is explicitly designed to solve this problem globally for Zod objects. We will inject it during the React rendering lifecycle at the root level (`layout.tsx`).

## Risks / Trade-offs
- **Risk**: `i18next` bundle size could slightly increase the initial page load if not lazy-loaded. 
- **Mitigation**: The translation string dictionary for Zod is very small and isolated, so the impact is minimal.
