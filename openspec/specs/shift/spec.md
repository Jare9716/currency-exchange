# Shift Management Specification

## Purpose

Provides a secure, compliant, and robust infrastructure for box turnos (shifts), exchange rate volatility controls, transaction locks, and cash reconciliation.

## Requirements

### Requirement: cashier-shift-opening

The system SHALL enforce explicit validation when starting an operator's daily shift, ensuring starting COP cash is registered, rates are validated, and high-volatility currencies require overrides.

#### Scenario: positive initial cash COP
- GIVEN an operator attempts to open a shift
- WHEN the operator inputs an initial COP balance equal to or greater than zero
- THEN the system accepts the input and proceeds to rate validations

#### Scenario: negative initial cash COP
- GIVEN an operator attempts to open a shift
- WHEN the operator inputs a negative initial COP balance
- THEN the system throws a validation error
- AND prevents the shift from opening

#### Scenario: standard rate proposal accepted
- GIVEN a rate proposal is successfully retrieved
- WHEN the currencies have stable rate trends (`volatility_flagged: false`)
- AND no manual overrides are entered
- THEN the system automatically approves the proposed rates on shift opening

#### Scenario: high-volatility rate override required
- GIVEN a rate proposal is successfully retrieved
- WHEN one or more currencies have highly unstable trends (`volatility_flagged: true`)
- AND no manual overrides are entered
- THEN the system displays a prominent volatility warning alert
- AND disables the shift opening action until explicit supervisor rates are supplied

#### Scenario: zero operating currencies blocked
- GIVEN a rate proposal is retrieved
- WHEN the proposal contains empty currencies or fails to load
- THEN the system blocks the opening action
- AND displays a warning stating that a shift cannot be opened with zero currencies

#### Scenario: strict rate override API serialization
- GIVEN standard currencies are operating without overrides
- WHEN the open shift request payload is constructed at the boundary
- THEN all omitted/undefined overrides are mapped explicitly to `null` in the JSON request body

---

### Requirement: transaction-blocking-state

The system SHALL block any currency exchange operations if no active open shift exists for the current branch.

#### Scenario: exchange transaction blocked without active shift
- GIVEN a branch has no active open shift
- WHEN the operator navigates to the currency exchange screen
- THEN the system completely disables and locks the exchange entry form
- AND displays a high-visibility alert banner prompting the operator to open a shift first

---

### Requirement: cash-reconciliation-arqueo

The system SHALL calculate discrepancies dynamically based on physical cash counts and expected book balances, providing visual status alerts.

#### Scenario: balanced cash reconciliation
- GIVEN a cashier count is executed
- WHEN the entered physical count matches the expected book balance exactly (`difference == 0`)
- THEN the system displays a balanced status using a green indicator with `CheckCircleIcon`

#### Scenario: surplus cash reconciliation (sobrante)
- GIVEN a cashier count is executed
- WHEN the entered physical count is greater than the expected book balance (`difference > 0`)
- THEN the system displays a warning status using an orange/amber indicator with `WarningIcon`

#### Scenario: deficit cash reconciliation (faltante)
- GIVEN a cashier count is executed
- WHEN the entered physical count is less than the expected book balance (`difference < 0`)
- THEN the system displays an error status using a red indicator with `ErrorIcon`

---

### Requirement: shift-close-state-hygiene

The system SHALL safely execute shift closure with mapped payloads and clean up all in-memory cache states to protect PII.

#### Scenario: amount to count payload mapping at boundary
- GIVEN an operator submits physical counts
- WHEN the close shift request is dispatched at the repository boundary
- THEN the domain `amount` properties are mapped to the API-expected `count` properties in the outgoing payload

#### Scenario: secure store reset on shift close
- GIVEN a shift is successfully closed
- WHEN the store clears the shift session
- THEN all active in-memory shifts and operated cash states are reset to `undefined`

---

## Implementation Context

Relevant skills:
- [docs/standards/security.md](../../../docs/standards/security.md)
- [docs/standards/state-management.md](../../../docs/standards/state-management.md)
- [docs/standards/typescript-javascript.md](../../../docs/standards/typescript-javascript.md)

Relevant endpoints:
- `GET /api/v1/fx/shifts/current` — retrieve branch active shift
- `GET /api/v1/fx/shifts/rate-proposal` — retrieve exchange rate proposals
- `POST /api/v1/fx/shifts/open` — open branch cashier shift
- `POST /api/v1/fx/shifts/{id}/close` — close active cashier shift

## Notes
- Outgoing close shift request body requires `count` (API) instead of `amount` (domain).
- High volatility is dynamically derived via backend spread/volatility guardrails.
- Opening shift payloads with undefined rate overrides must map those overrides to explicit `null` values at the boundary.
- Visual warning states strictly use official Material UI icons (`CheckCircleIcon`, `WarningIcon`, `ErrorIcon`) to avoid using custom emojis.
