# FX Operations & Transactions Specification

## Purpose

Enforces Clean Architecture rules and strict business validations for executing foreign currency exchange operations (buying/selling USD, EUR, GBP), converting rates, and checking stock availability.

## Requirements

### Requirement: exchange-rate-retrieval

The system SHALL retrieve authoritative real-time daily TRM and product exchange rates for conversion.

#### Scenario: successfully retrieve active rates
- GIVEN a cashier navigates to the exchange form
- WHEN the system requests exchange rates for an operating currency (e.g. "USD")
- THEN it retrieves the current approved buy/sell rates from the active shift
- AND presents these rates to the operator for calculations

---

### Requirement: dynamic-currency-conversion

The system SHALL perform precise decimal-based mathematical calculations to convert foreign currency to COP or vice versa without losing floating-point precision.

#### Scenario: buy transaction conversion
- GIVEN an operator is entering a transaction to BUY foreign currency from a customer
- WHEN they enter a foreign amount of `100.00` USD at a rate of `4000.00` COP
- THEN the system calculates the expected payout COP balance exactly as `400000.00` COP
- AND displays the precise calculation to the operator before execution

#### Scenario: sell transaction conversion
- GIVEN an operator is entering a transaction to SELL foreign currency to a customer
- WHEN they enter a foreign amount of `100.00` USD at a rate of `4200.00` COP
- THEN the system calculates the expected customer payment exactly as `420000.00` COP
- AND displays the precise calculation to the operator before execution

---

### Requirement: transaction-execution-validations

The system SHALL validate the integrity of the transaction payload, ensuring the customer is registered, rates are current, and transaction balances are strictly positive.

#### Scenario: valid transaction execution succeeds
- GIVEN a valid registered customer ID
- AND a positive foreign amount of `100.00` USD
- WHEN the operator submits the exchange transaction
- THEN the system creates the transaction record
- AND allocates a unique sequential ticket number
- AND dispatches the transaction details to be persisted on the backend

#### Scenario: invalid transaction negative amount fails
- GIVEN a valid registered customer ID
- WHEN the operator attempts to execute an exchange transaction with a zero or negative foreign amount (e.g. `-50.00` USD)
- THEN the system throws a `validation_error` DomainError
- AND blocks the transaction from being registered in the repository

---

### Requirement: stock-inventory-controls

The system SHALL enforce strict inventory checks on SELL transactions, blocking operations if there is insufficient foreign cash stock.

#### Scenario: sell transaction succeeds with sufficient stock
- GIVEN the current active shift has `1500.00` USD in stock
- WHEN the operator submits a sell transaction of `200.00` USD
- THEN the system validates the stock level successfully
- AND registers the sale, decrementing the shift stock level to `1300.00` USD

#### Scenario: sell transaction blocked by insufficient stock
- GIVEN the current active shift has only `50.00` USD in stock
- WHEN the operator attempts to submit a sell transaction of `100.00` USD
- THEN the system catches the violation
- AND throws an `INSUFFICIENT_STOCK` error with HTTP 422
- AND blocks the transaction from executing

---

### Requirement: sarlaft-limit-controls

The system SHALL enforce transaction volume thresholds (SARLAFT) on customer accounts, blocking transactions that exceed regulatory accumulators.

#### Scenario: transaction blocked by SARLAFT accumulator
- GIVEN a customer has accumulated high volumes of monthly transactions
- WHEN a new exchange transaction is submitted that would push the total past the allowed limit
- THEN the system throws a `SARLAFT_THRESHOLD_EXCEEDED` error with HTTP 422
- AND blocks the transaction, instructing the operator to seek compliance verification

---

## Implementation Context

Relevant skills:
- [docs/standards/security.md](../../docs/standards/security.md)
- [docs/standards/state-management.md](../../docs/standards/state-management.md)

Relevant endpoints:
- `POST /api/v1/fx/transactions` — execute and register a currency transaction
- `GET /api/v1/fx/transactions` — retrieve branch transaction lists

## Notes
- Numbers must NEVER be parsed with standard floating point JavaScript/TypeScript conversion; precision decimals MUST be used to prevent loss on large COP figures.
- Form state is strictly isolated inside React Hook Form to avoid store synchronization overheads.
