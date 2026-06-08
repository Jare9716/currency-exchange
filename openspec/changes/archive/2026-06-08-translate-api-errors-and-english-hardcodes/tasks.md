## 1. UI and Local Hardcode Translations

- [ ] 1.1 Translate global metadata (`title`, `description`) and set `lang="es"` in `src/app/layout.tsx`.
- [ ] 1.2 Translate the `aria-label="toggle password visibility"` to Spanish in `src/presentation/components/features/auth/LoginForm.tsx`.
- [ ] 1.3 Translate the locally thrown error message `"No active session token found. Please log in."` to Spanish in `src/utils/jwt.ts`.
- [ ] 1.4 Translate local error fallback strings in `src/infrastructure/http/HttpClient.ts` (`"An unknown error occurred"`, `"field"`, `"invalid value"`).

## 2. API Response and Error Code Translation

- [ ] 2.1 Extend the `i18next` initialization in `src/config/zod-i18n.ts` by adding the `"api"` namespace with a Spanish translation catalog for common backend error codes (e.g. `TOKEN_INVALID`, `UNAUTHORIZED`, `VALIDATION_ERROR`, etc.) and specific detail strings.
- [ ] 2.2 Implement a `translateApiError` translation helper that maps backend `error_code` or `detail` messages to Spanish strings using `i18next`.
- [ ] 2.3 Integrate the translation helper into the `ApiError` class constructor in `src/domain/Errors.ts` so that all UI alerts and boundary screens fetch translated values automatically.
- [ ] 2.4 Verify that the application builds and all lint/tests compile successfully.
