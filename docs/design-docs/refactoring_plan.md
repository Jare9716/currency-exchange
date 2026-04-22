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

### Phase 2: State Management (Zustand Migration)
- **Files to Modify:** `src/presentation/stores/users.store.ts` [NEW], `src/context/UsersContext.tsx` [DELETE]
- **Actions:**
  - Create a Zustand store to manage user state and localStorage persistence.
  - Remove `UsersContext` and update the root layout.

### Phase 3: Infrastructure & Repository Implementation
- **Files to Modify:** `src/infrastructure/MockTransactionRepository.ts`, `src/infrastructure/MockUserRepository.ts`
- **Actions:**
  - Standardize error handling in repository methods.
  - Ensure compatibility with the `undefined` return types.

### Phase 4: Presentation & Validation
- **Files to Modify:** `src/presentation/components/LoginForm.tsx`, `src/app/login/page.tsx`
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
