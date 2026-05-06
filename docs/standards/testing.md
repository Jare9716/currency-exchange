# Testing Standards

> Essential best practices for testing in this project using **Jest**.

## General Principles

- **Focus on Behavior:** Test inputs and outputs, not implementation details.
- **Mock selectively:** Only mock external dependencies or expensive operations.
- **Consistent Structure:** Always mirror the `src/` directory structure in `test/`.
- **Pre-commit / Pre-push Hooks:** Code cannot be committed if linting fails, and cannot be pushed if tests fail (enforced by Husky + lint-staged).
- **Minimum Coverage:** We aim for a strict minimum of 80% coverage across the `domain/` and `use-cases/` layers. No new features should be pushed without corresponding tests.
- **Type Safety:** Tests must be strictly typed. Using `any` in tests is just as bad as using `any` in production code.

---

## Grouping Tests

Use `describe` to group scenarios and `it` for the specific expectation.

```typescript
// GOOD
describe('ExecuteTransaction', () => {
  describe('when funds are insufficient', () => {
    it('should throw an InsufficientFundsError', () => {
      // Arrange, Act, Assert
    });
  });
});
```

*Rule of thumb: If your test description contains "when" or "if", it probably belongs in a `describe` block.*

---

## The AAA Pattern

Every test should follow the **Arrange-Act-Assert** pattern:

- **Arrange:** Set up the test data, mocks, and conditions.
- **Act:** Call the function or component under test.
- **Assert:** Verify that the result matches your expectations.

---

## Mocking in Jest

Use `jest.fn()` for individual mocks and `jest.mock()` for module-level mocks.

```typescript
import { someFunction } from '../services/api';

jest.mock('../services/api', () => ({
  someFunction: jest.fn(),
}));

describe('MyTest', () => {
  it('should call the mocked function', () => {
    const mockData = { id: 1 };
    (someFunction as jest.Mock).mockReturnValue(mockData);

    // Act...
    // Assert: expect(someFunction).toHaveBeenCalled();
  });
});
```

---

## Directory Structure

The `test/` directory MUST mirror the `src/` directory structure.

```
src/                                test/
├── domain/                         ├── domain/
│   └── Client.ts                   │   └── Client.test.ts
├── use-cases/                      ├── use-cases/
│   └── AuthenticateUser.ts         │   └── AuthenticateUser.test.ts
└── infrastructure/                 └── infrastructure/
    └── ApiClient.ts                    └── ApiClient.test.ts
```

---

## Unit Testing Guidelines

- Aim for high coverage in the **Domain** and **Use Case** layers.
- Use clear naming for test variables: `inputData`, `expectedResult`, `actualResult`.
- Keep tests fast and isolated (no shared state between tests).

---

## After Making Changes

Always run linting before considering a change complete:

```bash
pnpm lint
# pnpm test
```
