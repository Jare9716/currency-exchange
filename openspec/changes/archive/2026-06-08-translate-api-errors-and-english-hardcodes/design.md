## Context

The system is configured to run exclusively in Spanish. However, there are minor leaks of English texts in the layout (`lang="en"`, metadata) and component attributes (e.g., aria-labels). Furthermore, backend API responses use English detail strings and standardized error codes which are surfaced directly to users in alerts and notifications.

## Goals / Non-Goals

**Goals:**

- Translate all local English labels, metadata, and document settings to Spanish.
- Design and implement a centralized translation layer for backend API response errors.
- Integrate the API error translation catalog with the existing `i18next` configuration.
- Ensure no modifications are needed in UI components to handle translation; translation must occur at the infrastructure/domain level.

**Non-Goals:**

- Implement multi-language routing (e.g., `/es`, `/en`) or language selection dropdowns in the Header.
- Replace existing hardcoded Spanish UI text with translation variables (these will remain hardcoded in Spanish).

## Decisions

### Decision 1: Centralized Translation in the `ApiError` Constructor and `HttpClient` Interceptor
- **Alternative A**: Translate errors inside UI components when catching exceptions.
- **Alternative B (Chosen)**: Translate details inside the `ApiError` constructor and locally generated errors within `HttpClient.ts`.
- **Rationale**: Isolating the translation logic in the infrastructure/domain layer keeps the presentation layer clean. UI components will automatically retrieve translated Spanish strings when accessing `error.message` or `error.detail`.

### Decision 2: Reuse `i18next` for the API Error Catalog
- **Alternative A**: Define a simple JavaScript mapping object in `Errors.ts`.
- **Alternative B (Chosen)**: Extend the existing `i18next` instance in `src/config/zod-i18n.ts` with an `"api"` namespace.
- **Rationale**: Reusing `i18next` leverages the existing setup, unifies internationalization tools, and keeps the configuration clean and maintainable.

## Risks / Trade-offs

- **[Risk]** New or unmapped error codes returned by the backend in the future.
  - **Mitigation**: If an error code or detail message is not found in the `"api"` namespace, the system will fall back to the original `detail` string returned by the backend.
