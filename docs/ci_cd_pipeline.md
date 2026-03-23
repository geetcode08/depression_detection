# CI/CD Pipeline Documentation

**Last Updated**: 2026-03-23  
**Status**: ✅ Workflows Ready

---

## Overview

This project uses GitHub Actions for automated testing, linting, and building on every push and pull request. The pipeline ensures code quality, security, and readiness for deployment.

---

## Workflows

### 1. Backend Tests (`.github/workflows/backend-tests.yml`)

**Triggers**: 
- Push to `main` or `backend` branches
- Changes in `backend/` directory
- Pull requests to `main` or `backend` branches

**Jobs**:
- Python 3.11 setup and environment installation
- Linting with flake8
- Test suite execution with pytest (26-29 tests)
- Coverage report generation and upload to Codecov

**Status Badges**:
```markdown
![Backend Tests](https://github.com/geetcode08/depression_detection/actions/workflows/backend-tests.yml/badge.svg)
```

### 2. Frontend Tests & Build (`.github/workflows/frontend-tests.yml`)

**Triggers**:
- Push to `main` or `frontend` branches
- Changes in `frontend/` directory
- Pull requests to `main` or `frontend` branches

**Jobs**:
- Node.js 20 setup and dependency installation
- ESLint linting validation
- Vitest unit test execution
- Coverage report generation
- Next.js production build
- Build artifact storage (7 day retention)

**Status Badges**:
```markdown
![Frontend Tests](https://github.com/geetcode08/depression_detection/actions/workflows/frontend-tests.yml/badge.svg)
```

### 3. Full Stack Tests (`.github/workflows/fullstack-tests.yml`)

**Triggers**:
- Push to `main` branch
- Pull requests to `main` branch (all code changes)

**Jobs**:
- Backend tests (Python 3.11)
- Frontend tests, linting, and build (Node.js 20)
- ML training pipeline validation
- Code analysis (flake8, pylint)
- Security checks (hardcoded secrets scan)
- Summary job (gates merge on failures)

**Status Badges**:
```markdown
![Full Stack Tests](https://github.com/geetcode08/depression_detection/actions/workflows/fullstack-tests.yml/badge.svg)
```

---

## Workflow Details

### Environment Setup

All workflows use standard GitHub-hosted runners and caching for speed:

```yaml
# Python cache
cache: 'pip'

# Node cache
cache: 'npm'
cache-dependency-path: frontend/package-lock.json
```

### Test Execution

#### Backend Tests
```bash
# Executed in CI
cd backend
pip install -r requirements.txt
pytest tests/ -v --tb=short --cov=backend --cov-report=term-missing
```

**Expected Result**: ≥26 tests passing, <10% failures

#### Frontend Tests
```bash
# Executed in CI
cd frontend
npm ci
npm run lint
npm run test -- --run
npm run test:coverage
npm run build
```

**Expected Result**: 
- Lint: 0 errors
- Tests: All passing
- Build: Production ready

### Coverage Reports

