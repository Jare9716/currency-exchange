## Why
We need Zod validation errors to display in Spanish instead of their default English strings without restructuring our entire App Router for internationalization.

## What Changes
- Install `zod-i18n-map` and `i18next`.
- Initialize `i18next` with the Spanish language strings provided by the library.
- Call `z.setErrorMap` inside a root `layout.tsx` import to apply these error translations globally to all Zod schemas.

## Capabilities

### New Capabilities
- `zod-error-translation`: Zod forms validation translation to Spanish globally.

### Modified Capabilities

## Impact
- **Dependencies**: New dependencies `zod-i18n-map` and `i18next` will be bundled.
- **UI Forms**: All forms utilizing Zod (e.g. Auth, Customers) will automatically surface Spanish errors.
