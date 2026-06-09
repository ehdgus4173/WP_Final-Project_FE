# Contributing

Thanks for taking the time to contribute! This guide explains how to get started
and the conventions we follow.

## Getting started

1. Fork or clone the repository.
2. Install dependencies and set up your environment as described in the [README](./README.md).
3. Make sure the project runs locally before making changes.

## Branching

- `main` — production. Do not push directly.
- `develop` — integration branch. Do not push directly.
- Create a feature branch off `develop` for your work:

```bash
git checkout develop
git pull origin develop
git checkout -b <type>/<short-description>
```

Use a short, descriptive branch name with a type prefix:

- `feat/...` — a new feature
- `fix/...` — a bug fix
- `chore/...` — tooling, config, docs, or maintenance

## Commit messages

Keep commits small and focused. Use a clear, imperative message, ideally with a type prefix:

```
feat(board): replace post vote buttons with heart + score
fix(post): keep comment mention scroll inside the thread
docs: update README
```

## Pull requests

1. Push your branch and open a Pull Request against `develop`.
2. Give the PR a clear title and describe **what** changed and **why**.
3. Make sure all checks (CI / tests) pass.
4. Request a review and address feedback.
5. A maintainer merges once approved. Both `develop` and `main` are protected,
   so all changes go in through a Pull Request.

## Code style & tests

- Follow the existing code style and project structure.
- Add or update tests when you change behavior.
- Run the test suite locally before opening a PR.

## Reporting issues

Open a GitHub Issue and include:

- What you expected to happen
- What actually happened
- Steps to reproduce (and screenshots/logs if helpful)

## Questions

If you're unsure about anything, open an issue or ask a maintainer before starting
larger changes. Thanks for contributing!
