# Repository Guidelines

## Project Structure & Module Organization

This repository is a Next.js grocery price finder for Singapore. The App Router entry points live in `app/`, shared application logic lives in `src/lib/`, automated tests live in `src/lib/__tests__/` and `tests/e2e/`, and supporting documentation lives in `docs/`.

Avoid committing generated output, local caches, credentials, or editor-specific files. If a new tool creates build artifacts, document the artifact path and add the appropriate ignore rules.

## Build, Test, and Development Commands

- `npm run dev` starts the local Next.js server.
- `npm run build` builds the production app.
- `npm run lint` runs Next.js linting.
- `npm test` runs Vitest unit tests.
- `npm run test:e2e` runs Playwright browser tests.

## Coding Style & Naming Conventions

Use TypeScript with strict types. Prefer small, pure helpers in `src/lib/` and keep source-specific fetching code under `src/lib/sources/`. Use PascalCase for React components, camelCase for functions and variables, and lowercase directory names.

## Testing Guidelines

Use Vitest for unit tests and Playwright for browser tests. Cover product matching, unit-price parsing, API validation, source failure handling, and key search UI states. Keep live retailer behavior out of deterministic unit tests; use fixtures for adapter parsing where possible.

## Commit & Pull Request Guidelines

No commit message convention can be inferred from the current Git history. Use short, imperative commit messages, such as `Add grocery search API` or `Document source adapters`.

Pull requests should include a concise summary, the reason for the change, and the verification performed. Link issues when available. Include screenshots only for visible UI changes.

## Agent-Specific Instructions

Before making changes, inspect the repository state and avoid assuming hidden tooling exists. Keep edits scoped, update documentation when behavior changes, and do not modify unrelated files. Do not add scraping behavior that bypasses login walls, CAPTCHA, payment flows, or explicit access controls.
