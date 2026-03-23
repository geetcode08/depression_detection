# Frontend Testing Guide (Vitest)

**Last Updated**: 2026-03-23  
**Status**: ✅ Configuration Ready

---

## Overview

This guide covers the frontend testing setup using Vitest, React Testing Library, and related tools. The testing suite focuses on:

- **Component Tests**: React component rendering and interactions
- **API Client Tests**: Request/response handling, error states
- **Store Tests**: Zustand state management
- **Integration Tests**: Component-to-service interactions

---

## Setup

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- Project dependencies installed

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install testing dependencies
npm install

# Verify installation
npm run test -- --version
```

### Directory Structure

```
frontend/
├── vitest.config.ts          ← Vitest configuration
├── tests/
│   ├── setup.ts              ← Test environment setup
│   ├── navbar.test.tsx       ← Navbar component tests
│   ├── api.test.ts           ← API client tests
│   ├── store.test.ts         ← Zustand store tests
│   └── components/           ← (Additional tests as needed)
├── src/
│   ├── components/
│   ├── pages/
│   ├── store/
│   └── lib/
└── package.json
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode (auto-rerun on file changes)
npm run test -- --watch

# Run tests with UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test -- navbar.test.tsx

# Run tests matching pattern
npm run test -- --grep "Navbar"
```

### Watch Mode

```bash
# Watch mode is useful during development
npm run test -- --watch

# Run in watch mode with coverage
npm run test -- --watch --coverage
```

### CI/CD Mode

```bash
# Run once (suitable for CI pipelines)
npm run test -- --run

# Generate coverage and exit
npm run test:coverage

# With coverage threshold
npm run test -- --coverage --coverage.lines 80
```

---

## Test Files

### 1. Component Tests: `navbar.test.tsx`

**Purpose**: Test the Navbar component rendering and interactions

**Coverage**:
- ✅ Navigation links display
- ✅ Auth state rendering
- ✅ Guest mode option
- ✅ Account deletion button
- ✅ Logout functionality
- ✅ Responsive menu

**Running**:
```bash
npm run test -- navbar.test.tsx
```

**Example**:
```typescript
it('renders navigation links for authenticated user', () => {
  render(<Navbar />);
  expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
});
```

### 2. API Client Tests: `api.test.ts`

**Purpose**: Test API client configuration and request handling

**Coverage**:
- ✅ Base URL setup
- ✅ JWT token attachment
- ✅ Error handling
- ✅ Environment variable usage

**Running**:
```bash
npm run test -- api.test.ts
```

**Example**:
```typescript
it('attaches JWT token to requests', () => {
  localStorage.setItem('access_token', 'mock-token-123');
  const token = localStorage.getItem('access_token');
  expect(token).toBe('mock-token-123');
});
```

### 3. Store Tests: `store.test.ts`

**Purpose**: Test Zustand store state management

**Coverage**:
- ✅ Initial state
- ✅ Auth state updates
- ✅ Guest mode state
- ✅ Token management
- ✅ User data storage

**Running**:
```bash
npm run test -- store.test.ts
```

**Example**:
```typescript
it('stores and retrieves access token', () => {
  const token = 'eyJhbGc...';
  localStorage.setItem('access_token', token);
  expect(localStorage.getItem('access_token')).toBe(token);
});
```

---

## Code Coverage

### Generating Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html

# View coverage with specific thresholds
npm run test -- --coverage --coverage.lines 80 --coverage.functions 80
```

### Coverage Report Files

- `coverage/index.html` - Interactive HTML report
- `coverage/coverage-final.json` - Machine-readable JSON
- `coverage/lcov.info` - LCOV format for CI integration

### Current Coverage Targets

| Metric | Target | Status |
|--------|--------|--------|
| Lines | 75%+ | ⏳ To be measured |
| Functions | 75%+ | ⏳ To be measured |
| Branches | 70%+ | ⏳ To be measured |
| Statements | 75%+ | ⏳ To be measured |

### Improving Coverage

1. **Identify uncovered lines**: Run `npm run test:coverage` and review HTML report
2. **Add missing tests**: Create tests for uncovered components
3. **Verify assertions**: Ensure tests actually validate behavior

---

