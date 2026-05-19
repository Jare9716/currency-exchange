# TypeScript & JavaScript Standards

> Good practices for TypeScript and JavaScript in this project.

## Stack

Projects have a strict and defined set of tools:

- **Node.js**: latest LTS version
- **Package manager**: pnpm
- **JavaScript flavor**: TypeScript
- **Web framework**: Next.js (App Router)
- **Styling & UI**: Material UI (MUI) v5
- **Testing framework**: Jest (Planned)

### Path Aliases

Use the `@/` prefix to reference the `src/` directory. This avoids complex relative imports (e.g., `../../../components`).

- `import { User } from '@/domain/User'`
- `import { LoginForm } from '@/presentation/components/LoginForm'`

### Language and Comments Boundary

We enforce a strict separation between technical codebase syntax and user-facing copy:

- **Codebase in English:** All developer-facing codebase elements—including code comments, JSX block annotations (`{/* */}`), documentation files (`.md`), JSDocs, variable names, function signatures, and technical remarks—MUST be written strictly in **English**.
- **UI in Spanish:** Spanish is exclusively reserved for end-user-facing text (e.g., component labels, UI buttons, placeholders, alert notifications, and error descriptions). Never mix Spanish sentences into codebase comments or diagnostic technical logs.

---

## Testing Standards

### Structure

The `test/` directory MUST mirror the `src/` structure to ensure consistency and ease of navigation.

- `src/domain/services/` -> `test/domain/services/`
- `src/use-cases/` -> `test/use-cases/`
- `src/infrastructure/` -> `test/infrastructure/`

### Patterns

- **Naming:** Follow `[filename].test.ts` or `[filename].spec.ts` (consistent with Jest).
- **Style:** Use the AAA (Arrange, Act, Assert) pattern.
- **Mocking:** Prefer explicit mocks over complex setup when possible.

---

## JavaScript Good Practices

### Function Signatures

Define function signatures as clean as possible: avoid destructuring on params and avoid inline types.

```typescript
// BAD
function start({ port = 3000 }: { port?: number }) {}

// GOOD
type StartOptions = {
  port?: number;
};
function start(options: StartOptions) {
  const { port = 3000 } = options;
}
```

Once a function grows, having everything (type definition, destructuring, defaults) in the definition can get too complex. Also, type generics don't work for inline types.

### Use `undefined` Over `null`

Stick to `undefined` wherever possible. `null` has an unexpected behavior: `typeof null === 'object'`, which sometimes creates bugs.

### Prefer Named Exports Over Default Exports

```typescript
// BAD — different names across imports
import myDefault from "./my-file";
import anotherName from "./my-file";

// GOOD — consistent names, friendlier for auto-imports
export function myFunction() {}
```

### Error Handling

Embrace the fact that basically any function can throw and we don't know what they will throw.

**Prefer top-level try-catch instead of nested ones.** Steps:

1. Code your first version optimistically (no error handling).
2. Review to find: places where you can recover, places where the error is not helpful.
3. Add error handling for those cases.
4. Add the top-level error handling for non-recoverable errors.

**Handle individual errors with the `to` function pattern:**

```typescript
// Use a utility like 'await-to-js' or a local implementation
const [error, result] = await to(somePromise);

if (error) {
  handleError(error);
} else {
  processResult(result);
}
```

**Use `assert` over if-throw statements:**

```typescript
const value: unknown = "my-value";
assert(typeof value === "string", "my value is not a string", { value });
// TypeScript infers that value is a string at this point
```

**No Mock Financial/Sensitive Fallbacks:**
- **Zero Stale Assumptions:** Never hardcode default fallbacks or assume static rates/prices if live transaction-critical APIs (such as TRM, currency inventory, compliance checks) fail or are offline.
- **Fail-Closed Strategy:** Financial and compliance operations must fail-closed. If data cannot be retrieved, throw a descriptive, user-facing error to block the transaction immediately and prevent financial liability.

**No Console Logs in Production:**
- **Telemetry Separation:** Never check in generic, unstructured `console.log`, `console.warn`, or `console.error` debug statements inside production-bound application files.
- **Propagation:** Propagate standard errors or use proper boundary error components (e.g. React Error Boundaries) to handle UI failure recovery.