Coverage reports are automatically uploaded to [Codecov](https://codecov.io):

```yaml
- uses: codecov/codecov-action@v3
  with:
    file: ./backend/coverage.xml  # or ./frontend/coverage/lcov.info
    flags: backend  # or frontend
```

**Coverage Targets**:
- Backend: 75%+ line coverage
- Frontend: 75%+ line coverage

### Security Checks

```bash
# Scan for hardcoded secrets
grep -r "sk-\|sk_\|gsk_" backend frontend/src

# Verify .env files are gitignored
git ls-files | grep -E "\.env$|\.env\.local$"
```

---

## Branch Protection Rules

**Recommended GitHub Settings**:

```
Branches > main > Branch protection rules:

✅ Require a pull request before merging
✅ Require approvals (1 minimum)
✅ Dismiss stale pull request approvals
✅ Require status checks to pass before merging
   Status checks required:
   - backend-tests / test
   - frontend-tests / lint
   - frontend-tests / test
   - frontend-tests / build
   - fullstack-tests / security-check

✅ Require up-to-date branches before merging
✅ Require branches to be up to date before merging
```

---

## Viewing Workflow Runs

### GitHub UI

1. Go to repository: `https://github.com/geetcode08/depression_detection`
2. Click "Actions" tab
3. Select workflow to view:
   - Backend Tests
   - Frontend Tests & Build
   - Full Stack Tests

### Workflow Run Details

Each run shows:
- ✅ Passed jobs (green)
- ❌ Failed jobs (red)
- ⏭️ Skipped jobs (gray)
- Execution time
- Logs for each job
- Annotations for failures

### Example

```
Full Stack Tests #42
✅ backend-tests / test (Python 3.11) — 4m 32s
✅ frontend-tests / lint — 2m 15s
✅ frontend-tests / test — 3m 45s
✅ frontend-tests / build — 5m 20s
✅ ml-validation — 1m 10s
✅ code-analysis — 2m 05s
✅ security-check — 30s
✅ summary — 5s
```

---

## Common Issues & Solutions

### Issue: Tests Timeout

**Cause**: Long-running operations or resource constraints  
**Solution**:
```yaml
- name: Run tests
  timeout-minutes: 30  # Increase from default 15
  run: |
    cd backend
    pytest tests/ -v
```

### Issue: Cache Miss (Slow Installs)

**Cause**: Dependencies cache not working properly  
**Solution**:
```yaml
# Ensure cache key is correct
cache: 'pip'  # For Python only
cache-dependency-path: 'backend/requirements.txt'  # Be specific
```

### Issue: Secrets Not Available

**Cause**: Environment variables not passed to jobs  
**Solution**:
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
```

### Issue: Build Fails on Main, Passes Locally

**Cause**: Different environment or missing installation step  
**Solution**:
1. Check workflow uses same Node/Python versions as local
2. Run locally: `npm ci` instead of `npm install`
3. Verify all dependencies are pinned

---

## Performance Optimization

### Parallel Execution

Workflows run jobs in parallel by default:

```yaml
jobs:
  backend-tests:  # Runs simultaneously
  frontend-tests: # with other jobs
  ml-validation:
```

**Typical Full Stack Run**: 10-12 minutes

### Cache Optimization

```yaml
# Effective cache keys
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
    cache-dependency-path: frontend/package-lock.json

- uses: actions/setup-python@v4
  with:
    cache: 'pip'
```

### Conditional Job Execution

```yaml
# Skip expensive jobs for documentation changes
jobs:
  test:
    if: ${{ !contains(github.event.head_commit.message, '[skip-ci]') }}
```

---

## Secrets Management

### Required Secrets

Set these in GitHub repository Settings > Secrets > Actions:

| Secret | Purpose | Source |
|--------|---------|--------|
| GROQ_API_KEY | LLM inference | https://console.groq.com |
| OPENAI_API_KEY | Fallback LLM | https://platform.openai.com |
| CODECOV_TOKEN | Coverage upload | https://codecov.io |

### Setting Secrets

```bash
# Via GitHub CLI
gh secret set GROQ_API_KEY --body "gsk_..."
gh secret set OPENAI_API_KEY --body "sk-..."

# Via GitHub UI
Settings > Secrets and variables > Actions > New repository secret
```

### Using Secrets in Workflows

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    steps:
      - run: pytest tests/ -v
```

---

## Deployment Automation (Future)

Once stable, add deployment stages:

```yaml
deploy:
  needs: [backend-tests, frontend-tests]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  steps:
    - name: Deploy to staging
      run: |
        # Deploy backend to Render
        # Deploy frontend to Vercel
```

---

## Coverage Reporting

### Codecov Integration

Coverage reports automatically upload to Codecov:

```yaml
- uses: codecov/codecov-action@v3
  with:
    file: ./backend/coverage.xml
    flags: backend
    fail_ci_if_error: false
```

### Badge in README

Add coverage badges to project README:

```markdown
# depression-ai-system

![Backend Coverage](https://codecov.io/github/geetcode08/depression_detection/branch/main/graph/badge.svg?flag=backend)
![Frontend Coverage](https://codecov.io/github/geetcode08/depression_detection/branch/main/graph/badge.svg?flag=frontend)
```

---

## Troubleshooting Workflow Failures

### Step 1: View Logs

1. Go to GitHub Actions
2. Click on failure workflow run
3. Expand failed job and scroll to error

### Step 2: Reproduce Locally

```bash
# Backend test locally
cd backend
pip install -r requirements.txt
pytest tests/ -v

# Frontend test locally
cd frontend
npm ci
npm run lint
npm run test -- --run
npm run build
```

### Step 3: Check Environment Differences

- Python version: `python --version`
- Node version: `node --version`
- Dependencies: Check lock files are committed
- Secrets: Verify all required secrets are set

---

## Maintenance

### Regular Tasks

- **Weekly**: Review failed runs and fix issues
- **Monthly**: Update action versions
  ```bash
  # Check for updates
  actions/checkout@v4
  actions/setup-python@v4
  actions/setup-node@v4
  ```
- **Quarterly**: Review coverage trends on Codecov

### Updating Workflows

```bash
# After modifying workflows
git add .github/workflows/*.yml
git commit -m "ci: update workflow configurations"
git push origin main
```

---

## Support & Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Codecov Documentation](https://docs.codecov.io/)
- [GitHub Community](https://github.community/)

---

## Next Steps

1. **Enable Workflows**: Push changes to trigger GitHub Actions
2. **Monitor Runs**: Visit Actions tab to view execution
3. **Set Branch Protection**: Require workflow pass before merge
4. **Configure Secrets**: Add API keys in Settings > Secrets
5. **Review Coverage**: Check Codecov dashboard
6. **Fix Failures**: Debug and push fixes
7. **Proceed to Deployment**: Phase 7.5 deployment setup

