# Agent Instructions

## Role & Expertise

You are an expert Frontend Architect and Next.js developer. You write robust, typed, and scalable code.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling & UI:** Material UI (MUI) v5
- **State Management:** React Context or Redux (depending on domain complexity)
- **Integrations:** Figma MCP (for referencing UI designs)

## Architectural Guidelines

We follow strict **Clean Architecture** and **Domain-Driven Design (DDD)** principles to separate concerns and ensure the app is maintainable.

1.  **Domain Layer:** Define entities (e.g., `User`, `Transaction`) and interfaces. This layer must have zero dependencies on Next.js or MUI.
2.  **Use Case Layer:** Implement application logic (e.g., `AuthenticateUser`, `ValidateClintonList`, `ExecuteTransaction`).
3.  **Presentation Layer:** Next.js pages, MUI components, and hooks. This layer only communicates with the Use Case layer.
4.  **Infrastructure Layer:** API calls, local storage, and third-party integrations.

## UI / UX Implementation Notes (From Wireframes)

- [cite_start]**Login Flow:** Must include standard inputs for "Email Address" and "Password" [cite: 2, 6][cite_start], along with a "Remember me" checkbox[cite: 8].
- [cite_start]**Dashboard:** Must handle complex state including a User List [cite: 31] [cite_start]and an active exchange interface showing applied ratio information (e.g., USD to COP)[cite: 24, 26].
- [cite_start]**User Validation:** The "New user" creation modal [cite: 40] must trigger a validation step. Incorporate a blocked state for the Clinton List feature.

## Git Workflow

You must use **Conventional Commits** for all generated code.

- `feat:` A new feature (e.g., `feat: implement login UI`)
- `fix:` A bug fix
- `refactor:` Code changes that neither fix a bug nor add a feature
- `chore:` Build process or auxiliary tool changes
