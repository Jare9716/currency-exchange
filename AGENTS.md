# currency-exchange — Agent Guide

> Entry point for AI coding assistants. This file is a map, not a manual.
> Read this first, then follow links to detailed sources.

## Architecture

This project follows **Clean Architecture** and **Domain-Driven Design (DDD)** principles.

```
src/
├── domain/          # Business logic, entities, interfaces (Zero dependencies)
├── use-cases/       # Application logic (e.g., AuthenticateUser, ExecuteTransaction)
├── presentation/    # Next.js pages, MUI components, and hooks
├── infrastructure/  # API calls, local storage, third-party integrations
├── app/             # Next.js App Router (Routing and Layouts)
├── context/         # React Context for global state
└── utils/           # Shared helpers
```

## Standards

Read the relevant standard before writing code (files in `docs/standards/` TBA):

| Topic                  | Description                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Clean Architecture** | Layers, dependency inversion, and DDD patterns                                         |
| **Frontend Standards** | [Next.js App Router, React, and MUI best practices](docs/standards/webapp-frontend.md) |
| **Styling & Theming**  | Strict MUI theming rules and design token management                                   |
| **Git & Commits**      | Conventional Commits and branching workflow                                            |
| **TypeScript & JS**    | [Types, error handling, and deps](docs/standards/typescript-javascript.md)             |
| **Testing**            | [Jest, AAA pattern, and structure](docs/standards/testing.md)                          |

## Key Rules

1.  **Strict Layering:** Domain layer MUST have zero dependencies on Next.js or MUI.
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

## UI / UX Implementation Notes

- **Login Flow:** Standard inputs for "Email Address" and "Password", plus a "Remember me" checkbox.
- **Dashboard:** Handle complex state including a User List and an active exchange interface (e.g., USD to COP ratio).
- **User Validation:** "New user" modal must trigger a validation step (blocked state for Clinton List check).

## Implementation Workflow

### Before Writing Code

1.  **Check requirements:** Ensure you understand the Figma designs via Figma MCP.
2.  **Create Spec:** If a complex feature, create a design doc in `docs/design-docs/`.
3.  **Plan:** Present an implementation plan and wait for approval if necessary.

### After Making Changes

1.  **Lint:** Run `npm run lint` and fix any issues.
2.  **Test:** (Once added) Run `npm test`.
3.  **Verify UI:** Use the browser tool to verify responsive design and theme consistency.

---

## Tech Stack Summary

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling & UI:** Material UI (MUI) v5+
- **State:** React Context or Redux
- **Integrations:** Figma MCP
