# State Management & Architecture Standards

> Zustand store hygiene, strict TypeScript types, and Clean Architecture guidelines.

---

## 1. Always Reset Sensitive Stores on Logout

When a user logs out, all in-memory sensitive collections MUST be cleared to prevent PII leakage across multiple sessions on the same browser tab.

```typescript
// ✅ Correct logout pattern
const handleLogout = () => {
  useAuthStore.getState().clearTokens();
  useCustomersStore.getState().resetCustomers();
  useTransactionsStore.getState().resetTransactions();
  useShiftStore.getState().resetShift();
  router.push("/login");
};
```

Failure to call the reset actions means the next user who logs in on the same tab will see the previous user's data until the first fetch completes.

---

## 2. Minimal Store Write Surface

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

## 3. Use-Cases Must Have Active Callers

Every use-case class in `src/use-cases/` MUST be imported and called by at least one presentation component or hook. Orphaned use-cases that duplicate repository calls made directly from components are dead code and must be deleted.

```
# Before adding a new use-case, ask:
# - Is there a caller in presentation/ that will use it?
# - Does it add logic beyond a direct repository call?
# If the answer to both is NO, don't create it.
```

---

## 4. `null` Is Forbidden — Use `undefined`

Per AGENTS.md Rule 5: prefer `undefined` over `null`. This eliminates `typeof null === 'object'` bugs and keeps the type system consistent.

```typescript
// ❌ FORBIDDEN
const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

// ✅ CORRECT
const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>(undefined);
```

**Exception (MUI Popover / Menu Anchor):**
MUI's `Menu`, `Popover`, and `Popper` components require their `anchorEl` property to be typed as `HTMLElement | null` due to their internal types. Typing state as `HTMLElement | undefined` will fail TypeScript compiling. Thus, `useState<null | HTMLElement>(null)` is the **only** permitted exception to the `undefined`-over-`null` rule. All other UI and state logic must strictly use `undefined`.

---

## 5. Use-Case Instances Must Be Module-Level Singletons

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

## 6. Always Validate External API Responses with Zod

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

### Infrastructure API Schema Boundary Pattern

Domain schemas (e.g. `customerSchema`, `transactionSchema`) are pure representations of our domain model. They utilize `.optional()` for optional fields, which resolves to `type | undefined`. This is clean and matches React state and TypeScript's `?` property modifiers.

However, backends frequently return `null` for absent or nullable database values in JSON payloads. Zod's `.optional()` **does not accept `null`** and will throw a runtime `ZodError` when parsing backend responses containing `null`.

To prevent runtime parser crashes without contaminating our clean domain definitions with `null`, we enforce the **Infrastructure API Schema Boundary Pattern**:

1. **Private API Schema:** Every repository in `src/infrastructure/` that parses external API responses MUST define a private, internal-only schema (e.g. `apiTransactionSchema`, `apiCustomerListItemSchema`).
2. **Nullish Transform:** In the private API schema, any field that is optional or nullable in the database MUST use `.nullish().transform(val => val ?? undefined)`.
3. **Domain Mapping:** The repository parses raw API JSON using the private API schema (which cleanly translates `null` and `undefined` to `undefined`), then returns the parsed object mapped directly to the clean domain model type.

#### Example

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

### Outgoing Request Mapping Boundary

The API Schema Boundary pattern also applies to outgoing request bodies. If the API contract requires specific naming conventions, casing, or data shapes that differ from our clean Domain models, the translation MUST happen exclusively at the infrastructure boundary (within the Repository method).

**Example:**
The Domain layer uses `amount` to describe physical counts (`{ iso_code: "USD", amount: 1500 }`), but the backend API expects `{ iso_code: "USD", count: 1500 }`. The repository maps this cleanly before sending the HTTP POST:

```typescript
// src/infrastructure/http/HttpShiftRepository.ts

async close(shiftId: string, payload: CloseShiftPayload): Promise<Shift> {
  const apiPayload = {
    physical_counts: payload.physical_counts.map((c) => ({
      iso_code: c.iso_code,
      count: c.amount, // Maps domain 'amount' to API-expected 'count' at the boundary
    })),
  };
  
  const response = await HttpClient.post(
    `/api/v1/fx/shifts/${encodeURIComponent(shiftId)}/close`,
    apiPayload
  );
  const data = await response.json();
  return apiShiftSchema.parse(data);
}
```

---

## 7. Mandatory Request Body on POST Requests

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
