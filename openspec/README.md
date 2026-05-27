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
npm install -g @fission-ai/openspec@latest
```

More info: https://openspec.dev
