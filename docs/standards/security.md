# Security Standards

> Bank-grade guardrails for data safety and API security.
> These rules were distilled from multiple audit sweeps on this codebase.

---

## 1. PII & Dynamic Collections: NEVER Persist to Storage

**Rule 14 (AGENTS.md) — Full Expansion:**

Dynamic collections containing customer data or transaction history MUST NEVER be persisted to `localStorage`, `sessionStorage`, or Zustand's `persist` middleware.

```typescript
// ❌ FORBIDDEN — leaks PII to disk across sessions
export const useCustomersStore = create(
  persist(
    (set) => ({ customers: [] }),
    { name: "customers-storage", storage: createJSONStorage(() => localStorage) }
  )
);

// ✅ CORRECT — in-memory only, wiped on logout or tab close
export const useCustomersStore = create((set) => ({
  customers: [],
  resetCustomers: () => set({ customers: [] }),
}));
```

**Allowed persist targets:** Only transient auth tokens (`auth-storage`) and UI preferences (theme/layout).

---

## 2. Fail-Closed for All Compliance Checks

Any operation that involves a compliance screening (Clinton List, SARLAFT) MUST be wrapped in a `try-catch-finally` block that **blocks the operation if the check fails**, never silently passes it.

```typescript
// ✅ Fail-closed pattern
setIsSubmitting(true);
try {
  const isListed = await validateClintonList.execute(name, document);
  if (isListed) {
    // Block the transaction — DO NOT proceed
    showNotification("Customer is flagged.", "error");
    return;
  }
  await customerRepository.save(customerData);
} catch (err) {
  // Network failure, timeout, or service error → block it
  showNotification("Compliance check failed. Operation blocked.", "error");
} finally {
  setIsSubmitting(false); // Always release the UI
}
```

**Never** let a compliance check network error silently pass as "not listed". The default must always be: **if uncertain, block**.

---

## 3. URL-Encode All Query Parameters

Never interpolate user-facing strings directly into URL query strings. Always use `encodeURIComponent` or `URLSearchParams` (which encodes automatically).

```typescript
// ❌ DANGEROUS — breaks with accented names or spaces
const url = `/api/v1/clinton-list/persons/by-name?name=${name}&idNumber=${id}`;

// ✅ CORRECT — safe for compound names, accents, and special characters
const url = `/api/v1/clinton-list/persons/by-name?name=${encodeURIComponent(name)}&idNumber=${encodeURIComponent(id)}`;

// ✅ ALSO CORRECT — URLSearchParams encodes automatically
const params = new URLSearchParams({ name, idNumber: id });
const url = `/api/v1/clinton-list/persons/by-name?${params.toString()}`;
```

---

## 4. Token Refresh Is Centralized in HttpClient

Token refresh logic MUST live exclusively in `HttpClient.ts`. No individual repository, use-case, or component should manually retry requests or refresh tokens. This prevents scattered, inconsistent retry logic.

The session expiry event (`session:expired`) MUST be listened to in the global `ThemeRegistry` only — not in individual components.
