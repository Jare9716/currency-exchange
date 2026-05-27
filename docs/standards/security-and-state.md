# Security & State Management Standards

> Bank-grade guardrails for data safety, API security, and Zustand state hygiene.
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

## 2. Always Reset Sensitive Stores on Logout

When a user logs out, all in-memory sensitive collections MUST be cleared to prevent PII leakage across multiple sessions on the same browser tab.

```typescript
// ✅ Correct logout pattern
const handleLogout = () => {
  useAuthStore.getState().clearTokens();
  useCustomersStore.getState().resetCustomers();
  useTransactionsStore.getState().resetTransactions();
  router.push("/login");
};
```

Failure to call `resetCustomers()` and `resetTransactions()` means the next user who logs in on the same tab will see the previous user's data until the first fetch completes.

---

## 3. Fail-Closed for All Compliance Checks

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

## 4. URL-Encode All Query Parameters

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

## 5. Always Validate External API Responses with Zod

Every response from an external API call MUST be parsed through a Zod schema before use. Never trust raw `response.json()` directly.

```typescript
// ❌ DANGEROUS — no validation, runtime crash if backend changes
const data = await response.json();
const customer = data as Customer;

// ✅ CORRECT — throws ZodError with a clear message if contract is violated
const data = await response.json();
const customer = customerSchema.parse(data);
```

This applies to: `save`, `findAll`, `findByDocument`, `findAll` for transactions, and all currency/TRM endpoints.

**Exception:** The Clinton List `isBlocked` endpoint returns a simple `{ matchCount: number }` shape that is validated via a direct property check. A Zod schema should be added when the contract is formalized.

**Critical Note:** When writing schemas for external API parsing, you must follow the **Infrastructure API Schema Boundary** standard outlined in **Section 11**. Never parse incoming API responses directly using pure domain schemas.

---

## 6. Minimal Store Write Surface

Expose only the actions that are actually called. Dead or speculative store actions (e.g., `addCustomer`, `setCustomers`) expand the mutable API surface and create confusion about intent.

**Rule:** Before adding any new store action, verify it has an active caller in the codebase.

```typescript
// ❌ ANTI-PATTERN — dead action, no callers
interface CustomersState {
  addCustomer: (customer: Customer) => void; // Never called
  setCustomers: (...) => void;               // Never called
}

// ✅ CORRECT — only expose what is actively used
interface CustomersState {
  resetCustomers: () => void;
  fetchCustomers: (filters?: CustomerFilters) => Promise<void>;
}
```

---

## 7. Use-Cases Must Have Active Callers

Every use-case class in `src/use-cases/` MUST be imported and called by at least one presentation component or hook. Orphaned use-cases that duplicate repository calls made directly from components are dead code and must be deleted.

```
# Before adding a new use-case, ask:
# - Is there a caller in presentation/ that will use it?
# - Does it add logic beyond a direct repository call?
# If the answer to both is NO, don't create it.
```

---

## 8. `null` Is Forbidden — Use `undefined`

Per AGENTS.md Rule 5: prefer `undefined` over `null`. This eliminates `typeof null === 'object'` bugs and keeps the type system consistent.

```typescript
// ❌ FORBIDDEN
const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

// ✅ CORRECT
const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>(undefined);
```

**Exception (MUI Popover / Menu Anchor):**
MUI's `Menu`, `Popover`, and `Popper` components require their `anchorEl` property to be typed as `HTMLElement | null` due to their internal types. Typing state as `HTMLElement | undefined` will fail TypeScript compiling. Thus, `useState<null | HTMLElement>(null)` is the **only** permitted exception to the `undefined`-over-`null` rule. All other UI and state logic must strictly use `undefined`.

**Compliance:** As of the eighth audit sweep, zero known exceptions remain in the codebase. All components, props, states, and stores are 100% compliant with the `undefined` type standard.

---

## 9. Token Refresh Is Centralized in HttpClient

