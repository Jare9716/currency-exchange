# Frontend Integration Guide

API contract for the frontend team. Covers authentication flow, multi-tenant model, request/response schemas, error handling, role model, and every feature area built so far.

> **Interactive docs**: `http://localhost:8000/docs` (Swagger — Bearer token persists across reloads)

---

## Table of Contents

1. [Base URLs](#base-urls)
2. [CORS & rate limiting](#cors--rate-limiting)
3. [Multi-tenant model](#multi-tenant-model)
4. [Authentication](#authentication)
5. [Number formatting contract](#number-formatting-contract)
6. [Pagination contract](#pagination-contract)
7. [Error response format](#error-response-format)
8. [Error code catalog](#full-error-code-catalog)
9. [Password requirements](#password-requirements)
10. [Role model](#role-model)
11. [Tenant lifecycle](#tenant-lifecycle)
12. [Response headers](#response-headers)
13. [Endpoint samples](#endpoint-samples)
    - [Auth](#auth-apiv1auth)
    - [Tenants](#tenants-apiv1tenants--super_admin-only)
    - [Users](#users-apiv1users)
    - [Branches](#branches-apiv1branches)
    - [Company](#company-apiv1company)
    - [Currency / TRM](#currency-apiv1currency)
    - [Sanctions](#sanctions-apiv1sanction-lists)
    - [FX Operations](#fx-operations-apiv1fx)
    - [Customers / KYC](#customers--kyc-apiv1customers)
    - [Accounting](#accounting-apiv1accounting)
    - [Regulatory Reports](#regulatory-reports-apiv1reports)
    - [Data Imports](#data-imports-apiv1imports--super_admin-only)
    - [Reference Data](#reference-data-apiv1reference)
    - [Infrastructure](#infrastructure)

---

## Base URLs

| Environment | URL |
|-------------|-----|
| Local dev | `http://localhost:8000` |
| Staging | TBD |
| Production | TBD |

---

## CORS & rate limiting

### CORS

The server is configured with `allow_credentials: true`. Your requests must include credentials when using cookie-based flows. The following headers are whitelisted:

| Allowed request headers |
|---|
| `Authorization` |
| `Content-Type` |
| `X-Request-ID` |
| `Accept` |

Allowed methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.

Allowed origins are environment-specific (set via `CORS_ORIGINS` env var). In local dev this is typically `http://localhost:3000` or `http://localhost:5173`.

### Rate limiting

**100 requests per 60-second window per IP address.** This is enforced per worker process (not shared across replicas in production — edge-level rate limiting handles that).

When the limit is exceeded the server returns **HTTP 429** with this body:

```json
{
  "detail": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

> Note: this 429 shape is **different** from the standard `AppError` shape — it does not have `error_code`. Check `status === 429` directly before trying to read `error_code`.

---

## Multi-tenant model

Every user belongs to **one global identity** but can be a member of **multiple companies (tenants)**. The session token is always scoped to one company at a time.

```
users (global)
  └── memberships → tenant A  (role: owner)
  └── memberships → tenant B  (role: operator)
```

This means:
- One email + password for all companies
- Different roles per company
- Login may ask which company to enter if the user belongs to more than one

---

## Authentication

### Token pair

Every successful login returns two tokens:

| Token | Lifetime | Purpose |
|-------|----------|---------|
| `access_token` | 30 min | `Authorization: Bearer <token>` on every request |
| `refresh_token` | 7 days | Used once to get a new pair. Immediately rotated on use. |

Store both in memory or secure storage. Never expose in URLs.

### Password expiry warning

When a user's password is within **7 days or 1 day** of expiry, login still succeeds and returns a normal token pair, but the response will include `must_change_password: false` with an additional `password_expires_in_days` field. Show a non-blocking banner so the user can act before being locked out.

When the password **has** expired, login returns `must_change_password: true` — block all app routes and redirect to the change-password screen immediately.

```javascript
// Axios interceptor
axios.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${store.accessToken}`;
  return config;
});

// On 401 TOKEN_INVALID → refresh, then retry once
axios.interceptors.response.use(null, async error => {
  const { error_code } = error.response?.data ?? {};
  if (error_code === 'TOKEN_INVALID' && !error.config._retried) {
    error.config._retried = true;
    await store.refreshTokens();
    return axios(error.config);
  }
  return Promise.reject(error);
});
```

---

## Number formatting contract

All monetary amounts, exchange rates, spreads, and percentages are returned as **JSON strings** (Python `Decimal` serialized as a string), not as floating-point numbers.

```json
{ "cop_amount": "2097285.00", "exchange_rate": "4194.57", "spread": "0.0050" }
```

**Never** parse these with `parseFloat()` or JavaScript `Number()` — you will lose precision on large COP amounts. Use a decimal library instead:

```typescript
import Decimal from 'decimal.js';

const cop = new Decimal(tx.cop_amount);       // "2097285.00" → safe
const rate = new Decimal(tx.exchange_rate);   // "4194.57"    → safe
```

The same applies to request bodies — you may send numbers or strings, but strings are safest.

---

## Pagination contract

Every list endpoint that supports pagination returns the **same envelope shape**:

```json
{
  "items": [ ...objects... ],
  "total": 142,
  "page": 1,
  "size": 20
}
```

| Field | Type | Meaning |
|---|---|---|
| `total` | integer | Total records matching the filter (not just this page) |
| `page` | integer | Current page (1-based) |
| `size` | integer | Page size requested |

Standard query params: `?page=1&size=20`. Maximum `size` is **100** for most endpoints.

```typescript
// Generic hook pattern
const totalPages = Math.ceil(response.total / response.size);
const hasNext = response.page < totalPages;
```

Endpoints that return plain arrays (not paginated): `/fx/products`, `/branches`, `/voucher-types`, `/reference/*`, `/sanctions/persons/{id}`.

---

## Error response format

**Every** error across the entire API returns this shape:

```json
{
  "status_code": 403,
  "error_code": "NO_ACTIVE_MEMBERSHIP",
  "detail": "Your credentials are valid but you have no active tenant memberships.",
  "hint": "All your tenant accounts may be suspended. Contact your platform administrator."
}
```

| Field | Always present | Purpose |
|---|---|---|
| `status_code` | ✅ | HTTP status code (also in response header) |
| `error_code` | ✅ | Machine-readable identifier — **switch on this** |
| `detail` | ✅ | Human-readable description |
| `hint` | ❌ optional | Actionable guidance — safe to show to the user |

> **Rule**: Switch on `error_code`. Never string-match `detail`.

---

## Full error code catalog

### Authentication

| `error_code` | HTTP | When |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `ACCOUNT_LOCKED` | 429 | Too many failed attempts — detail includes wait time |
| `ACCOUNT_INACTIVE` | 401 | User account has been deactivated |
| `TOKEN_INVALID` | 401 | Token missing, malformed, revoked, **or expired** — always trigger a refresh |
| `SESSION_EXPIRED` | 401 | Tenant-selection or 2FA state token expired or already used |

### Tenant / membership access

| `error_code` | HTTP | When |
|---|---|---|
| `NO_ACTIVE_MEMBERSHIP` | 403 | Credentials valid, but all tenant memberships are suspended |
| `TENANT_SUSPENDED` | 403 | The tenant for this session has been suspended |
| `TENANT_INACTIVE` | 403 | The selected tenant is not active |
| `NO_TENANT_CONTEXT` | 403 | Token has no tenant scope (shouldn't happen normally) |

### Permissions

| `error_code` | HTTP | When |
|---|---|---|
| `PERMISSION_DENIED` | 403 | Role is not allowed for this action — `hint` lists required roles |
| `ROLE_PRIVILEGE_VIOLATION` | 403 | Trying to assign a role above your own level |
| `NO_BRANCH_ASSIGNED` | 403 | operator/readonly account has no branch — contact admin |

### Password

| `error_code` | HTTP | When |
|---|---|---|
| `PASSWORD_EXPIRED` | 403 | Must change password before continuing |
| `PASSWORD_INCORRECT` | 400 | Current password is wrong |
| `PASSWORD_WEAK` | 422 | New password does not meet strength requirements |
| `PASSWORD_REUSE` | 400 | New password is the same as current |

### Invitations

| `error_code` | HTTP | When |
|---|---|---|
| `INVITE_INVALID` | 400 | Token not found or already used |
| `INVITE_EXPIRED` | 400 | Invite link has expired — request a new one |
| `INVITE_ALREADY_ACCEPTED` | 400 | User already completed onboarding |

### 2FA

| `error_code` | HTTP | When |
|---|---|---|
| `TWO_FA_REQUIRED` | 401 | Must complete 2FA to continue |
| `TWO_FA_INVALID` | 400 | Wrong code or backup code |
| `TWO_FA_ALREADY_ENABLED` | 400 | 2FA is already on |
| `TWO_FA_NOT_ENABLED` | 400 | 2FA is not on |
| `TWO_FA_SETUP_REQUIRED` | 400 | Call /2fa/setup first |

### Users

| `error_code` | HTTP | When |
|---|---|---|
| `USER_NOT_FOUND` | 404 | User not found in this tenant |
| `USER_ALREADY_IN_TENANT` | 409 | Email already has a membership in this tenant |
| `INVALID_ROLE` | 422 | Role value not in allowed list |
| `SELF_DEACTIVATION` | 400 | Cannot deactivate your own account |

### Branches

| `error_code` | HTTP | When |
|---|---|---|
| `BRANCH_NOT_FOUND` | 404 | Branch code not found |
| `BRANCH_ALREADY_EXISTS` | 409 | Branch code already exists in this tenant |

### Tenants

| `error_code` | HTTP | When |
|---|---|---|
| `TENANT_NOT_FOUND` | 404 | Tenant slug not found |
| `TENANT_ALREADY_EXISTS` | 409 | Slug already taken |
| `TENANT_STATUS_UNCHANGED` | 400 | Tenant is already in that status |
| `INVALID_TENANT_STATUS` | 422 | Not a valid status value |
| `INVALID_STATUS_TRANSITION` | 422 | Transition not allowed — `hint` lists valid ones |

### Currency

| `error_code` | HTTP | When |
|---|---|---|
| `CURRENCY_INVALID_REQUEST` | 400 | Invalid currency code or amount |
| `INVALID_DATE_RANGE` | 400 | Date range invalid (future, reversed, or > 30 days) |
| `RATE_UNAVAILABLE` | 503 | External provider temporarily unavailable |

### Sanctions

| `error_code` | HTTP | When |
|---|---|---|
| `SANCTIONS_DB_UNAVAILABLE` | 503 | Sanctions catalog DB unavailable |
| `SANCTIONS_TOO_MANY_CASES` | 400 | Exceeded max cases per screening request |

### Customers / KYC

| `error_code` | HTTP | When |
|---|---|---|
| `CUSTOMER_ALREADY_EXISTS` | 409 | Document type + number already registered in this tenant |
| `CUSTOMER_NOT_FOUND` | 404 | Customer ID not found |

### FX Operations

| `error_code` | HTTP | When |
|---|---|---|
| `NO_OPEN_SHIFT` | 404 | No open shift exists for the requested branch |
| `SHIFT_ALREADY_EXISTS` | 409 | Branch already has an open shift today |
| `SHIFT_NOT_FOUND` | 404 | Shift ID not found |
| `TRANSACTION_NOT_FOUND` | 404 | Transaction ID not found |
| `INSUFFICIENT_STOCK` | 422 | Not enough available stock for this sell transaction |
| `PRODUCT_NOT_FOUND` | 404 | ISO currency code not configured as a product |
| `PRODUCT_INACTIVE` | 422 | Currency product is not active for trading |
| `RATE_GUARD_RAIL_BREACH` | 422 | Proposed rate exceeds volatility threshold — manual override required |
| `CUSTOMER_FLAGGED` | 422 | Customer screening status is `flagged` — transaction blocked |
| `SARLAFT_THRESHOLD_EXCEEDED` | 422 | Transaction would exceed customer's SARLAFT accumulator threshold |

### Accounting

| `error_code` | HTTP | When |
|---|---|---|
| `ACCOUNT_NOT_FOUND` | 404 | Account code not found in chart of accounts |
| `ACCOUNT_ALREADY_EXISTS` | 409 | Account code already exists |
| `JOURNAL_UNBALANCED` | 422 | Total debits ≠ total credits in the journal entry |
| `PERIOD_ALREADY_CLOSED` | 409 | An accounting period overlapping these dates is already closed |
| `VOUCHER_TYPE_NOT_FOUND` | 404 | Voucher type code not found |
| `JOURNAL_ENTRY_NOT_FOUND` | 404 | Journal entry ID not found |

### Regulatory Reports

| `error_code` | HTTP | When |
|---|---|---|
| `REPORT_NOT_FOUND` | 404 | Generated report ID not found |
| `STORAGE_FILE_NOT_FOUND` | 404 | Report file missing in storage |
| `STORAGE_UNAVAILABLE` | 502 | Object storage unreachable |
| `BANREP_NOT_ENABLED` | 409 | `banrep_enabled=false` in company settings |
| `UIAF_NOT_ENABLED` | 422 | `uiaf_enabled=false` in company settings |

### Generic

| `error_code` | HTTP | When |
|---|---|---|
| `NOT_FOUND` | 404 | Generic resource not found |
| `CONFLICT` | 409 | Generic duplicate resource |
| `MEMBERSHIP_NOT_FOUND` | 404 | User has no membership in this tenant |

---

### Recommended frontend error handler

```typescript
interface ApiError {
  status_code: number;
  error_code: string;
  detail: string;
  hint?: string;
}

function handleApiError(error: ApiError) {
  switch (error.error_code) {

    // Auth — redirect to login
    case 'TOKEN_INVALID':
      store.clearTokens();
      router.push('/login');
      break;

    case 'ACCOUNT_LOCKED':
      showError(error.detail); // includes wait time
      break;

    case 'INVALID_CREDENTIALS':
      showError('Email or password is incorrect.');
      break;

    case 'NO_ACTIVE_MEMBERSHIP':
    case 'TENANT_SUSPENDED':
      showError(error.hint ?? error.detail);
      break;

    case 'PASSWORD_EXPIRED':
      router.push('/change-password');
      break;

    case 'PERMISSION_DENIED':
    case 'ROLE_PRIVILEGE_VIOLATION':
      showError(error.hint ?? error.detail);
      break;

    case 'PASSWORD_WEAK':
    case 'INVALID_ROLE':
    case 'INVALID_DATE_RANGE':
      showFieldError(error.detail);
      break;

    case 'USER_ALREADY_IN_TENANT':
    case 'BRANCH_ALREADY_EXISTS':
    case 'TENANT_ALREADY_EXISTS':
    case 'CUSTOMER_ALREADY_EXISTS':
      showError(error.detail);
      break;

    case 'TWO_FA_REQUIRED':
      router.push('/2fa-verify');
      break;

    case 'TWO_FA_INVALID':
      showError('Invalid code. Check your authenticator app.');
      break;

    case 'NO_OPEN_SHIFT':
      showError('No open shift for this branch. Open a shift first.');
      break;

    case 'CUSTOMER_FLAGGED':
      showError('Transaction blocked: customer has a sanctions flag. Contact compliance.');
      break;

    case 'SARLAFT_THRESHOLD_EXCEEDED':
      showError('Transaction blocked: customer SARLAFT threshold exceeded.');
      break;

    case 'RATE_UNAVAILABLE':
    case 'SANCTIONS_DB_UNAVAILABLE':
    case 'STORAGE_UNAVAILABLE':
      showError('Service temporarily unavailable. Please try again shortly.');
      break;

    default:
      showError(error.detail);
  }
}
```

---

## Password requirements

Minimum 8 characters including at least one of each:
- Uppercase letter (`A-Z`)
- Lowercase letter (`a-z`)
- Digit (`0-9`)
- Special character (`!@#$%^&*()-_=+[]{}|;:,.<>?`)

---

## Role model

### Hierarchy

```
super_admin  (JokerLabs platform — not a company user)
    └── creates: owner
         └── creates: admin
              └── creates: operator | compliance | readonly | contador
```

### Capabilities

| Role | Manages users | Manages branches | Company settings | FX Transactions | Accounting | Reports |
|---|---|---|---|---|---|---|
| `super_admin` | Creates owners via onboard | — | — | — | — | — |
| `owner` | Creates admins and below | ✅ | ✅ | All branches | Write | All |
| `admin` | Creates operators, compliance, readonly, contador | ✅ | ✅ | All branches | Write | All |
| `contador` | ❌ | ❌ | ❌ | ❌ | Write | All |
| `compliance` | ❌ | ❌ | ❌ | All branches (audit) | Read | All |
| `operator` | ❌ | ❌ | ❌ | Own branch only | ❌ | Daily cash only |
| `readonly` | ❌ | ❌ | ❌ | Own branch only | ❌ | ❌ |

### Role assignment rules

| Assigning | Who can do it |
|---|---|
| `owner` | `super_admin` only |
| `admin` | `owner` or `super_admin` |
| `operator`, `compliance`, `readonly`, `contador` | `admin`, `owner`, or `super_admin` |

Attempting to assign above your level returns `ROLE_PRIVILEGE_VIOLATION (403)`.

### Multi-company users

A user can belong to multiple companies with different roles in each. At login with multiple active memberships, the API returns `requires_tenant_selection: true` with the list. The user picks a company → token is scoped to that company. Use `/auth/switch-tenant` to switch without re-entering credentials.

---

## Tenant lifecycle

```
pending ──→ active ──→ suspended ──→ active
   │             │           │
   └─────────────┴───────────┴──────→ cancelled (terminal)
```

| Status | User can login | Error returned |
|---|---|---|
| `pending` | ❌ | `NO_ACTIVE_MEMBERSHIP` |
| `active` | ✅ | — |
| `suspended` | ❌ | `NO_ACTIVE_MEMBERSHIP` or `TENANT_SUSPENDED` |
| `cancelled` | ❌ (terminal) | `NO_ACTIVE_MEMBERSHIP` |

---

## Response headers

### Headers you receive on every response

| Header | Purpose |
|---|---|
| `X-Request-ID` | UUID trace ID — include when reporting bugs |
| `X-Process-Time` | Server processing time in seconds |

### Security headers (always present)

The server applies OWASP-recommended headers automatically. You don't need to set these, but be aware of them when debugging:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | `default-src 'self'` (relaxed on `/docs` and `/redoc`) |

---

## Endpoint samples

---

## Auth `/api/v1/auth`

### `POST /login`

**Request**
```json
{
  "email": "carlos@acme.com",
  "password": "Str0ng@Pass!"
}
```

**Success — single company (HTTP 200)**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "must_change_password": false,
  "requires_2fa": false
}
```

**Success — user belongs to multiple companies (HTTP 200)**
```json
{
  "requires_tenant_selection": true,
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "memberships": [
    {
      "membership_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "tenant_id": "f0e1d2c3-b4a5-9678-cdef-012345678901",
      "tenant_name": "Acme Cambios",
      "tenant_slug": "acme-cambios",
      "role": "owner"
    },
    {
      "membership_id": "b2c3d4e5-f6a7-8901-bcde-f12345678902",
      "tenant_id": "e0d1c2b3-a4b5-8901-bcde-012345678903",
      "tenant_name": "Trans Divisas",
      "tenant_slug": "trans-divisas",
      "role": "operator"
    }
  ]
}
```
→ Show company picker. On selection call `POST /auth/select-tenant`.

**Success — 2FA required (HTTP 200)**
```json
{
  "requires_2fa": true,
  "state_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
→ Show 2FA code input. Call `POST /auth/verify-2fa`.

**Failure — wrong credentials (HTTP 401)**
```json
{
  "status_code": 401,
  "error_code": "INVALID_CREDENTIALS",
  "detail": "Email or password is incorrect.",
  "hint": null
}
```

**Failure — account locked (HTTP 429)**
```json
{
  "status_code": 429,
  "error_code": "ACCOUNT_LOCKED",
  "detail": "Account locked after 5 failed attempts. Try again in 14 minutes.",
  "hint": null
}
```

---

### `POST /select-tenant`

**Request**
```json
{
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "membership_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Success (HTTP 200)** — same token pair shape as single-company login.

**Failure — session expired (HTTP 401)**
```json
{
  "status_code": 401,
  "error_code": "SESSION_EXPIRED",
  "detail": "Tenant selection token has expired or already been used.",
  "hint": null
}
```

---

### `POST /switch-tenant`

> Requires `Authorization: Bearer <access_token>`

**Request**
```json
{
  "membership_id": "b2c3d4e5-f6a7-8901-bcde-f12345678902"
}
```

**Success (HTTP 200)** — new token pair scoped to selected company. Old refresh tokens are revoked.

---

### `POST /refresh`

**Request**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success (HTTP 200)**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "must_change_password": false,
  "requires_2fa": false
}
```

**Failure — token already used or expired (HTTP 401)**
```json
{
  "status_code": 401,
  "error_code": "TOKEN_INVALID",
  "detail": "Refresh token is invalid or has already been used.",
  "hint": null
}
```

---

### `POST /logout` / `POST /logout-all`

> Requires `Authorization: Bearer <access_token>`

**Success (HTTP 204)** — No body.

---

### `GET /me`

> Requires `Authorization: Bearer <access_token>`

**Success (HTTP 200)**
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-012345678904",
  "email": "carlos@acme.com",
  "full_name": "Carlos Perez",
  "role": "owner",
  "branch_code": null,
  "tenant_id": "f0e1d2c3-b4a5-9678-cdef-012345678901",
  "is_active": true,
  "must_change_password": false,
  "last_login_at": "2026-05-12T10:00:00Z"
}
```

---

### `POST /accept-invite`

User clicks link in email: `https://your-app.com/invite/{token}`

**Request**
```json
{
  "token": "abc123def456...",
  "new_password": "Str0ng@Pass!"
}
```

**Success (HTTP 200)** — returns full token pair. User is logged in immediately.

**Failure — expired invite (HTTP 400)**
```json
{
  "status_code": 400,
  "error_code": "INVITE_EXPIRED",
  "detail": "This invitation link has expired.",
  "hint": "Contact your administrator to send a new invitation."
}
```

---

### `POST /change-password`

> Requires `Authorization: Bearer <access_token>`. Block all app routes until completed when `must_change_password: true`.

**Request**
```json
{
  "current_password": "OldPass@123",
  "new_password": "NewStr0ng@Pass!"
}
```

**Success (HTTP 204)** — No body. All other sessions are revoked.

**Failure — weak password (HTTP 422)**
```json
{
  "status_code": 422,
  "error_code": "PASSWORD_WEAK",
  "detail": "Password must be at least 8 characters with uppercase, lowercase, digit, and special character.",
  "hint": null
}
```

---

### `POST /forgot-password`

**Request**
```json
{
  "email": "carlos@acme.com"
}
```

**Success (HTTP 204)** — Always 204, even if email not found (prevents enumeration).

---

### `POST /reset-password`

**Request**
```json
{
  "token": "abc123def456...",
  "new_password": "NewStr0ng@Pass!"
}
```

**Success (HTTP 204)** — No body.

---

### `POST /2fa/setup`

> Requires `Authorization: Bearer <access_token>`

**Success (HTTP 200)**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "otpauth_uri": "otpauth://totp/CurrencyApp%3Acarlos%40acme.com?secret=JBSWY3DPEHPK3PXP&issuer=CurrencyApp"
}
```
→ Render `otpauth_uri` as a QR code for the user to scan in their authenticator app.

---

### `POST /2fa/enable`

> Requires `Authorization: Bearer <access_token>`

**Request**
```json
{
  "code": "123456"
}
```

**Success (HTTP 200)**
```json
{
  "backup_codes": [
    "A1B2-C3D4",
    "E5F6-G7H8",
    "I9J0-K1L2",
    "M3N4-O5P6",
    "Q7R8-S9T0",
    "U1V2-W3X4",
    "Y5Z6-A7B8",
    "C9D0-E1F2"
  ]
}
```
→ **8 backup codes**, each in `XXXX-XXXX` format. Display once — they cannot be retrieved again. Each code is single-use.

---

### `POST /2fa/disable`

> Requires `Authorization: Bearer <access_token>`. Accepts a live TOTP code **or** one backup code.

**Request**
```json
{
  "code": "123456"
}
```

**Success (HTTP 204)** — No body.

**Failure — 2FA not enabled (HTTP 400)**
```json
{
  "status_code": 400,
  "error_code": "TWO_FA_NOT_ENABLED",
  "detail": "Two-factor authentication is not enabled on this account.",
  "hint": null
}
```

---

### `POST /verify-2fa`

**Request**
```json
{
  "state_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "code": "123456"
}
```

**Success (HTTP 200)** — returns full token pair.

**Failure — wrong code (HTTP 400)**
```json
{
  "status_code": 400,
  "error_code": "TWO_FA_INVALID",
  "detail": "The provided 2FA code is incorrect.",
  "hint": null
}
```

---

### `POST /resend-invite/{user_id}`

> Requires `owner`, `admin`, or `super_admin`. Expires all existing pending invitations for this user and creates a fresh one with a new 48-hour TTL.

**Success (HTTP 200)**
```json
{
  "id": "d4e5f6a7-b8c9-0123-defa-012345678905",
  "tenant_id": "f0e1d2c3-b4a5-9678-cdef-012345678901",
  "user_id": "c3d4e5f6-a7b8-9012-cdef-012345678904",
  "membership_id": "b2c3d4e5-f6a7-8901-bcde-f12345678902",
  "invited_by": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "expires_at": "2026-05-30T10:00:00Z",
  "accepted_at": null,
  "created_at": "2026-05-28T10:00:00Z"
}
```

**Failure — user not found (HTTP 404)**
```json
{
  "status_code": 404,
  "error_code": "NOT_FOUND",
  "detail": "The requested resource was not found.",
  "hint": null
}
```

**Failure — already accepted (HTTP 400)**
```json
{
  "status_code": 400,
  "error_code": "INVITE_ALREADY_ACCEPTED",
  "detail": "This user has already accepted their invitation.",
  "hint": null
}
```

---

## Tenants `/api/v1/tenants` — super_admin only

### `POST /onboard`

**Request**
```json
{
  "slug": "acme-cambios",
  "name": "Acme Cambios SAS",
  "nit": "900123456-1",
  "password_expiry_days": 90,
  "admin_email": "owner@acme.com",
  "admin_full_name": "Carlos Perez"
}
```

**Success (HTTP 201)**
```json
{
  "tenant": {
    "id": "f0e1d2c3-b4a5-9678-cdef-012345678901",
    "slug": "acme-cambios",
    "name": "Acme Cambios SAS",
    "nit": "900123456-1",
    "schema_name": "app_acme_cambios",
    "status": "active",
    "is_active": true,
    "password_expiry_days": 90,
    "created_at": "2026-05-12T15:00:00Z",
    "updated_at": "2026-05-12T15:00:00Z"
  },
  "email_sent": true
}
```

**Failure — slug taken (HTTP 409)**
```json
{
  "status_code": 409,
  "error_code": "TENANT_ALREADY_EXISTS",
  "detail": "A tenant with slug 'acme-cambios' already exists.",
  "hint": null
}
```

---

### `GET /` (list tenants)

**Query params**: `?status=active` (optional)

**Success (HTTP 200)**
```json
[
  {
    "id": "f0e1d2c3-b4a5-9678-cdef-012345678901",
    "slug": "acme-cambios",
    "name": "Acme Cambios SAS",
    "nit": "900123456-1",
    "schema_name": "app_acme_cambios",
    "status": "active",
    "is_active": true,
    "password_expiry_days": 90,
    "created_at": "2026-05-12T15:00:00Z",
    "updated_at": "2026-05-12T15:00:00Z"
  }
]
```

---

### `PATCH /{slug}/status`

**Request**
```json
{
  "status": "suspended",
  "reason": "Payment overdue — invoice #1042"
}
```

**Success (HTTP 200)** — returns updated `TenantResponse`.

**Failure — invalid transition (HTTP 422)**
```json
{
  "status_code": 422,
  "error_code": "INVALID_STATUS_TRANSITION",
  "detail": "Cannot transition from 'cancelled' to 'active'.",
  "hint": "Valid transitions from 'active': suspended, cancelled."
}
```

---

## Users `/api/v1/users`

### `GET /` (list users)

**Query params**: `?page=1&size=20`

**Success (HTTP 200)**
```json
{
  "items": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-012345678904",
      "email": "carlos@acme.com",
      "full_name": "Carlos Perez",
      "role": "owner",
      "branch_code": null,
      "is_active": true,
      "last_login_at": "2026-05-12T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

---

### `POST /invite`

**Request**
```json
{
  "email": "operador@acme.com",
  "full_name": "Ana Garcia",
  "role": "operator",
  "branch_code": "BOG01"
}
```

**Success (HTTP 201)**
```json
{
  "invitation": {
    "id": "d4e5f6a7-b8c9-0123-defa-012345678905",
    "tenant_id": "f0e1d2c3-b4a5-9678-cdef-012345678901",
    "user_id": "c3d4e5f6-a7b8-9012-cdef-012345678904",
    "membership_id": "b2c3d4e5-f6a7-8901-bcde-f12345678902",
    "invited_by": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "expires_at": "2026-05-30T10:00:00Z",
    "accepted_at": null,
    "created_at": "2026-05-28T10:00:00Z"
  },
  "email_sent": true
}
```

> `email_sent: false` means the invitation record was created but email delivery failed. Call `POST /auth/resend-invite/{user_id}` to retry.

**Failure — already a member (HTTP 409)**
```json
{
  "status_code": 409,
  "error_code": "USER_ALREADY_IN_TENANT",
  "detail": "operador@acme.com already has a membership in this tenant.",
  "hint": null
}
```

---

### `PATCH /{user_id}`

**Request** — send only the fields to change
```json
{
  "role": "admin",
  "branch_code": null
}
```

**Success (HTTP 200)** — returns updated user object.

**Failure — privilege violation (HTTP 403)**
```json
{
  "status_code": 403,
  "error_code": "ROLE_PRIVILEGE_VIOLATION",
  "detail": "You cannot assign a role equal to or above your own.",
  "hint": null
}
```

---

### `POST /force-password-reset`

> Requires `owner`, `admin`, or `super_admin`. Bulk-sends password reset emails to up to 50 users. Users not in the tenant, inactive users, and super-admins are silently skipped.

**Request**
```json
{
  "user_ids": [
    "c3d4e5f6-a7b8-9012-cdef-012345678904",
    "d4e5f6a7-b8c9-0123-defa-012345678905"
  ]
}
```

**Success (HTTP 200)**
```json
{
  "sent": 1,
  "failed": 0,
  "skipped": 1,
  "details": [
    {
      "user_id": "c3d4e5f6-a7b8-9012-cdef-012345678904",
      "email": "ana@acme.com",
      "status": "sent"
    },
    {
      "user_id": "d4e5f6a7-b8c9-0123-defa-012345678905",
      "email": "",
      "status": "skipped",
      "reason": "User not found in this tenant"
    }
  ]
}
```
`status` values per detail entry: `"sent"` | `"failed"` | `"skipped"`.

---

## Branches `/api/v1/branches`

### `GET /`

**Success (HTTP 200)**
```json
[
  {
    "id": "e5f6a7b8-c9d0-1234-efab-012345678906",
    "code": "BOG01",
    "name": "Sede Bogotá Principal",
    "city": "Bogotá",
    "dane_code": "11001",
    "address": "Calle 72 # 10-07",
    "phone": "6013210000",
    "timezone": "America/Bogota",
    "is_active": true,
    "created_at": "2026-05-01T08:00:00Z"
  }
]
```

---

### `POST /`

**Request**
```json
{
  "code": "MED01",
  "name": "Sede Medellín",
  "city": "Medellín",
  "dane_code": "05001",
  "address": "Carrera 43A # 1-50",
  "phone": "6044320000",
  "timezone": "America/Bogota"
}
```

**Success (HTTP 201)** — returns full `BranchResponse`.

**Failure — code taken (HTTP 409)**
```json
{
  "status_code": 409,
  "error_code": "BRANCH_ALREADY_EXISTS",
  "detail": "Branch code 'MED01' already exists in this tenant.",
  "hint": null
}
```

---

## Company `/api/v1/company`

### `GET /`

**Success (HTTP 200)**
```json
{
  "id": 1,
  "nit": "900123456-1",
  "name": "Acme Cambios SAS",
  "city": "Bogotá",
  "department": "Cundinamarca",
  "address": "Calle 72 # 10-07",
  "phone": "6013210000",
  "email": "admin@acme.com",
  "min_rate_spread": "0.005",
  "max_rate_spread": "0.050",
  "multi_branch": true,
  "uiaf_enabled": true,
  "uiaf_code": "123456",
  "banrep_enabled": false,
  "accountant_name": "Jorge Torres",
  "accountant_id": "79000001",
  "auditor_name": "",
  "auditor_id": "",
  "compliance_officer_name": "María López",
  "compliance_officer_id": "52000002",
  "config_json": {},
  "updated_at": "2026-05-10T12:00:00Z"
}
```

---

### `PATCH /`

**Request** — send only the fields to update
```json
{
  "email": "nuevo@acme.com",
  "max_rate_spread": "0.045",
  "uiaf_enabled": true,
  "uiaf_code": "654321"
}
```

**Success (HTTP 200)** — returns full `CompanySettingsResponse`.

---

## Currency `/api/v1/currency`

### `GET /trm/{currency}`

Example: `GET /trm/USD`

**Success (HTTP 200)**
```json
{
  "currency": "USD",
  "rate": "4215.50",
  "date": "2026-05-12",
  "source": "superfinanciera"
}
```

**Failure — unsupported currency (HTTP 400)**
```json
{
  "status_code": 400,
  "error_code": "CURRENCY_INVALID_REQUEST",
  "detail": "Currency code 'XYZ' is not supported.",
  "hint": null
}
```

**Failure — provider down (HTTP 503)**
```json
{
  "status_code": 503,
  "error_code": "RATE_UNAVAILABLE",
  "detail": "External rate provider is temporarily unavailable.",
  "hint": "Try again in a few minutes."
}
```

---

### `GET /trm/{currency}/history`

**Query params**: `?start_date=2026-05-01&end_date=2026-05-12` (max 30 days)

**Success (HTTP 200)**
```json
{
  "currency": "USD",
  "rates": [
    { "date": "2026-05-01", "rate": "4210.00" },
    { "date": "2026-05-02", "rate": "4218.75" },
    { "date": "2026-05-12", "rate": "4215.50" }
  ]
}
```

---

### `POST /trm/{currency}/convert`

**Request**
```json
{
  "amount": "1000.00",
  "direction": "to_cop"
}
```

**Success (HTTP 200)**
```json
{
  "currency": "USD",
  "original_amount": "1000.00",
  "converted_amount": "4215500.00",
  "rate": "4215.50",
  "date": "2026-05-12"
}
```

---

### `GET /trm/supported/currencies`

**Success (HTTP 200)**
```json
{
  "currencies": ["USD", "EUR", "GBP", "CAD", "CHF", "JPY", "BRL"]
}
```

---

## Sanctions `/api/v1/sanction-lists`

### Sanctions list source codes

| `list_source` | Full name | External link |
|---|---|---|
| `SDN` | Specially Designated Nationals — US Treasury OFAC | sanctionssearch.ofac.treas.gov |
| `UN` | UN Security Council Consolidated List | scsanctions.un.org |
| `PE` | Personas Expuestas Políticamente — Colombia (datos.gov.co) | datos.gov.co |
| `PF` | PEP Family / Associates — Colombia | — |
| `EU` | EU Consolidated Financial Sanctions | sanctionsmap.eu |
| `UK` | UK OFSI Consolidated Sanctions | sanctionssearchapp.ofsi.hmtreasury.gov.uk |

Use the `listSource` query param on `GET /persons` to filter to a specific list.

---

### `POST /universal-search`

> Field names use **camelCase aliases** (`idNumber`, `externalId`, `maxResults`, `listSources`, `minScore`, `searchMode`). At least one of `idNumber`, `name`, `country`, or `address` is required per case.

**Request** — up to 50 cases per request
```json
{
  "cases": [
    {
      "idNumber": "79000001",
      "name": "Carlos Perez",
      "externalId": "case-001"
    },
    {
      "name": "Juan Rodriguez"
    }
  ],
  "maxResults": 10,
  "minScore": 75,
  "searchMode": "flexible"
}
```

**Success (HTTP 200)**
```json
{
  "success": true,
  "totalMatches": 1,
  "sources": [
    {
      "source": "SDN",
      "name": "Specially Designated Nationals (SDN) - Treasury Department",
      "publishDate": "2026-05-27",
      "downloadDate": "2026-05-27T02:15:00Z",
      "sourceLink": "https://sanctionssearch.ofac.treas.gov/"
    }
  ],
  "results": [
    {
      "externalId": "case-001",
      "name": "Carlos Perez",
      "totalMatches": 0,
      "matches": []
    },
    {
      "externalId": null,
      "name": "Juan Rodriguez",
      "totalMatches": 1,
      "matches": [
        {
          "score": 87,
          "sources": ["SDN"],
          "primarySource": "SDN",
          "matchedSources": ["SDN"],
          "uid": "OFAC-12345"
        }
      ]
    }
  ]
}
```

**Failure — too many cases (HTTP 400)**
```json
{
  "status_code": 400,
  "error_code": "SANCTIONS_TOO_MANY_CASES",
  "detail": "Maximum 50 cases allowed per request. Received 53.",
  "hint": null
}
```

---

### `GET /persons`

> Supports ETag caching — send `If-None-Match: <etag>` to receive `304 Not Modified` when the dataset hasn't changed.

**Query params**: `?page=1&page_size=50&listSource=SDN`

Valid `listSource` values: `SDN`, `UN`, `EU`, `UK`, `PE`, `PF`.

**Success (HTTP 200)**
```json
{
  "items": [ /* PersonSummary objects */ ],
  "total": 15420,
  "page": 1,
  "page_size": 50,
  "dataset_version": "20260527",
  "last_sync_at": "2026-05-27T02:15:00Z"
}
```

---

### `GET /metadata`

**Success (HTTP 200)**
```json
{
  "lists": [
    {
      "list_key": "SDN",
      "list_name": "Specially Designated Nationals (SDN) - Treasury Department",
      "record_count_total": 10842,
      "record_count_persons": 9240,
      "source_version": "20260527",
      "last_sync_at": "2026-05-27T02:15:00Z"
    },
    {
      "list_key": "UN",
      "list_name": "UN Security Council Consolidated List",
      "record_count_total": 890,
      "record_count_persons": 850,
      "source_version": "20260526",
      "last_sync_at": "2026-05-26T02:15:00Z"
    }
  ]
}
```

---

## FX Operations `/api/v1/fx`

### Operator shift workflow

Every FX transaction must happen inside an open shift. The full daily flow:

```
1. GET  /fx/shifts/current?branch_code=BOG01
        ├── 200 → shift already open, skip to step 3
        └── 404 NO_OPEN_SHIFT → continue

2. POST /fx/shifts/open
        └── Server auto-fetches live rates from Superfinanciera (USD) and
            Exchange Rate API (others), computes TPPC and spreads.
            Returns ShiftResponse with approved rates per currency.
            If a currency has volatility_flagged: true, show a warning banner
            (rate is still applied — no manual override needed at this level).

3. POST /fx/transactions  (repeat per customer)
        ├── customer_id, transaction_type (buy|sell), iso_code, foreign_amount, branch_code
        └── Returns FxTransactionResponse with ticket_number, cop_amount,
            exchange_rate, screening_status, sarlaft_flagged

4. POST /fx/shifts/{id}/close  (end of day)
        └── Requires physical_counts for every currency in the shift
            ├── Returns ShiftCloseResponse { shift, reconciliation[] }
            └── reconciliation[].variance_status: "balanced" | "surplus" | "shortage"

5. GET  /reports/daily-cash?shift_date=YYYY-MM-DD  (end-of-day report)
        └── Returns cash summary per branch/shift for printing
```

> `transaction_type: "buy"` = the exchange house **buys** foreign currency from the customer (customer receives COP).  
> `transaction_type: "sell"` = the exchange house **sells** foreign currency to the customer (customer pays COP).

---

### `GET /products`

**Query params**: `?include_inactive=false`

**Success (HTTP 200)**
```json
[
  {
    "iso_code": "USD",
    "name": "Dólar Estadounidense",
    "buy_rate": "4200.00",
    "cost_rate": "4205.00",
    "sell_rate": "4225.00",
    "buy_spread": "0.0050",
    "sell_spread": "0.0048",
    "volatility_threshold_pct": "0.0300",
    "physical_stock": "15000.00",
    "available_stock": "12500.00",
    "monthly_threshold": "500000.00",
    "puc_account_code": "11050501",
    "is_active": true,
    "updated_at": "2026-05-12T07:00:00Z"
  }
]
```

---

### `PATCH /products/{iso_code}`

Example: `PATCH /products/USD`

**Request** — send only fields to update
```json
{
  "buy_spread": "0.0055",
  "sell_spread": "0.0050",
  "available_stock": "10000.00"
}
```

**Success (HTTP 200)** — returns updated `CurrencyProductResponse`.

---

### `PATCH /products` (Bulk Update)

> Requires `admin`, `owner`, or `super_admin`. ISO codes that are not found are returned in `not_found` — they do not cause an error.

**Request** — array of items, each including `iso_code`
```json
[
  { "iso_code": "USD", "buy_spread": "0.0055", "sell_spread": "0.0050" },
  { "iso_code": "EUR", "available_stock": "3000.00" }
]
```

**Success (HTTP 200)**
```json
{
  "updated": [ /* array of CurrencyProductResponse */ ],
  "not_found": ["GBP"]
}
```

---

### `POST /shifts/open`

> Rates are fully automatic — the server fetches live rates and computes spreads/TPPC at open time. No currency list or rate overrides are accepted in the request.

**Request**
```json
{
  "branch_code": "BOG01",
  "opening_cash_cop": "2000000.00"
}
```

**Success (HTTP 201)**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2026-05-12",
  "operator_id": "c3d4e5f6-a7b8-9012-cdef-012345678904",
  "branch_code": "BOG01",
  "official_trm": "4215.50",
  "buy_rate": "4194.57",
  "sell_rate": "4235.74",
  "opening_cash_cop": "2000000.00",
  "status": "open",
  "opened_at": "2026-05-12T08:00:00Z",
  "closed_at": null,
  "currencies": [
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678902",
      "iso_code": "USD",
      "reference_rate": "4215.50",
      "rate_source": "superfinanciera",
      "proposed_buy_rate": "4194.57",
      "proposed_sell_rate": "4235.74",
      "approved_buy_rate": "4194.57",
      "approved_sell_rate": "4235.74",
      "rate_status": "approved",
      "volatility_flagged": false,
      "volatility_pct": "0.0142",
      "base_units": "12500.00",
      "units_purchased": "0.00",
      "units_sold": "0.00",
      "profit_cop": "0.00",
      "tppc": "4205.00",
      "cop_paid_total": "0.00",
      "closing_physical_count": null,
      "variance": null,
      "variance_note": null
    }
  ]
}
```

**Failure — shift already exists (HTTP 409)**
```json
{
  "status_code": 409,
  "error_code": "SHIFT_ALREADY_EXISTS",
  "detail": "A shift already exists for branch 'BOG01' on 2026-05-12.",
  "hint": null
}
```

---

### `GET /shifts/current`

**Query params**: `?branch_code=BOG01` (required)

**Success (HTTP 200)** — same shape as open-shift response.

**Failure — no open shift (HTTP 404)**
```json
{
  "status_code": 404,
  "error_code": "NO_OPEN_SHIFT",
  "detail": "No open shift found for branch 'BOG01'.",
  "hint": null
}
```

---

### `POST /shifts/{shift_id}/close`

Physical cash counts are **mandatory** for every active currency in the shift. The system calculates the variance between `available_stock` (system-tracked) and the cashier's physical count, then updates `physical_stock` on the product.

**Request**
```json
{
  "physical_counts": [
    { "iso_code": "USD", "count": "1450.00", "note": null },
    { "iso_code": "EUR", "count": "820.00",  "note": "Billete dañado retirado" }
  ]
}
```

> Every currency that has `rate_status: "approved"` in the shift must have a matching entry in `physical_counts`. Missing currencies return HTTP 422.

**Success (HTTP 200)**
```json
{
  "shift": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "date": "2026-05-12",
    "branch_code": "BOG01",
    "status": "closed",
    "opened_at": "2026-05-12T08:00:00Z",
    "closed_at": "2026-05-12T18:30:00Z"
  },
  "reconciliation": [
    {
      "iso_code": "USD",
      "expected_closing": "1500.00",
      "physical_count": "1450.00",
      "variance": "-50.00",
      "variance_status": "shortage"
    },
    {
      "iso_code": "EUR",
      "expected_closing": "820.00",
      "physical_count": "820.00",
      "variance": "0.00",
      "variance_status": "balanced"
    }
  ]
}
```

**`variance_status` values**

| Value | Meaning |
|-------|---------|
| `balanced` | Physical count matches system expectation exactly |
| `surplus` | Cashier counted more than the system expected |
| `shortage` | Cashier counted less than the system expected |

**Failure — missing currency count (HTTP 422)**
```json
{
  "status_code": 422,
  "error_code": "MISSING_PHYSICAL_COUNTS",
  "detail": "Physical count required for: EUR.",
  "hint": null
}
```

---

### `GET /shifts`

**Query params**: `?page=1&size=20&branch_code=BOG01&date_from=2026-05-01&date_to=2026-05-12&shift_status=closed`

**Success (HTTP 200)**
```json
{
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "date": "2026-05-12",
      "operator_id": "c3d4e5f6-a7b8-9012-cdef-012345678904",
      "branch_code": "BOG01",
      "official_trm": "4215.50",
      "status": "closed",
      "opened_at": "2026-05-12T08:00:00Z",
      "closed_at": "2026-05-12T18:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

---

### `POST /transactions`

**Request**
```json
{
  "customer_id": "d4e5f6a7-b8c9-0123-defa-012345678905",
  "transaction_type": "buy",
  "iso_code": "USD",
  "foreign_amount": "500.00",
  "branch_code": "BOG01",
  "description": "Compra de turismo"
}
```

`transaction_type`: `"buy"` (exchange house buys foreign currency from customer — customer receives COP) | `"sell"` (exchange house sells foreign currency to customer — customer pays COP)

> `branch_code` is **required** — the server uses it to find the open shift for that branch.

**Success (HTTP 201)**
```json
{
  "id": "e5f6a7b8-c9d0-1234-efab-012345678906",
  "ticket_number": 42,
  "shift_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "customer_id": "d4e5f6a7-b8c9-0123-defa-012345678905",
  "operator_id": "c3d4e5f6-a7b8-9012-cdef-012345678904",
  "branch_code": "BOG01",
  "transaction_type": "buy",
  "iso_code": "USD",
  "foreign_amount": "500.00",
  "exchange_rate": "4194.57",
  "cop_amount": "2097285.00",
  "official_trm": "4215.50",
  "spread": "0.0050",
  "description": "Compra de turismo",
  "screening_status": "clear",
  "sarlaft_flagged": false,
  "created_at": "2026-05-12T10:15:00Z"
}
```

**Failure — customer flagged (HTTP 422)**
```json
{
  "status_code": 422,
  "error_code": "CUSTOMER_FLAGGED",
  "detail": "Customer has a 'flagged' screening status. Transaction blocked pending compliance review.",
  "hint": "Contact compliance to clear or override the screening status."
}
```

**Failure — SARLAFT threshold (HTTP 422)**
```json
{
  "status_code": 422,
  "error_code": "SARLAFT_THRESHOLD_EXCEEDED",
  "detail": "This transaction would cause the customer to exceed their monthly buy threshold.",
  "hint": "Current monthly buy total: $4,800,000 COP. Threshold: $5,000,000 COP."
}
```

**Failure — insufficient stock (HTTP 422)**
```json
{
  "status_code": 422,
  "error_code": "INSUFFICIENT_STOCK",
  "detail": "Not enough USD available stock. Available: 300.00, requested: 500.00.",
  "hint": null
}
```

---

### `GET /transactions/{tx_id}`

> Use this to get the full transaction detail including `customer_document` and `customer_name` for receipt display. There is no separate `/receipt` endpoint — build the receipt UI from this response.

**Success (HTTP 200)**
```json
{
  "id": "e5f6a7b8-c9d0-1234-efab-012345678906",
  "ticket_number": 42,
  "shift_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "customer_id": "d4e5f6a7-b8c9-0123-defa-012345678905",
  "customer_document": "79000001",
  "customer_name": "Carlos Perez",
  "operator_id": "c3d4e5f6-a7b8-9012-cdef-012345678904",
  "branch_code": "BOG01",
  "transaction_type": "buy",
  "iso_code": "USD",
  "foreign_amount": "500.00",
  "exchange_rate": "4194.57",
  "cop_amount": "2097285.00",
  "official_trm": "4215.50",
  "spread": "-2.0500",
  "description": "Compra de turismo",
  "screening_status": "clear",
  "sarlaft_flagged": false,
  "tppc_used": null,
  "iva_base_gravable": null,
  "created_at": "2026-05-12T10:15:00Z"
}
```

---

### `GET /transactions`

**Query params**:
- `page` (integer, optional): Page number to retrieve. Default: `1`, minimum: `1`.
- `size` (integer, optional): Number of items per page. Default: `20`, minimum: `1`, maximum: `100`.
- `branch_code` (string | null, optional): Filter transactions by branch code.
- `customer_id` (string | null ($uuid), optional): Filter transactions by customer ID.
- `iso_code` (string | null, optional): Filter transactions by currency ISO code.
- `transaction_type` (string | null, optional): Filter transactions by transaction type (`buy` or `sell`).
- `shift_id` (string | null ($uuid), optional): Filter transactions by operator shift ID.
- `date_from` (string | null ($date), optional): Filter transactions starting from this date (inclusive).
- `date_to` (string | null ($date), optional): Filter transactions up to this date (inclusive).

**Success (HTTP 200)**
```json
{
  "items": [
    {
      "id": "e5f6a7b8-c9d0-1234-efab-012345678906",
      "ticket_number": 42,
      "shift_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "customer_id": "d4e5f6a7-b8c9-0123-defa-012345678905",
      "operator_id": "c3d4e5f6-a7b8-9012-cdef-012345678904",
      "branch_code": "BOG01",
      "transaction_type": "buy",
      "iso_code": "USD",
      "foreign_amount": "500.00",
      "exchange_rate": "4194.57",
      "cop_amount": "2097285.00",
      "official_trm": "4215.50",
      "spread": "0.0050",
      "description": "Compra de turismo",
      "screening_status": "clear",
      "sarlaft_flagged": false,
      "created_at": "2026-05-12T10:15:00Z"
    }
  ],
  "total": 18,
  "page": 1,
  "size": 20
}
```

---

## Customers / KYC `/api/v1/customers`

### `GET /` (list customers)

**Query params**: `?page=1&size=20&name=carlos&document_number=79000001&customer_type=customer&screening_status=clear&branch_code=BOG01&include_inactive=false`

**Success (HTTP 200)**
```json
{
  "items": [
    {
      "id": "d4e5f6a7-b8c9-0123-defa-012345678905",
      "document_type": "CC",
      "document_number": "79000001",
      "full_name": "Carlos Alberto Perez Gomez",
      "city": "Bogotá",
      "customer_type": "customer",
      "screening_status": "clear",
      "is_active": true,
      "branch_code": "BOG01",
      "email": "carlos@example.com",
      "phone": "3001234567"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

---

### `GET /search`

**Query params**: `?q=carlos&limit=10` (min 2 characters)

**Success (HTTP 200)** — array of `CustomerListItem` objects (same shape as list items above).

---

### `POST /` (create customer)

**Request** — natural person
```json
{
  "document_type": "CC",
  "document_number": "79000001",
  "first_name": "Carlos",
  "second_name": "Alberto",
  "first_surname": "Perez",
  "second_surname": "Gomez",
  "person_type": "natural",
  "gender": "M",
  "birth_date": "1985-06-15",
  "birth_city": "Bogotá",
  "nationality": "COL",
  "country_code": "CO",
  "city": "Bogotá",
  "dane_code": "11001",
  "address": "Calle 72 # 10-07",
  "phone": "6013210000",
  "cellphone": "3001234567",
  "email": "carlos@example.com",
  "occupation": "Comerciante",
  "economic_activity_code": "4711",
  "socioeconomic_stratum": 3,
  "customer_type": "customer",
  "source_of_funds": "Comercio",
  "branch_code": "BOG01"
}
```

**Request** — juridical person (company) — must use `document_type: "NIT"`
```json
{
  "document_type": "NIT",
  "document_number": "900123456-1",
  "first_name": "Acme",
  "first_surname": "SAS",
  "person_type": "juridical",
  "city": "Bogotá",
  "dane_code": "11001",
  "address": "Cra 7 # 32-16",
  "phone": "6013219999",
  "economic_activity_code": "6492",
  "customer_type": "customer",
  "source_of_funds": "Operaciones comerciales"
}
```

**Success (HTTP 201)** — returns full `CustomerFullResponse` (see GET /{customer_id} below).

**Failure — duplicate document (HTTP 409)**
```json
{
  "status_code": 409,
  "error_code": "CUSTOMER_ALREADY_EXISTS",
  "detail": "A customer with CC 79000001 already exists.",
  "hint": null
}
```

**Failure — juridical with wrong doc type (HTTP 422)**
```json
{
  "status_code": 422,
  "error_code": "VALIDATION_ERROR",
  "detail": "Juridical persons must use document_type='NIT'.",
  "hint": null
}
```

---

### `GET /{customer_id}`

**Success (HTTP 200)**
```json
{
  "id": "d4e5f6a7-b8c9-0123-defa-012345678905",
  "document_type": "CC",
  "document_number": "79000001",
  "first_name": "Carlos",
  "second_name": "Alberto",
  "first_surname": "Perez",
  "second_surname": "Gomez",
  "full_name": "Carlos Alberto Perez Gomez",
  "person_type": "natural",
  "gender": "M",
  "birth_date": "1985-06-15",
  "birth_city": "Bogotá",
  "nationality": "COL",
  "country_code": "CO",
  "city": "Bogotá",
  "dane_code": "11001",
  "address": "Calle 72 # 10-07",
  "phone": "6013210000",
  "cellphone": "3001234567",
  "email": "carlos@example.com",
  "occupation": "Comerciante",
  "economic_activity_code": "4711",
  "socioeconomic_stratum": 3,
  "customer_type": "customer",
  "credit_limit": null,
  "balance": "0.00",
  "source_of_funds": "Comercio",
  "destination_of_funds": null,
  "branch_code": "BOG01",
  "screening_status": "clear",
  "registered_at": "2026-05-01",
  "last_transaction_at": "2026-05-12T10:15:00Z",
  "is_active": true,
  "legacy_import": false,
  "created_at": "2026-05-01T09:00:00Z",
  "updated_at": "2026-05-12T10:15:00Z",
  "pep_declarations": [],
  "legal_reps": [],
  "sarlaft_profile": null
}
```

`screening_status` values: `"pending"` | `"clear"` | `"flagged"`

---

### `PATCH /{customer_id}`

**Request** — send only fields to update
```json
{
  "address": "Carrera 15 # 88-64",
  "cellphone": "3109876543",
  "occupation": "Empresario"
}
```

**Success (HTTP 200)** — returns updated `CustomerFullResponse`.

---

### `DELETE /{customer_id}` — soft delete

> Requires `admin`, `owner`, or `super_admin`

**Success (HTTP 204)** — No body.

---

### `GET /{customer_id}/pep`

**Success (HTTP 200)**
```json
[
  {
    "id": "f6a7b8c9-d0e1-2345-fabc-012345678907",
    "customer_id": "d4e5f6a7-b8c9-0123-defa-012345678905",
    "is_pep": true,
    "is_pep_family": false,
    "pep_entity": "Ministerio de Hacienda",
    "pep_position": "Asesor",
    "related_person_id": null,
    "related_person_name": null,
    "relation_type": null,
    "declaration_date": "2025-01-15",
    "declared_by": "c3d4e5f6-a7b8-9012-cdef-012345678904",
    "created_at": "2026-01-15T10:00:00Z"
  }
]
```

---

### `POST /{customer_id}/pep`

> Requires `compliance`, `admin`, `owner`, or `super_admin`

**Request**
```json
{
  "is_pep": true,
  "is_pep_family": false,
  "pep_entity": "Ministerio de Hacienda",
  "pep_position": "Asesor",
  "declaration_date": "2025-01-15"
}
```

**Success (HTTP 201)** — returns `PepDeclarationResponse`.

---

### `GET /{customer_id}/legal-reps`

> Used for juridical persons

**Success (HTTP 200)**
```json
[
  {
    "id": "a7b8c9d0-e1f2-3456-abcd-012345678908",
    "customer_id": "d4e5f6a7-b8c9-0123-defa-012345678905",
    "full_name": "Maria Cardenas",
    "document_type": "CC",
    "document_number": "52000002",
    "role": "representative",
    "ownership_pct": "51.00",
    "is_active": true,
    "created_at": "2026-05-01T09:00:00Z"
  }
]
```

---

### `POST /{customer_id}/legal-reps`

> Requires `compliance`, `admin`, `owner`, or `super_admin`

**Request**
```json
{
  "full_name": "Maria Cardenas",
  "document_type": "CC",
  "document_number": "52000002",
  "role": "representative",
  "ownership_pct": "51.00"
}
```

**Success (HTTP 201)** — returns `LegalRepResponse`.

---

### `GET /{customer_id}/sarlaft`

> Requires `compliance`, `admin`, `owner`, or `super_admin`

**Success (HTTP 200)** — returns profile or `null` if not yet created
```json
{
  "id": "b8c9d0e1-f2a3-4567-bcde-012345678909",
  "customer_id": "d4e5f6a7-b8c9-0123-defa-012345678905",
  "monthly_buy_threshold": "5000000.00",
  "monthly_sell_threshold": "5000000.00",
  "annual_buy_threshold": "50000000.00",
  "annual_sell_threshold": "50000000.00",
  "risk_level": "low",
  "is_suspicious": false,
  "suspicious_date": null,
  "declarant_id": "79000001",
  "declarant_name": "Carlos Perez",
  "last_review_date": "2026-05-01",
  "updated_at": "2026-05-01T09:00:00Z"
}
```

`risk_level` values: `"low"` | `"medium"` | `"high"`

---

### `PATCH /{customer_id}/sarlaft`

> Requires `compliance`, `admin`, `owner`, or `super_admin`

**Request** — send only fields to update
```json
{
  "risk_level": "medium",
  "monthly_buy_threshold": "3000000.00",
  "last_review_date": "2026-05-12"
}
```

**Success (HTTP 200)** — returns `SarlaftProfileResponse`.

---

### `GET /{customer_id}/accumulators`

**Success (HTTP 200)**
```json
[
  {
    "id": "c9d0e1f2-a3b4-5678-cdef-012345678910",
    "customer_id": "d4e5f6a7-b8c9-0123-defa-012345678905",
    "period_type": "monthly",
    "period_key": "2026-05",
    "buy_total": "4800000.00",
    "sell_total": "1200000.00",
    "threshold_exceeded": false,
    "updated_at": "2026-05-12T10:15:00Z"
  },
  {
    "id": "d0e1f2a3-b4c5-6789-defa-012345678911",
    "customer_id": "d4e5f6a7-b8c9-0123-defa-012345678905",
    "period_type": "annual",
    "period_key": "2026",
    "buy_total": "22500000.00",
    "sell_total": "8700000.00",
    "threshold_exceeded": false,
    "updated_at": "2026-05-12T10:15:00Z"
  }
]
```

`period_type` values: `"weekly"` | `"monthly"` | `"annual"`

---

## Accounting `/api/v1/accounting`

### Role matrix for accounting

| Role | GET accounts / voucher types | Read reports & journals | Write (accounts, entries, periods) |
|---|---|---|---|
| `super_admin`, `owner`, `admin`, `contador` | ✅ | ✅ | ✅ |
| `compliance` | ✅ | ✅ | ❌ |
| `operator`, `readonly` | ✅ | ❌ | ❌ |

---

### `GET /accounts`

**Query params**: `?account_type=asset&level=4&include_inactive=false`

`account_type` values: `"asset"` | `"liability"` | `"equity"` | `"revenue"` | `"expense"`

**Success (HTTP 200)**
```json
{
  "items": [
    {
      "code": "11050501",
      "description": "Caja Moneda Extranjera USD",
      "level": 4,
      "parent_code": "110505",
      "account_type": "asset",
      "nature": "debit",
      "requires_third_party": false,
      "dian_format": "1099",
      "dian_concept": "01",
      "dian_column": "A",
      "is_active": true
    }
  ],
  "total": 1
}
```

---

### `POST /accounts`

> Requires `owner`, `admin`, `contador`, or `super_admin`

**Request**
```json
{
  "code": "11050502",
  "description": "Caja Moneda Extranjera EUR",
  "level": 4,
  "parent_code": "110505",
  "account_type": "asset",
  "nature": "debit",
  "requires_third_party": false,
  "dian_format": "1099",
  "dian_concept": "01",
  "dian_column": "A"
}
```

**Success (HTTP 201)** — returns `AccountResponse`.

---

### `GET /voucher-types`

**Success (HTTP 200)**
```json
[
  {
    "code": "FX",
    "name": "Operación Cambiaria",
    "template_json": {},
    "next_number": 43,
    "is_active": true
  }
]
```

---

### `POST /journal-entries`

> Requires `owner`, `admin`, `contador`, or `super_admin`. Total debits must equal total credits.

**Request**
```json
{
  "entry_date": "2026-05-12",
  "voucher_type_code": "FX",
  "description": "Compra USD - Ticket #42",
  "fx_transaction_id": "e5f6a7b8-c9d0-1234-efab-012345678906",
  "lines": [
    {
      "account_code": "11050501",
      "debit_cop": "2097285.00",
      "credit_cop": "0",
      "foreign_currency": "USD",
      "foreign_amount": "500.00",
      "exchange_rate": "4194.57",
      "description": "Ingreso USD compra"
    },
    {
      "account_code": "11000101",
      "debit_cop": "0",
      "credit_cop": "2097285.00",
      "description": "Egreso caja COP"
    }
  ]
}
```

**Success (HTTP 201)**
```json
{
  "id": "e1f2a3b4-c5d6-7890-efab-012345678912",
  "entry_number": 42,
  "voucher_type_code": "FX",
  "entry_date": "2026-05-12",
  "description": "Compra USD - Ticket #42",
  "fx_transaction_id": "e5f6a7b8-c9d0-1234-efab-012345678906",
  "created_by": "c3d4e5f6-a7b8-9012-cdef-012345678904",
  "created_at": "2026-05-12T10:15:00Z",
  "lines": [
    {
      "id": "f2a3b4c5-d6e7-8901-fabc-012345678913",
      "account_code": "11050501",
      "debit_cop": "2097285.00",
      "credit_cop": "0.00",
      "foreign_currency": "USD",
      "foreign_amount": "500.00",
      "exchange_rate": "4194.57",
      "third_party_id": null,
      "description": "Ingreso USD compra"
    },
    {
      "id": "a3b4c5d6-e7f8-9012-abcd-012345678914",
      "account_code": "11000101",
      "debit_cop": "0.00",
      "credit_cop": "2097285.00",
      "foreign_currency": null,
      "foreign_amount": null,
      "exchange_rate": null,
      "third_party_id": null,
      "description": "Egreso caja COP"
    }
  ]
}
```

**Failure — unbalanced entry (HTTP 422)**
```json
{
  "status_code": 422,
  "error_code": "JOURNAL_UNBALANCED",
  "detail": "Total debits (2097285.00) must equal total credits (2097200.00).",
  "hint": null
}
```

---

### `GET /journal-entries`

**Query params**: `?page=1&size=20&voucher_type=FX&date_from=2026-05-01&date_to=2026-05-31&fx_transaction_id=<uuid>`

**Success (HTTP 200)**
```json
{
  "items": [
    {
      "id": "e1f2a3b4-c5d6-7890-efab-012345678912",
      "entry_number": 42,
      "voucher_type_code": "FX",
      "entry_date": "2026-05-12",
      "description": "Compra USD - Ticket #42",
      "fx_transaction_id": "e5f6a7b8-c9d0-1234-efab-012345678906",
      "created_by": "c3d4e5f6-a7b8-9012-cdef-012345678904",
      "created_at": "2026-05-12T10:15:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "size": 20
}
```

---

### `POST /journal-entries/{entry_id}/reverse`

> Creates a mirror entry with swapped debit/credit.

**Success (HTTP 201)** — returns the reversal `JournalEntryResponse`.

---

### `GET /periods`

> Requires `compliance`, `admin`, `owner`, `contador`, or `super_admin`

**Success (HTTP 200)**
```json
{
  "closed_periods": [
    {
      "id": "b4c5d6e7-f8a9-0123-bcde-012345678915",
      "period_year": 2026,
      "period_month": 4,
      "closed_by": "c3d4e5f6-a7b8-9012-cdef-012345678904",
      "closed_at": "2026-05-02T09:00:00Z",
      "notes": "Cierre abril — revisado por contador"
    }
  ]
}
```

---

### `GET /reports/trial-balance`

**Query params**: `?date_from=2026-05-01&date_to=2026-05-31`

**Success (HTTP 200)**
```json
{
  "date_from": "2026-05-01",
  "date_to": "2026-05-31",
  "rows": [
    {
      "account_code": "11050501",
      "description": "Caja Moneda Extranjera USD",
      "opening_debit": "0.00",
      "opening_credit": "0.00",
      "period_debit": "10486425.00",
      "period_credit": "0.00",
      "closing_debit": "10486425.00",
      "closing_credit": "0.00"
    }
  ],
  "total_debit": "10486425.00",
  "total_credit": "10486425.00"
}
```

---

### `GET /reports/balance-sheet`

**Query params**: `?as_of_date=2026-05-31`

**Success (HTTP 200)**
```json
{
  "as_of_date": "2026-05-31",
  "assets": [
    { "account_code": "11050501", "description": "Caja Moneda Extranjera USD", "balance": "10486425.00" }
  ],
  "liabilities": [],
  "equity": [
    { "account_code": "31000000", "description": "Capital Social", "balance": "50000000.00" }
  ],
  "total_assets": "10486425.00",
  "total_liabilities": "0.00",
  "total_equity": "50000000.00"
}
```

---

### `GET /reports/ledger/{code}`

> Individual account ledger — all movements for a specific account code over a date range.

**Query params**: `?date_from=2026-05-01&date_to=2026-05-31`

Example: `GET /accounting/reports/ledger/11050501?date_from=2026-05-01&date_to=2026-05-31`

**Success (HTTP 200)**
```json
{
  "account_code": "11050501",
  "description": "Caja Moneda Extranjera USD",
  "date_from": "2026-05-01",
  "date_to": "2026-05-31",
  "opening_balance": "0.00",
  "closing_balance": "10486425.00",
  "lines": [
    {
      "entry_date": "2026-05-12",
      "entry_number": 42,
      "voucher_type_code": "FX",
      "description": "Compra USD - Ticket #42",
      "debit_cop": "2097285.00",
      "credit_cop": "0.00",
      "running_balance": "2097285.00"
    }
  ]
}
```

---

### `GET /reports/income-statement`

**Query params**: `?date_from=2026-05-01&date_to=2026-05-31`

**Success (HTTP 200)**
```json
{
  "date_from": "2026-05-01",
  "date_to": "2026-05-31",
  "revenues": [
    { "account_code": "41000000", "description": "Ingresos Operacionales", "balance": "637500.00" }
  ],
  "expenses": [
    { "account_code": "51000000", "description": "Gastos Operacionales", "balance": "120000.00" }
  ],
  "total_revenues": "637500.00",
  "total_expenses": "120000.00",
  "net_income": "517500.00"
}
```

---

### `GET /reports/libro-diario`

> Certified daily journal book — legally required under Art. 56 Código de Comercio.  
> Requires `compliance`, `admin`, `owner`, `contador`, or `super_admin`.

**Query params**: `?date_from=2026-05-01&date_to=2026-05-31`

**Success (HTTP 200)** — returns a certified `LibroDiarioReport` object with company header, NIT, accountant details, and all journal lines in legal format.

---

### `GET /reports/libro-mayor`

> Certified general ledger per account — legally required under Art. 56 Código de Comercio.

**Query params**: `?date_from=2026-05-01&date_to=2026-05-31&account_codes=11050501&account_codes=41000000`

`account_codes` is a repeatable param; omit it to get all active accounts.

**Success (HTTP 200)** — returns a certified `LibroMayorReport` object with per-account T-account layout.

---

### `GET /reports/balance-general`

> Certified balance sheet — legally required under Art. 56 Código de Comercio.

**Query params**: `?as_of_date=2026-05-31`

**Success (HTTP 200)** — returns a certified `BalanceGeneralReport` object with NIT, accountant, and auditor signature fields.

---

### `GET /niif-mappings`

> Mapping between local PUC account codes and NIIF (IFRS) codes.  
> Requires `compliance`, `admin`, `owner`, `contador`, or `super_admin`.

**Success (HTTP 200)**
```json
[
  {
    "local_code": "11050501",
    "niif_code": "1110",
    "description": "Cash and cash equivalents — foreign currency"
  }
]
```

---

### `POST /niif-mappings`

> Upserts a mapping (creates or replaces by `local_code`).  
> Requires `owner`, `admin`, `contador`, or `super_admin`.

**Request**
```json
{
  "local_code": "11050501",
  "niif_code": "1110",
  "description": "Cash and cash equivalents — foreign currency"
}
```

**Success (HTTP 201)** — returns `NiifMappingResponse`.

---

### `POST /periods/close`

> Closes an accounting period — no journal entries can be created for dates within a closed period.

**Request**
```json
{
  "period_year": 2026,
  "period_month": 4,
  "notes": "Cierre abril — revisado por contador"
}
```

**Success (HTTP 201)**
```json
{
  "id": "b4c5d6e7-f8a9-0123-bcde-012345678915",
  "period_year": 2026,
  "period_month": 4,
  "closed_by": "c3d4e5f6-a7b8-9012-cdef-012345678904",
  "closed_at": "2026-05-12T15:00:00Z",
  "notes": "Cierre abril — revisado por contador"
}
```

---

## Regulatory Reports `/api/v1/reports`

> All report generation requires `compliance`, `admin`, `owner`, `contador`, or `super_admin`. Daily cash also allows `operator`.

### `GET /daily-cash`

**Query params**: `?shift_date=2026-05-12&branch_code=BOG01`

**Success (HTTP 200)**
```json
[
  {
    "branch_code": "BOG01",
    "shift_date": "2026-05-12",
    "opening_cash_cop": "2000000.00",
    "total_buy_cop": "12500000.00",
    "total_sell_cop": "8900000.00",
    "net_cop": "3600000.00",
    "transaction_count": 18,
    "closing_cash_cop": "5600000.00"
  }
]
```

---

### `POST /dian/1099`

**Request**
```json
{
  "year": 2026,
  "quarter": 1,
  "num_envio": 1
}
```

**Success (HTTP 201)**
```json
{
  "id": "c5d6e7f8-a9b0-1234-cdef-012345678916",
  "report_type": "DIAN_1099",
  "year": 2026,
  "quarter": 1,
  "file_format": "xml",
  "file_path": "reports/acme-cambios/dian_1099_2026_Q1.xml",
  "generated_by": "c3d4e5f6-a7b8-9012-cdef-012345678904",
  "generated_at": "2026-05-12T16:00:00Z",
  "record_count": 245
}
```

---

### `POST /uiaf`

**Request**
```json
{
  "year": 2026,
  "quarter": 1
}
```

**Failure — UIAF not enabled (HTTP 422)**
```json
{
  "status_code": 422,
  "error_code": "UIAF_NOT_ENABLED",
  "detail": "UIAF reporting is not enabled for this tenant. Set uiaf_enabled=true in company settings.",
  "hint": null
}
```

---

### `GET /banrep/preview`

**Query params**: `?date_from=2026-05-05&date_to=2026-05-11`

**Success (HTTP 200)** — aggregated FX figures preview before committing the report.

---

### `POST /banrep`

**Request**
```json
{
  "date_from": "2026-05-05",
  "date_to": "2026-05-11"
}
```

**Success (HTTP 201)** — same shape as DIAN report response.

---

### `GET /compliance-certificate`

**Query params**: `?year=2026&month=4`

**Success (HTTP 200)** — monthly SARLAFT compliance summary.

---

### `GET /` (list generated reports)

**Query params**: `?report_type=DIAN_1099&limit=50&offset=0`

**Success (HTTP 200)** — array of `GeneratedReportOut` objects.

---

### `GET /{report_id}/download`

**Success** — returns the file as a binary download with appropriate `Content-Type` and `Content-Disposition` headers.

| File format | Content-Type |
|---|---|
| `xml` | `application/xml` |
| `txt` | `text/plain; charset=iso-8859-1` |
| `json` | `application/json` |
| `pdf` | `application/pdf` |

---

## Data Imports `/api/v1/imports` — super_admin only

### `POST /customers`

> Bulk-imports customers from a CSV file stored in object storage. `super_admin` only — not exposed in the tenant UI.

**Request**
```json
{
  "tenant_slug": "acme-cambios",
  "storage_provider": "s3",
  "bucket": "imports-bucket",
  "file_path": "acme-cambios/customers_2026_05.csv",
  "dry_run": true
}
```

Set `dry_run: true` to validate the file without committing any records.

**Success (HTTP 200)**
```json
{
  "tenant_slug": "acme-cambios",
  "file_path": "acme-cambios/customers_2026_05.csv",
  "dry_run": true,
  "rows_processed": 342,
  "rows_imported": 339,
  "rows_skipped": 3,
  "errors": [
    { "row": 12, "reason": "Duplicate document CC 79000001" },
    { "row": 87, "reason": "Invalid economic_activity_code '9999'" },
    { "row": 201, "reason": "Juridical person must use document_type NIT" }
  ]
}
```

**Failure — tenant not found (HTTP 404)**
```json
{
  "status_code": 404,
  "error_code": "TENANT_NOT_FOUND",
  "detail": "Tenant 'acme-cambios' does not exist.",
  "hint": null
}
```

**Failure — file not found in storage (HTTP 404)**
```json
{
  "status_code": 404,
  "error_code": "STORAGE_FILE_NOT_FOUND",
  "detail": "File 'acme-cambios/customers_2026_05.csv' not found in bucket 'imports-bucket'.",
  "hint": null
}
```

---

## Reference Data `/api/v1/reference`

### `GET /countries`

**Success (HTTP 200)**
```json
[
  { "code": "CO", "name": "Colombia", "alpha3": "COL" },
  { "code": "US", "name": "United States", "alpha3": "USA" }
]
```

---

### `GET /departments`

**Success (HTTP 200)**
```json
[
  { "dane_code": "11", "name": "Bogotá D.C." },
  { "dane_code": "05", "name": "Antioquia" }
]
```

---

### `GET /cities`

**Query params**: `?department=11`

**Success (HTTP 200)**
```json
[
  { "dane_code": "11001", "name": "Bogotá", "department_code": "11" }
]
```

---

### `GET /economic-activities`

**Success (HTTP 200)**
```json
[
  { "code": "4711", "description": "Comercio al por menor en establecimientos no especializados" },
  { "code": "6492", "description": "Actividades de las casas de cambio" }
]
```

---

### `GET /document-types`

**Success (HTTP 200)**
```json
[
  { "code": "CC", "description": "Cédula de Ciudadanía" },
  { "code": "NIT", "description": "Número de Identificación Tributaria" },
  { "code": "CE", "description": "Cédula de Extranjería" },
  { "code": "PA", "description": "Pasaporte" },
  { "code": "TI", "description": "Tarjeta de Identidad" },
  { "code": "RC", "description": "Registro Civil" },
  { "code": "OTHER", "description": "Otro" }
]
```

---

## Infrastructure

### `GET /`

**Success (HTTP 200)**
```json
{
  "message": "Currency Exchange Backend",
  "version": "1.0.0",
  "environment": "development"
}
```

---

### `GET /api/v1/health`

**Success (HTTP 200)**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-05-12T10:00:00Z"
}
```

---

### `GET /api/v1/health/ping`

**Success (HTTP 200)**
```json
{ "ping": "pong" }
```
