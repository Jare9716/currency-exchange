# OpenSpec — Spec-Driven Development

This directory holds feature specifications and change proposals.
Specs describe **what the system should do**, not how the code should look.

## Structure

```
openspec/
├── specs/       # Authoritative specifications per capability
│   └── auth-session/
│       └── spec.md
└── changes/     # Active change proposals (temporary)
    └── add-remember-me/
        ├── proposal.md
        ├── design.md
        ├── tasks.md
        └── specs/
```

## Active Specifications

The core behavioral capabilities of our system are governed by the following authoritative specs:

- **[Shift Management](specs/shift/spec.md)**: Box turnos, rate overrides, volatility controls, cash reconciliation.
- **[Authentication & Session](specs/auth-session/spec.md)**: Secure logins, token refresh logic, session hygiene.
- **[Compliance & Sanction Screening](specs/compliance/spec.md)**: Clinton list checks, fail-closed boundaries, name encoding.
- **[FX Operations & Transactions](specs/fx-operations/spec.md)**: Exchange calculations, stock check validations, transaction logs.
- **[Spec Template](specs/_template.md)**: Standard template for new specification files.

## Workflow

1. **Propose**: `openspec propose <description>` — generates a change proposal
2. **Review**: Read proposal.md, design.md, and spec deltas before coding
3. **Implement**: Follow tasks.md, coding against the spec
4. **Archive**: `openspec archive` — moves completed change into specs

## When to Create a Spec

- Before implementing a new feature
- When changing existing behavior (the spec delta shows what changes)
- When multiple people need to align on what to build

## When to Update Specs

- After a feature ships and behavior is confirmed
- When requirements change (create a new change proposal first)

## Install

```bash
pnpm add -g @fission-ai/openspec@latest
```

More info: https://openspec.dev
