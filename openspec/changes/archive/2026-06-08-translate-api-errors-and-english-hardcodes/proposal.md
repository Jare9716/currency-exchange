## Why

The currency exchange admin dashboard contains several English texts and metadata leaks (e.g. `lang="en"`, accessibility attributes, locally thrown errors) that break the Spanish-only user experience. We need to translate all local English text elements to Spanish and implement a centralized translation mechanism for backend API responses.

## What Changes

- Update HTML lang setting from "en" to "es" and translate global metadata (`title`, `description`) in `layout.tsx`.
- Translate remaining English aria-labels in UI components (e.g. `aria-label` in `LoginForm.tsx`).
- Translate infrastructure-level error messages thrown locally in `jwt.ts` and `HttpClient.ts`.
- Implement an API error translation mapping mechanism in the HTTP client and `ApiError` using the existing `i18next` configuration.
- Configure a new translation namespace (`api`) in `src/config/zod-i18n.ts` to map backend error codes (`TOKEN_INVALID`, `UNAUTHORIZED`, etc.) to Spanish error messages.

## Capabilities

### New Capabilities
- `api-error-translation`: Centralized translation of backend API error codes and details to Spanish.

### Modified Capabilities

## Impact

- `src/app/layout.tsx`: HTML lang attribute and page metadata.
- `src/presentation/components/features/auth/LoginForm.tsx`: Accessibility aria-labels.
- `src/utils/jwt.ts` & `src/infrastructure/http/HttpClient.ts`: Local error messages and HTTP response interceptors.
- `src/config/zod-i18n.ts`: i18next configuration to support the API translations catalog.
- `src/domain/Errors.ts`: Constructor mapping in `ApiError`.