Token refresh logic MUST live exclusively in `HttpClient.ts`. No individual repository, use-case, or component should manually retry requests or refresh tokens. This prevents scattered, inconsistent retry logic.

The session expiry event (`session:expired`) MUST be listened to in the global `ThemeRegistry` only — not in individual components.

---

## 10. Use-Case Instances Must Be Module-Level Singletons

Use-case instances that are stateless (no instance variables that change) MUST be created once at module level, not inside React hooks, callbacks, or render functions.

```typescript
// ❌ ANTI-PATTERN — allocates a new instance on every render/click
const handleMakeTransaction = async () => {
  const executeTransaction = new ExecuteTransaction(transactionRepository);
  await executeTransaction.execute(...);
};

// ✅ CORRECT — singleton, allocated once at module load
const executeTransaction = new ExecuteTransaction(transactionRepository);

export function CurrencyExchangeForm() {
  const handleMakeTransaction = async () => {
    await executeTransaction.execute(...);
  };
}
```

---

## 11. Infrastructure API Schema Boundary Pattern

**Rationale:**
Domain schemas (e.g. `customerSchema`, `transactionSchema`) are pure representations of our domain model. They utilize `.optional()` for optional fields, which resolves to `type | undefined`. This is clean and matches React state and TypeScript's `?` property modifiers.

However, backends frequently return `null` for absent or nullable database values in JSON payloads. Zod's `.optional()` **does not accept `null`** and will throw a runtime `ZodError` when parsing backend responses containing `null`.

To prevent runtime parser crashes without contaminating our clean domain definitions with `null`, we enforce the **Infrastructure API Schema Boundary Pattern**:

1. **Private API Schema:** Every repository in `src/infrastructure/` that parses external API responses MUST define a private, internal-only schema (e.g. `apiTransactionSchema`, `apiCustomerListItemSchema`).
2. **Nullish Transform:** In the private API schema, any field that is optional or nullable in the database MUST use `.nullish().transform(val => val ?? undefined)`.
3. **Domain Mapping:** The repository parses raw API JSON using the private API schema (which cleanly translates `null` and `undefined` to `undefined`), then returns the parsed object mapped directly to the clean domain model type.

### Example

```typescript
// src/infrastructure/http/HttpTransactionRepository.ts

// ✅ Private schema inside the repository maps incoming nulls to undefined at the boundary
const apiTransactionSchema = z.object({
  id: z.string(),
  ticket_number: z.number().nullish().transform(val => val ?? undefined),
  description: z.string().nullish().transform(val => val ?? undefined),
});

export class HttpTransactionRepository implements TransactionRepository {
  async save(payload: CreateTransactionPayload): Promise<Transaction> {
    const response = await HttpClient.post("/api/v1/fx/transactions", payload);
    const data = await response.json();
    
    // Parse using the API schema, which cleanly returns Transaction type containing undefined
    return apiTransactionSchema.parse(data);
  }
}
```

---

## 12. Mandatory Request Body on POST Requests

**Rationale:**
FastAPI and Pydantic backends enforce strict validation on JSON request bodies. If a POST route is declared with a request body model (even if all its properties are optional or if it has no properties), the backend expects a valid JSON payload at the root.

Sending `undefined` or a missing body payload in `HttpClient.post(url)` causes the backend to fail with a `422 Unprocessable Content` error:
```json
{
  "type": "missing",
  "loc": ["body"],
  "msg": "Field required"
}
```

**Rule:**
For all POST requests targeted at backend endpoints that declare a request body (such as closing a shift), developers MUST pass an explicit empty JSON object `{}` as the payload instead of calling the function with `undefined` or omitting the body.

```typescript
// ❌ FORBIDDEN — triggers 422 validation error on strict backends
const response = await HttpClient.post(`/api/v1/fx/shifts/${id}/close`);

// ✅ CORRECT — sends empty body to satisfy backend body payload requirement
const response = await HttpClient.post(`/api/v1/fx/shifts/${id}/close`, {});
```