---

## TypeScript Best Practices

### Avoid Adding Suffix `type`

```typescript
// BAD
type UserType = {
  /* ... */
};

// GOOD
type User = {
  /* ... */
};
```

### Prefer Singular Names for Union Types

```typescript
// BAD
type Statuses = "OPEN" | "CREATED";

// GOOD
type Status = "OPEN" | "CREATED";
```

### Avoid Type-Only Files

Avoid having types in independent files which makes devs jump between files. Prefer collocation of code by feature.
_Exception: Shared domain entities or complex utility types._

### Don't Use Single-Letter Names for Generic Types

```typescript
// BAD
function start<T, V>() {}

// GOOD
function start<TValue, TAnother>() {}
```

### Use `unknown` Over `any`

### Use `@ts-expect-error` Over `@ts-ignore`

```typescript
// GOOD
// @ts-expect-error explaining why the error is expected
const myValue: number = "clearly a string";
```

### Avoid `eslint-disable` Comments

Avoid using `eslint-disable`, `eslint-disable-line`, or `eslint-disable-next-line` comments unless it is absolutely, 100% necessary (such as in external third-party legacy wrappers).

Instead of disabling the rules:
- If a parameter is unused, either utilize it robustly (e.g., in a validation assertion, logging, or error-throwing guard clause) or restructure the function signature.
- Fix the underlying type structure or code logic rather than suppressing warnings.

### Always Validate/Parse External Data

- Responses from external calls (API)
- `JSON.parse(externalData)`
- Local storage or URL parameters

```typescript
import { z } from "zod";

const storeSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const response = await fetch("/api/store");
const data = await response.json();
const store = storeSchema.parse(data);
```

### Avoid Casting as Much as Possible

Avoid `myVariable as MyType`. Use schemas or type guards instead.

### Prefer String Literals Over Enums

```typescript
// GOOD
type QuestStatus = "OPEN" | "CREATED" | "IN_PROGRESS";

// Or if you need to use their values:
const statuses = ["OPEN", "CLOSED"] as const;
type QuestStatus = (typeof statuses)[number];
```

### Use `satisfies` for Strict Typing

```typescript
const themeConfig = {
  primary: "#000",
  secondary: "#fff",
} satisfies Record<string, string>;
```

---

## Zod Advanced Patterns

> [!NOTE]
> This project has been upgraded to **Zod v4**. In Zod v4, the standard `.passthrough()` method for objects has been replaced by `.loose()`. Always use `.loose()` to allow additional properties from external responses without throwing validation errors.

### `.transform()` for API Response Mapping

```typescript
export const storeSchema = z
  .object({
    store_id: z.string(),
    store_name: z.string(),
  })
  .transform((raw) => ({
    storeId: raw.store_id,
    storeName: raw.store_name,
  }));
```

### `.refine()` for Custom Validation

```typescript
const passwordSchema = z.string().refine((val) => val.length >= 8, {
  message: "Password must be at least 8 characters long",
});
```

### `.nullish().transform()` for API Response Null Safety

When consuming API data from backend systems, optional fields may return `null` instead of `undefined`. Since our domain layer strictly forbids `null`, use `.nullish().transform(val => val ?? undefined)` inside infrastructure API schemas to normalize the data cleanly at the boundary:

```typescript
// Private API Schema in infrastructure repo
const apiCustomerSchema = z.object({
  id: z.string(),
  phone: z.string().nullish().transform((val) => val ?? undefined),
});
```


---

## Dependencies

### Guidelines for Choosing Packages

- **Maintenance:** Relatively well and actively maintained.
- **Metrics:** downloads, stars, contributors.
- **TypeScript support:** Prefer packages with built-in types.
- **Size:** Use Bundlephobia to check size. Prefer smaller packages.

**Packages to avoid:**

- **Axios:** Use native `fetch` in Next.js apps whenever possible.
- **Lodash:** Use modern JS methods or small specific utilities.

### Keeping Dependencies Up to Date

Regularly check for updates, especially minor and patch versions.

```bash
# Check for updates
pnpm outdated
```
