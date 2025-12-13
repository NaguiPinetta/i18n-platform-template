# Contributing Guidelines

Thank you for your interest in contributing to the i18n-platform-template! This document outlines the conventions and guidelines for contributing to this project.

## Branch Conventions

### Branch Naming
- Use descriptive branch names that indicate the feature or fix
- Format: `{type}/{short-description}`
- Examples:
  - `feature/add-rtl-support`
  - `fix/translation-import-bug`
  - `docs/update-readme`
  - `refactor/ui-components`

### Branch Types
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring without changing functionality
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks, dependency updates

## Commit Conventions

### Commit Message Format
Follow the conventional commits format:

```
{type}: {short description}

{optional longer description}
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat: add CSV export functionality for translations

fix: resolve RTL layout issue in navigation component

docs: update i18n pipeline specification
```

## Pull Request Process

### One Feature Per PR
- **Each PR should focus on a single feature or fix**
- Keep PRs focused and reviewable
- If a feature is large, break it into smaller, incremental PRs
- Multiple related small changes can be grouped if they're tightly coupled

### PR Checklist
Before submitting a PR, ensure:
- [ ] Code follows the project's style guidelines
- [ ] All tests pass (when tests are added)
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main
- [ ] No console errors or warnings

### PR Description
Include:
- What changes were made and why
- How to test the changes
- Screenshots (if UI changes)
- Related issues or discussions

## Style Rules

### UI Component Usage

#### Use Shared UI Primitives
- **Always use shared UI components** from the design system
- Don't create custom components that duplicate existing functionality
- If you need a new component, consider if it should be added to the shared library

#### Don't Invent Page Layouts
- **Use the standard page layout structure** defined in the UI specification
- Follow the page anatomy guidelines in `specs/ui.md`
- Maintain consistent spacing, padding, and alignment
- If you need a new layout pattern, discuss it first before implementing

#### Component Guidelines
- Keep components focused and reusable
- Use TypeScript for all components
- Follow the design system's spacing and color tokens
- Ensure components work in both LTR and RTL modes
- Make components accessible (ARIA labels, keyboard navigation, etc.)

### Code Style
- Use TypeScript for all new code
- Follow the project's formatting rules (see `.prettierrc` and `.editorconfig`)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### File Organization
- Place shared components in the appropriate shared directory
- Keep page-specific code in page directories
- Follow the existing project structure

## Getting Started

1. Fork the repository
2. Create a branch from `main` following the naming conventions
3. Make your changes following the style guidelines
4. Test your changes thoroughly
5. Submit a PR with a clear description

## Questions?

If you have questions about contributing, please open an issue for discussion before starting work on a large feature.