# Branch Protection Rules

To ensure code quality and stability, configure the following branch protection rules for the `main` branch:

## Required Settings

### Branch Protection Rules for `main`

1. **Require pull request reviews before merging**
   - Required approving reviews: 1
   - Dismiss stale pull request approvals when new commits are pushed: ✅

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging: ✅
   - Required status checks:
     - `ci` (GitHub Actions CI workflow)
     - All jobs must pass: Build, Typecheck, Lint, Format check, Tests, Coverage

3. **Require conversation resolution before merging**: ✅
   - All review comments must be resolved

4. **Require linear history**: ✅
   - Enforce a linear commit history (no merge commits)

5. **Do not allow bypassing the above settings**: ✅
   - Include administrators: ✅ (admins must follow same rules)

## How to Configure

1. Go to: **Settings** → **Branches** → **Branch protection rules**
2. Click **Add rule** or edit existing rule for `main`
3. Apply the settings above
4. Save changes

## Benefits

- ✅ **Quality Gate**: All code must pass CI checks before merge
- ✅ **Code Review**: Ensures peer review before changes go live
- ✅ **Clean History**: Linear history makes it easier to track changes
- ✅ **Conversation**: All feedback must be addressed before merge
- ✅ **Consistency**: Same rules apply to everyone, including admins

## CI Status Checks

The following checks must pass:

| Check        | Description                            |
| ------------ | -------------------------------------- |
| Install      | Dependencies installation with caching |
| Build        | TypeScript compilation                 |
| Typecheck    | Strict TypeScript validation           |
| Lint         | ESLint code quality                    |
| Format check | Prettier formatting                    |
| Tests        | Full test suite (36 tests)             |
| Coverage     | Minimum 70%/70%/65%/70% coverage       |

## Additional Recommendations

### GitHub Environments

Create a `production` environment with:

- Required reviewers for production deployments
- Wait timer: 5 minutes (allows time to cancel accidental deploys)
- Deployment branches: `main` only

### Security

- Enable **Dependabot alerts** for security vulnerabilities
- Enable **Secret scanning** to prevent credential leaks
- Enable **Code scanning** with CodeQL for automated security checks

### Notifications

Configure GitHub notifications for:

- Failed CI builds on `main`
- New security alerts
- Stale pull requests (7+ days)
