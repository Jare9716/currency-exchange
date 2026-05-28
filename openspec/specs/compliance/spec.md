# Compliance & Sanction Screening Specification

## Purpose

Enforces strict bank-grade compliance guardrails, mandatory sanction checks (Clinton List, SARLAFT, OFAC), fail-closed screening error boundaries, and secure query string encoding.

## Requirements

### Requirement: clinton-list-screening

The system SHALL query the central sanction catalog to determine if a customer has matches against restricted or sanctioned persons list.

#### Scenario: customer flagged in Clinton List is blocked
- GIVEN an operator is executing a sanction check
- WHEN they enter a name and document number that exists in the restricted database (e.g. "Pablo Escobar", "12345678")
- THEN the system returns `true` (blocked status)
- AND blocks the transaction from continuing, triggering a compliance alert

#### Scenario: clean customer passes sanction check
- GIVEN an operator is executing a sanction check
- WHEN they enter a name and document number with no matches in the restricted database
- THEN the system returns `false` (clear status)
- AND allows the cashier to proceed with the transaction registration

---

### Requirement: fail-closed-screening-error-handling

The system SHALL enforce a strict "fail-closed" model for compliance checks. Any network timeouts, service errors, or database failures during screening MUST result in blocking the customer and transaction, never silently passing.

#### Scenario: network error blocks the transaction
- GIVEN a customer screening check is initiated
- WHEN the connection to the sanction check API times out or returns HTTP 503
- THEN the system catches the exception in a `try-catch` boundary
- AND displays a prominent error: "Compliance check failed. Operation blocked."
- AND blocks the transaction from being registered (fail-closed behavior)
- AND safely releases the UI submitting lock in the `finally` block

---

### Requirement: secure-query-string-encoding

The system SHALL URL-encode all query parameters when making screening lookups to prevent injection attacks or encoding crashes on compound names, spaces, or Spanish accented characters.

#### Scenario: query compound name with accents
- GIVEN a search query for a customer named "José María Rodríguez"
- WHEN the HttpClient constructs the URL query
- THEN it applies explicit `encodeURIComponent` or `URLSearchParams` to translate the query to `Jos%C3%A9%20Mar%C3%ADa%20Rodr%C3%ADguez`
- AND prevents API crashes or routing errors on special characters

---

## Implementation Context

Relevant skills:
- [docs/standards/security.md](../../docs/standards/security.md)

Relevant endpoints:
- `GET /api/v1/sanction-lists/screening` — query clinton list sanction records
- `GET /api/v1/customers` — query customer profiles

## Notes
- "If uncertain, block." Under no circumstances can a network failure or database timeout allow a user to proceed without a verified clearance.
- Sanctions check results must never be cached persistently to local storage to prevent session tampering.
