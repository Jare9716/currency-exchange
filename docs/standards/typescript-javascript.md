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
