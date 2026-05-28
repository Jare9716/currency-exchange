# Authentication & Session Specification

## Purpose

Provides secure cashier authentication, multi-tenant scoped token pair acquisition, central interceptor token refreshing, and strict in-memory session hygiene.

## Requirements

### Requirement: cashier-authentication

The system SHALL validate credentials through the Auth Service and return scoped access and refresh tokens.

#### Scenario: successful login with valid credentials
- GIVEN an operator is on the login screen
- WHEN they enter a valid email and password combination
- THEN the system returns a valid token pair consisting of `access_token` and `refresh_token`
- AND redirects the operator securely to the dashboard

#### Scenario: failed login with invalid credentials
- GIVEN an operator attempts to login
- WHEN they enter an incorrect email or password
- THEN the system propagates an `INVALID_CREDENTIALS` error with HTTP 401
- AND blocks access to the dashboard, rendering a helpful error message

#### Scenario: account lock on repeated failures
- GIVEN a user account has reached five consecutive failed login attempts
- WHEN the user attempts to log in again
- THEN the system returns an `ACCOUNT_LOCKED` error with HTTP 429
- AND blocks further attempts for a cooldown period specified by the backend

---

### Requirement: session-token-refresh

The system SHALL centralize token refreshing within the global HttpClient, transparently retrying requests on token expiration.

#### Scenario: access token expired retries successfully
- GIVEN a cashier session has an expired access token but a valid refresh token
- WHEN a secure request is made through the HttpClient
- THEN the HttpClient intercepts the 401 `TOKEN_INVALID` error
- AND silently dispatches a request to `/api/v1/auth/refresh`
- AND updates the access token in-memory
- AND retries the original request seamlessly without operator interruption

#### Scenario: refresh token expired triggers logout
- GIVEN a cashier session has an expired refresh token
- WHEN a secure request is made and intercepts a `TOKEN_INVALID` error
- AND the token refresh call fails with HTTP 401
- THEN the HttpClient wipes all active tokens in-memory
- AND dispatches a `session:expired` event
- AND redirects the operator immediately to the login page

---

### Requirement: secure-logout-hygiene

The system SHALL wipe all sensitive in-memory data, state registers, and transaction caches upon logout to prevent cross-session PII leaks.

#### Scenario: sensitive store reset on logout
- GIVEN an active operator session with in-memory transaction histories, client details, and active turnos
- WHEN the operator clicks the "Logout" button
- THEN the system dispatches clear/reset actions across all Zustand stores (Auth, Shift, Customers, Transactions)
- AND redirects the browser path to `/login`
- AND prevents any subsequent login on the same browser tab from viewing the previous user's data

---

## Implementation Context

Relevant skills:
- [docs/standards/security.md](../../../docs/standards/security.md)
- [docs/standards/state-management.md](../../../docs/standards/state-management.md)

Relevant endpoints:
- `POST /api/v1/auth/login` — authenticate user credentials
- `POST /api/v1/auth/refresh` — obtain a new token pair using refresh token
- `POST /api/v1/auth/logout` — revoke active refresh token

## Notes
- Token storage must strictly stay in-memory (Zustand state) or highly secure preferences.
- Sensitive PII data must NEVER be persisted to browser `localStorage` or `sessionStorage` via Zustand `persist` middleware.
