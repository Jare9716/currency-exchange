# Project Refactoring Plan

This document outlines the proposed refactoring steps to align the current codebase with the newly established **Clean Architecture**, **TypeScript**, and **Frontend** standards.

## Audit Findings & Misalignments

1.  **Domain & Type Safety:** Heavy use of `null` in repository interfaces and domain models (New standard: `undefined` over `null`).
2.  **State Management:** Usage of `React Context` with complex hydration logic in `UsersContext.tsx` (New standard: Prefer **Zustand** stores).
3.  **Data Validation:** No centralized validation for external data or form inputs (New standard: Mandatory **Zod** schema parsing).
4.  **Error Handling:** Use Cases throw plain `Error` objects (New standard: Structured error codes in `snake_case`).
5.  **Component Structure:** Large components with mixed concerns (e.g., `LoginForm.tsx`) and hardcoded redirection logic.

## Proposed Refactoring Phases

### Phase 1: Core Domain & Repository Interfaces (Completed)
- **Files to Modify:** `src/domain/*.ts`
- **Actions:**
  - Update all interfaces to return `undefined` instead of `null`.
  - Define custom error classes (e.g., `DomainError`) with codes like `user_not_found`, `access_denied`.

### Phase 2: State Management (Zustand Migration) (Completed)
- **Files to Modify:** `src/presentation/stores/users.store.ts` [NEW], `src/context/UsersContext.tsx` [DELETE]
- **Actions:**
  - Create a Zustand store to manage user state and localStorage persistence.
  - Remove `UsersContext` and update the root layout.

### Phase 3: App Router Audit & Optimization (Completed)
- **Files to Modify:** `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- **Actions:**
  - Remove `page.module.css` (unused).
  - Move `globals.css` and `theme/` to `src/presentation/styles/`.
  - Move `favicon.ico` to `public/`.
  - Simplify `globals.css` to avoid conflicts with MUI `CssBaseline`.
  - Update `layout.tsx` with meaningful metadata.
  - Implement a redirect or unified route for the Login screen.

### Phase 4: Component Architecture Restructuring (FSD Pattern) (Completed)
- **Files to Modify:** `src/presentation/components/*`, `src/app/*`
- **Actions:**
  - Create directories: `ui/`, `layout/`, and `features/` (auth, users, exchange) inside `src/presentation/components/`.
  - Move `Sidebar.tsx` to `layout/`.
  - Move `LoginForm.tsx` to `features/auth/`.
  - Move `UserList.tsx` and `CreateUserModal.tsx` to `features/users/`.
  - Move `CurrencyExchangeForm.tsx` to `features/exchange/`.
  - Update all internal imports across the application to reflect these new paths.

### Phase 5: Infrastructure & Repository Implementation
- **Files to Modify:** `src/infrastructure/MockTransactionRepository.ts`, `src/infrastructure/MockUserRepository.ts`
- **Actions:**
  - Standardize error handling in repository methods.
  - Ensure compatibility with the `undefined` return types.

### Phase 6: Presentation & Validation
- **Files to Modify:** `src/presentation/components/features/auth/LoginForm.tsx`, `src/app/login/page.tsx`
- **Actions:**
  - Implement **Zod** schema for credentials validation.
  - Refactor `LoginForm` into smaller, atomic components (Inputs, Buttons).
  - Use a dedicated hook or state for redirection logic.

## Verification Plan

### Automated Tests
- Once Jest is configured, implement unit tests mirroring the `src/` structure as defined in the **Testing Standards**.

### Manual Verification
- **Functionality:** Verify that Login, User Listing, and Transactions still work as expected.
- **Standards Check:** Ensure no `null` usage remains in the public API of the domain/use-cases.
- **Performance:** Confirm that hydration and state updates in the new Zustand store are efficient.
