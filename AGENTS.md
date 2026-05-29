# currency-exchange — Agent Guide

> Entry point for AI coding assistants. This file is a map, not a manual.
> Read this first, then follow links to detailed sources.

## Architecture

This project follows **Clean Architecture** and **Domain-Driven Design (DDD)** principles.

```
src/
├── domain/          # Business logic, entities, interfaces (Zero dependencies)
├── use-cases/       # Application logic (e.g., AuthenticateUser, ExecuteTransaction)
├── presentation/    # UI Layer: Components, Hooks, Stores, and Styles
│   ├── components/  # FSD Components (ui, layout, features)
│   ├── stores/      # Zustand state management
│   └── styles/      # Global CSS and MUI Theme configuration
├── infrastructure/  # Repositories, API calls, and third-party integrations
├── app/             # Next.js App Router (Routing and Layouts)
├── config/          # Global configuration and environment variables
└── utils/           # Shared helpers
```

## Standards

Read the relevant standard before writing code (files in `docs/standards/` TBA):

| Topic                       | Description                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Clean Architecture**      | Layers, dependency inversion, and DDD patterns                                                                    |
| **Frontend Standards**      | [Next.js App Router, React, and MUI best practices](docs/standards/webapp-frontend.md)                            |
| **Styling & Theming**       | Strict MUI theming rules and design token management                                                              |
| **Git & Commits**           | Conventional Commits and branching workflow                                                                       |
| **TypeScript & JS**         | [Types, error handling, and deps](docs/standards/typescript-javascript.md)                                        |
| **Testing**                 | [Jest, AAA pattern, and structure](docs/standards/testing.md)                                                     |
| **UI / UX**                 | [Usability, proportions, and alignment](docs/standards/ui-ux.md)                                                  |
| **Security**                | [PII safety, compliance checks, query encoding, and centralized token refresh](docs/standards/security.md)        |
| **State Management**        | [Store hygiene, minimal write surface, and Zod API schema boundary](docs/standards/state-management.md)             |
| **Spec-Driven Development** | [OpenSpec SDD workflow, proposals, behavioral specs, and change tracking](openspec/README.md)                      |

## Key Rules

1.  **Strict Layering:** Domain layer MUST have zero dependencies on Next.js or MUI. *(Exception: `zod` is allowed in Domain as a language-level type/validation utility).*
2.  **Ports & Interfaces:** Use Case layer only communicates with Domain interfaces.
3.  **Strict Theming:** NEVER hardcode colors, typography, or spacing (no `color: '#123456'`). Always use `theme.palette.*`.
4.  **No Placeholders:** If you need an image, use the `generate_image` tool.
5.  **Use `undefined`** over `null`.
6.  **Named exports** over default exports.
7.  **Small Changes:** PRs/Changes should ideally be under 300 LOC and focused.
8.  **Conventional commits:** `feat:`, `fix:`, `refactor:`, `chore:`.
9.  **No `SELECT *`** or similar anti-patterns in data fetching.
10. **Error Handling:** Standardize on snake_case error codes and proper boundary handling.
11. **Testing Structure:** `test/` directory MUST mirror `src/` structure (e.g., `test/domain/`, `test/use-cases/`).
12. **Path Aliases:** Always use the `@/*` prefix for imports from the `src/` directory.
13. **Git Hooks:** Automated linting (pre-commit) and testing (pre-push) are enforced via Husky. Never bypass these hooks.
14. **No persistent caching of dynamic collections or PII:** NEVER persist dynamic collections (e.g., Customers, Transactions) or sensitive Personally Identifiable Information (PII) using Zustand's `persist` middleware or browser `localStorage`. Caching is strictly limited to transient authentication tokens or client-side UI configurations/preferences (e.g., Theme/Layout). See [Security Standards](docs/standards/security.md) for full context.
15. **No `null` in component state or props:** Use `undefined` instead of `null` for optional state and props (e.g., `useState<Customer | undefined>(undefined)` not `useState<Customer | null>(null)`). See [State Management Standards](docs/standards/state-management.md) for the full rationale.
16. **API Schema Boundary:** Every infrastructure repository MUST define a private `apiXxxSchema` using `.nullish().transform(val => val ?? undefined)` for all nullable optional fields. Never use domain schemas directly to parse API responses. See [State Management Standards §6](docs/standards/state-management.md).
17. **No Client-Side Filtering:** Never perform client-side/in-memory filtering as a workaround for backend query issues. All data filtering, pagination, and sorting must be driven strictly by the backend endpoints.
18. **Spec-Driven Development (SDD):** All new features, business rules, or behavioral modifications MUST follow the OpenSpec SDD workflow. No code changes or logic should be introduced without registering a corresponding change proposal or behavioral spec in the `openspec/` directory. See [OpenSpec SDD Guide & Active Specifications Directory](openspec/README.md).

## UI / UX Implementation Notes

- **Login Flow:** Standard inputs for "Email Address" and "Password", plus a "Remember me" checkbox.
- **Dashboard:** Handle complex state including a Customer List and an active exchange interface (e.g., USD to COP ratio).
- **User Validation:** "New customer" modal must trigger a validation step (blocked state for Clinton List check).

## Implementation Workflow

### Before Writing Code

1.  **Check requirements:** Ensure you understand the Figma designs via Figma MCP.
2.  **Propose Changes (SDD):** Initiate the OpenSpec workflow via `npx -y @fission-ai/openspec propose "<description>"` (or create/edit proposal templates in `openspec/changes/`). Define exact behavioral specifications, design deltas, and implementation tasks.
3.  **Plan:** Present an implementation plan targeting the spec and tasks, and wait for approval if necessary.

### After Making Changes

1.  **Lint:** Run `pnpm lint` and fix any issues.
2.  **Test:** (Once added) Run `pnpm test`.
3.  **Verify UI:** Use the browser tool to verify responsive design and theme consistency.
4.  **Archive Changes (SDD):** Complete and register the behavioral specification into `openspec/specs/` using `npx -y @fission-ai/openspec archive`.

---

## Tech Stack Summary

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling & UI:** Material UI (MUI) v5+
- **State:** Zustand (Persistent stores)
- **Package Manager:** pnpm
- **Integrations:** Figma MCP