## Writing Tests

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Component Name', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    // (handled automatically by setup.ts)
  });

  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const { user } = render(<Component />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });
});
```

### Common Testing Patterns

#### Testing Component Rendering

```typescript
it('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

#### Testing User Interactions

```typescript
it('handles click events', async () => {
  const mockHandler = vi.fn();
  render(<Button onClick={mockHandler}>Click me</Button>);

  await userEvent.click(screen.getByRole('button'));
  expect(mockHandler).toHaveBeenCalled();
});
```

#### Testing API Calls

```typescript
it('fetches data on mount', async () => {
  const { get } = require('@/lib/api');
  get.mockResolvedValue({ data: { items: [] } });

  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

#### Testing Store Updates

```typescript
it('updates store on action', () => {
  const { useStore } = require('@/store/myStore');
  const store = useStore();

  act(() => {
    store.updateValue('new value');
  });

  expect(store.value).toBe('new value');
});
```

### Testing Libraries & Utilities

| Library | Purpose | Usage |
|---------|---------|-------|
| vitest | Test runner | `npm run test` |
| React Testing Library | Component testing | `render()`, `screen`, `userEvent` |
| @testing-library/user-event | User interactions | `userEvent.click()`, `userEvent.type()` |
| @testing-library/jest-dom | DOM matchers | `.toBeInTheDocument()`, `.toBeVisible()` |

---

## Mocking

### Mocking Modules

```typescript
vi.mock('@/store/userStore', () => ({
  useUserStore: vi.fn(() => ({
    user: { id: '1', email: 'test@test.com' },
    logout: vi.fn(),
  })),
}));
```

### Mocking API Calls

```typescript
vi.mock('axios', () => ({
  create: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
  })),
}));
```

### Mocking Next.js Router

```typescript
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    pathname: '/',
  })),
  usePathname: vi.fn(),
}));
```

---

## Best Practices

### ✅ Do

- Write tests focused on user behavior, not implementation
- Test component interactions and state changes
- Use semantic queries: `getByRole()`, `getByLabelText()`
- Mock external dependencies (API, router, store)
- Keep test files close to component files
- Use descriptive test names
- Test happy path and error cases

### ❌ Don't

- Test implementation details (internal state)
- Use `getByTestId()` excessively
- Test third-party libraries
- Create interdependent tests
- Use global state setup for all tests
- Skip error case testing

---

## Debugging Tests

### Running Tests with Debugging

```bash
# Run with debug output
npm run test -- --reporter=verbose

# Run in debug mode with inspector
node --inspect-brk ./node_modules/.bin/vitest --run

# Interactive debugging in browser (Vitest UI)
npm run test:ui
```

### Common Issues

#### Tests Timeout

```typescript
// Increase timeout for specific test
it('performs long operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

#### Components Not Rendering

```typescript
// Ensure mocks are set up before rendering
beforeEach(() => {
  useStore.mockReturnValue(expectedState);
});

it('renders with store state', () => {
  render(<Component />);
  // Component should now have mocked state
});
```

#### Async Issues

```typescript
// Use waitFor for async operations
it('waits for async operation', async () => {
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Run tests
        run: cd frontend && npm run test -- --run
      
      - name: Generate coverage
        run: cd frontend && npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
```

---

## Performance Tips

```bash
# Run tests in parallel (default)
npm run test

# Run tests serially (useful for debugging)
npm run test -- --threads=false

# Run only changed tests
npm run test -- --changed

# Run with specific configuration
npm run test -- --config=vitest.config.ts
```

---

## Next Steps

1. **Install Dependencies**: Run `npm install` in frontend directory
2. **Run Tests**: Execute `npm run test` to run the test suite
3. **View Coverage**: Run `npm run test:coverage` and open `coverage/index.html`
4. **Add More Tests**: Create tests for critical components as needed
5. **Configure CI/CD**: Add test step to GitHub Actions workflow

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Zustand Testing](https://github.com/pmndrs/zustand#testing)

---

## Support

For test-related issues:
1. Check Vitest logs: `npm run test -- --reporter=verbose`
2. Review test setup in `tests/setup.ts`
3. Check mock configurations in individual test files
4. Consult documentation links above

