---
name: contributions
kind: standards
description: Defines branching, conventional commits, pull requests, and Git workflows for the Currency Exchange project.
tier: foundational
targets: ["all"]
version: 1.0.0
owner: engineering
---

# Contribution Guidelines

> Strict standards for branching, commit messages, and pull request hygiene in the Currency Exchange project.

## When to use these guidelines

- Creating a new Git branch.
- Drafting commit messages.
- Structuring pull requests and code changes.
- Preparing code reviews.

---

## Branch Naming Conventions

All branches in this project MUST follow the prefix-based naming strategy:

### 1. New Features
Use the `feat/` prefix followed by a concise, kebab-case description.
- **Example:** `feat/shift-transactions-and-loading-ux`

### 2. Bug Fixes
Use the `fix/` prefix.
- **Example:** `fix/parse-nullish-exchange-rate`

### 3. Refactoring
Use the `refactor/` prefix.
- **Example:** `refactor/extract-kyc-validator`

### 4. Non-Functional Maintenance
Use prefixes like `docs/`, `chore/`, `test/`, or `style/` for documentation updates, pipeline edits, tests, or styling refinements.
- **Example:** `docs/update-api-guide`

---

## Conventional Commits

We strictly enforce **Conventional Commits** (enforced automatically via Git hooks). Every commit message must match one of the following formats:

### Commit Types:
- **`feat:`** — Introduces new functionality. *(e.g., `feat: filter transactions by active shift ID`)*
- **`fix:`** — Patches a bug. *(e.g., `fix: prevent null values in user state`)*
- **`refactor:`** — Code change that neither fixes a bug nor adds a feature. *(e.g., `refactor: clean up unused transaction helper`)*
- **`chore:`** — Routine maintenance tasks (dependencies, configurations). *(e.g., `chore: update packages`)*
- **`docs:`** — Documentation changes only. *(e.g., `docs: add contributions standard`)*
- **`test:`** — Adding missing tests or correcting existing tests. *(e.g., `test: add unit test for ExecuteTransaction`)*
- **`style:`** — Changes that do not affect the meaning of the code (white-space, formatting, semicolons).

---

## Pull Request Sizing & Best Practices

To maintain high review velocity and minimize integration risks:

- **Keep changes small:** Pull requests should ideally be **under 300 lines of code** (LOC) and highly focused on a single responsibility (see Key Rule 7 in AGENTS.md).
- **Decouple tasks:** Separate unrelated improvements (such as linting, formatting, or general refactors) into different commits or pull requests.
- **Quality Assurance:** All changes must comply with our layering architecture, test requirements, and UI/UX standards.

---

## Pre-commit & Pre-push Gates

Husky automatically gates your contributions to prevent bad code from reaching production:
- **Pre-commit:** Runs `eslint` and automatic formatting.
- **Pre-push:** Runs all unit tests.

> [!WARNING]
> Never bypass these automated gates (e.g., using `--no-verify`). Linting and test execution are mandatory to ensure system-wide stability.
