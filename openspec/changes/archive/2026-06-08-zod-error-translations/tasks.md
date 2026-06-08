# Tasks
1. **Install Packages**: `pnpm add zod-i18n-map i18next`
2. **Create Configuration**: Create `src/config/zod-i18n.ts`. It should import `i18next`, `zod`, and `zod-i18n-map` and initialize `i18next` with the Spanish translations. Then call `z.setErrorMap(zodI18nMap)`.
3. **Initialize Configuration**: Import `src/config/zod-i18n.ts` into `src/app/layout.tsx`.
