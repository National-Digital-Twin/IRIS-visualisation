# Contributing Guidelines

Thank you for your interest in contributing to this project! To maintain consistency and quality in our codebase, please follow these guidelines when contributing.

## Git Flow Workflow

This repository follows the Git Flow workflow. Please adhere to the following branching strategy:

1. **Main Branch (`main`)**: This branch always contains stable, production-ready code. Do not commit directly to `main`.
2. **Develop Branch (`develop`)**: This is the integration branch where feature branches are merged.
3. **Feature Branches (`feature/<feature-name>`)**: Create feature branches off `develop` for new features. Use descriptive branch names, e.g., `feature/user-authentication`.
4. **Fix Branches (`fix/<feature-name>`)**: Create fix branches off `develop` for non-urgent bug fixes. Use descriptive branch names, e.g., `fix/content-typo`.
5. **Hotfix Branches (`hotfix/<hotfix-name>`)**: For urgent fixes in production, create hotfix branches off `main`.
6. **Release Branches (`release/<version>`)**: When preparing for a new production release, create a `release` branch from `develop`.

### Git Flow Process

- **Starting a feature:**
  ```sh
  git checkout develop
  git pull origin develop
  git checkout -b feature/<feature-name>
  ```
- **Committing Changes:**
  - Follow conventional commit messages and include a ticket number where relevant (e.g., `feat: [REQID-1] add login functionality` or `fix: [REQID-2] resolve API bug`).
  - Keep commits atomic and focused.
  - **Squash commits when merging into `develop`** to keep the history clean.
- **Merging Changes:**
  - Before merging, ensure your branch is up to date with `develop`.
  - Create a Pull Request (PR) following the PR template.
  - Get at least one approval before merging.

## Pull Request Guidelines

Before submitting a PR, ensure the following:

- Your branch is based on the latest `develop` branch.
- You have completed all required sections of the PR template.
- The PR title follows the format: `[Feature/Fix] [Ticket ID] Short description` (e.g., `[Feature] [REQID-1] Implement user authentication`).
- The code is properly formatted and linted.
- Tests are included and pass.

## Reviewing Pull Requests

When reviewing a PR:

1.  Ensure the PR author has completed the PR template.
2.  Verify that the changes adhere to the Git Flow process.
3.  Check that commits are meaningful and follow conventional commit messages.
4.  Confirm that tests are included and pass.
5.  Ensure that the changes are well-documented where necessary.
6.  Provide constructive feedback and request changes if needed.

## Additional Notes

- If you are unsure about any aspect of contributing, please ask in a discussion or issue.
- Respectfully collaborate and communicate with other contributors.

By contributing, you agree to follow these guidelines and help maintain the quality of the project.

Happy coding! 🚀
