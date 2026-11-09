# Repository Guidelines

## Project Structure & Module Organization

This repository is currently a blank starting point. Keep implementation code in a clearly named top-level directory such as `src/`, tests in `tests/` or beside the code they cover, and static files in `assets/`. Avoid placing generated output, local caches, or secrets under version control. Add a short `README.md` when introducing a runnable application, including its entry point and required tooling.

Organize modules by feature or domain rather than by generic file type when the codebase grows. For example, use `src/auth/` or `src/catalog/` instead of a single large `src/components/` directory.

## Build, Test, and Development Commands

No build system or package manager is configured yet. When adding one, document the canonical commands in `README.md` and keep them predictable. Typical commands should include:

- `npm run dev` — start local development.
- `npm test` — run the complete automated test suite.
- `npm run lint` — check formatting and static-analysis rules.
- `npm run build` — produce the release artifact.

Do not commit build outputs unless the project explicitly requires them.

## Coding Style & Naming Conventions

Follow the formatter and linter configured for the chosen language; do not hand-format files against those tools. Use 2 spaces for JSON, YAML, and JavaScript/TypeScript unless the formatter specifies otherwise. Name directories and non-component files in `kebab-case`; use `PascalCase` for UI components/classes and `camelCase` for functions and variables. Prefer small, focused modules and descriptive names over abbreviations.

## Testing Guidelines

Add tests with every behavior change. Name tests after the behavior under test, for example `auth-login.test.ts` or `test_user_can_log_in`. Keep tests deterministic and independent of external services; use fixtures or mocks for network and time-dependent behavior. Run the full test and lint commands before opening a pull request.

## Commit & Pull Request Guidelines

There is no established Git history yet. Use concise, imperative commit subjects, such as `Add account validation` or `Fix navigation focus`. Keep commits focused. Pull requests should explain the change, note testing performed, link related issues, and include screenshots or recordings for user-visible changes.

## Security & Configuration

Keep credentials in local environment files (for example, `.env.local`) and commit only safe templates such as `.env.example`. Validate untrusted input at system boundaries and document any required configuration keys.
