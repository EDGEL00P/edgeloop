# Contributing to EdgeLoop

Thank you for your interest in contributing to EdgeLoop! This guide will help you get started with development and ensure your contributions align with our quality standards.

## Development Setup

### Prerequisites

- **Node.js**: Version 22 or higher
- **pnpm**: Version 10 or higher
- **Git**: For version control

### Initial Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/EDGEL00P/edgeloop.git
   cd edgeloop
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Build the project**:

   ```bash
   pnpm run build
   ```

4. **Set up Git hooks** (automatic via `prepare` script):
   ```bash
   pnpm run prepare
   ```

## Development Workflow

### Making Changes

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Run quality checks** (these also run automatically on commit):

   ```bash
   # Type checking
   pnpm run typecheck

   # Linting
   pnpm run lint

   # Formatting
   pnpm run format:check

   # Tests
   pnpm test
   ```

4. **Fix any issues**:

   ```bash
   # Auto-fix linting issues
   pnpm run lint:fix

   # Auto-format code
   pnpm run format
   ```

### Pre-Commit Hooks

We use Husky to run quality checks before each commit. These checks include:

- ✅ TypeScript type checking
- ✅ ESLint linting
- ✅ Prettier formatting
- ✅ Test suite execution

If any check fails, the commit will be blocked. Fix the issues and try again.

## Testing Strategy

### Test Organization

- **Unit Tests**: Located alongside source files (e.g., `src/sum.test.ts`)
- **Integration Tests**: API handler tests in `api/*.test.ts`
- **Coverage Requirements**: Minimum 70% line/function coverage, 65% branch coverage

### Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests with interactive UI
pnpm test:ui
```

### Writing Tests

- Use Vitest as the testing framework
- Follow existing test patterns (see `api/*.test.ts` for examples)
- Mock HTTP requests/responses for API handlers
- Test both success and error cases
- Include edge case scenarios

## CI/CD Pipeline

### GitHub Actions

Our CI pipeline runs on every push and pull request:

1. **Install**: Dependencies installation with caching
2. **Build**: TypeScript compilation with build cache
3. **Type Check**: Strict TypeScript validation
4. **Lint**: ESLint code quality checks
5. **Format**: Prettier formatting validation
6. **Test**: Full test suite execution
7. **Coverage**: Code coverage reporting to Codecov

### Pipeline Optimizations

- **Concurrency Control**: Cancels outdated builds for same branch/PR
- **Dependency Caching**: Speeds up installation (pnpm store)
- **Build Caching**: Speeds up TypeScript compilation
- **Test Artifacts**: Uploads test results on failure

### Coverage Requirements

Code coverage thresholds are enforced in CI:

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 65%
- **Statements**: 70%

## Code Quality Standards

### TypeScript

- Use **strict mode** (enabled by default)
- Define explicit types for function parameters and return values
- Use `type` for object shapes, `interface` for extensible contracts
- Prefer type inference for local variables

### Linting & Formatting

- **ESLint**: Enforces code quality and best practices
- **Prettier**: Ensures consistent code formatting
- Run `pnpm run lint:fix` and `pnpm run format` before committing

### Code Style

- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for types and interfaces
  - `UPPER_SNAKE_CASE` for constants
- **Comments**: Only add when necessary to explain complex logic
- **Dependencies**: Keep dependencies minimal; prefer zero-dependency solutions

## Architecture Guidelines

### Monorepo Structure

```
edgeloop/
├── packages/
│   ├── shared/        # Shared types and utilities
│   └── server/        # Server utilities and Vercel helpers
├── api/               # Vercel serverless functions
└── vitest.config.ts   # Test configuration
```

### Design Principles

- **Dependency-light**: Minimal external dependencies
- **Security-first**: Hardened headers, input validation, fail-safe defaults
- **Observable**: Structured JSON logging, request tracing
- **Fail-fast**: Invalid config and malformed requests caught early

## Pull Request Process

1. **Create PR** with a clear title and description
2. **Link issues** if addressing specific bugs or features
3. **Wait for CI** to pass (all checks must be green)
4. **Address feedback** from code reviewers
5. **Squash commits** if requested before merge

### PR Checklist

- [ ] All tests pass locally
- [ ] Code coverage meets thresholds
- [ ] Linting and formatting pass
- [ ] Documentation updated (if needed)
- [ ] No security vulnerabilities introduced
- [ ] Backward compatibility maintained

## Deployment

### Vercel

Production deployments happen automatically via Vercel:

- **Preview**: Every PR gets a preview deployment
- **Production**: Merges to `main` deploy to production

### Local Testing

Test serverless functions locally:

```bash
# Build first
pnpm run build

# Run standalone server
node packages/server/dist/cli.js

# Server runs on http://localhost:3000
```

## Getting Help

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report vulnerabilities privately via GitHub Security Advisories

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
