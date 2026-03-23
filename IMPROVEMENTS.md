# Playwright UI Testing — Improvements & Best Practices

This document outlines recommended improvements to the project based on Playwright best practices. Unlike the code review, this is not about fixing bugs — it is about raising the overall quality, reliability, and maintainability of the test suite.

---

## Table of Contents
1. [Test Reliability](#1-test-reliability)
2. [Assertions](#2-assertions)
3. [Test Data Strategy](#3-test-data-strategy)
4. [Reporting & Observability](#4-reporting--observability)
5. [Configuration](#5-configuration)
6. [Project Structure & Architecture](#6-project-structure--architecture)
7. [Developer Experience](#7-developer-experience)
8. [CI/CD Integration](#8-cicd-integration)
9. [Documentation](#9-documentation)

---

## 1. Test Reliability

### Use Playwright's built-in auto-waiting instead of manual waits
Playwright automatically waits for elements to be actionable before interacting with them. Avoid `waitForTimeout()` or manual sleeps — they make tests slow and fragile. If a page needs explicit waiting, use `waitForURL()`, `waitForLoadState()`, or `expect(locator).toBeVisible()`.

### Ensure full test isolation
Each test should start from a clean, independent state. Currently only cookies are cleared in `beforeEach`. Add `localStorage` and `sessionStorage` clearing to prevent state leaking between tests:
```ts
await page.context().clearCookies();
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});
```

### Avoid static shared state between tests
Static class properties (like the current `BasePage.testInfo`) are shared across all parallel workers. This causes race conditions and intermittent failures that are very hard to debug. Pass dependencies via constructors or method parameters instead.

### Use `test.describe` and tags for better organization and selective runs
Group related tests under `test.describe` blocks and tag them (e.g., `@smoke`, `@regression`) so specific subsets can be run in isolation:
```ts
test('book cheapest flight @smoke', async ({ page }) => { ... });
```
Run with: `npx playwright test --grep @smoke`

---

## 2. Assertions

### Always assert the final outcome of each test
A test that performs actions but never asserts a result provides no value — it will pass even if the feature is broken. After purchasing a flight, assert the confirmation page:
```ts
await expect(page).toHaveTitle(/confirmation/i);
await expect(page.getByRole('heading')).toContainText('Thank you');
```

### Use `expect` with soft assertions for multi-field validation
When validating a form or multiple UI elements, use `expect.soft()` so all failures are reported in one run rather than stopping at the first:
```ts
await expect.soft(page.getByLabel('First Name')).toHaveValue('John');
await expect.soft(page.getByLabel('Last Name')).toHaveValue('Doe');
```

### Assert after every significant interaction
Don't assume an action succeeded. After selecting a city, assert the dropdown reflects the selection. After filling a form, assert at least one key field before submitting.

---

## 3. Test Data Strategy

### Seed Faker for reproducible failures
Random test data makes failures hard to reproduce. Use `faker.seed()` with a fixed value (or a value derived from the test name) so the same data is generated on every run:
```ts
faker.seed(12345);
```

### Use a `testData.ts` file for fixed, known-good values
For critical paths like the booking flow, define a small set of predefined test data alongside random data. This guarantees at least one reproducible scenario and makes it easier to isolate environment issues from data issues.

### Log dynamic test data in reports
When using random data, log the generated values as Allure parameters or test steps so a failing test report shows exactly what data was used:
```ts
await test.step(`Filling card number: ${cardNumber}`, async () => { ... });
```

---

## 4. Reporting & Observability

### Add Allure step annotations to page objects
Allure step decorators (`@step`) make reports far more readable by showing the sequence of actions inside each test. Wrap key page object methods:
```ts
import { step } from 'allure-js-commons';

async selectFlight() {
  await test.step('Select cheapest flight', async () => {
    // ...
  });
}
```

### Add Allure labels to every test
Tests without `@feature`, `@story`, and `@severity` labels produce flat, hard-to-navigate Allure reports. Label every test:
```ts
import { allure } from 'allure-playwright';

test('book cheapest flight', async ({ page }) => {
  allure.feature('Flight Booking');
  allure.story('Cheapest Flight');
  allure.severity('critical');
  // ...
});
```

### Enable failure artifacts in Playwright config
Screenshots and videos on failure are the fastest way to understand what went wrong without needing to re-run:
```ts
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
}
```

### Enable the HTML reporter alongside Allure
The built-in HTML reporter provides instant local feedback without needing to generate and serve an Allure report. Both can run simultaneously:
```ts
reporter: [['html', { open: 'never' }], ['allure-playwright']],
```

---

## 5. Configuration

### Set explicit timeouts
Without explicit timeouts, tests can hang silently for Playwright's default duration (30 seconds per action). Set intentional values to catch slow pages early:
```ts
use: {
  actionTimeout: 10_000,
  navigationTimeout: 30_000,
},
expect: { timeout: 5_000 },
```

### Use environment variables for the base URL
The base URL should not be hardcoded. Use an environment variable so the same tests can run against development, staging, and production without code changes:
```ts
// playwright.config.ts
baseURL: process.env.BASE_URL ?? 'https://blazedemo.com/',
```
```bash
BASE_URL=https://staging.blazedemo.com npx playwright test
```

### Expand browser coverage
Currently only Chromium and Mobile iPhone are tested. Adding Firefox and WebKit catches browser-specific rendering and interaction bugs that Chromium alone will miss. At minimum, add WebKit:
```ts
{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
```

### Separate projects for smoke vs. full regression
Use Playwright's `projects` feature to define a fast smoke suite (a subset of critical tests) and a full regression suite. This speeds up CI feedback loops:
```ts
{ name: 'smoke', grep: /@smoke/, use: { ...devices['Desktop Chrome'] } },
{ name: 'regression', use: { ...devices['Desktop Chrome'] } },
```

---

## 6. Project Structure & Architecture

### Keep page objects free of reporting concerns
Page objects should only interact with the UI. Importing `allure-playwright` inside `basePage.ts` couples domain logic to the reporting layer. Move all Allure calls to test files or a dedicated test helper.

### Extract business logic into utilities
The flight-ranking algorithm (finding cheapest/earliest) and time-parsing logic are business logic, not UI interaction. Extract them into `utils/flightUtils.ts` so they can be tested in isolation with unit tests and the page object stays focused on UI actions.

### Use `data-testid` attributes for stability-critical selectors
For elements where a semantic locator is ambiguous or unavailable, ask the development team to add `data-testid` attributes. These are stable across refactoring and make intent explicit:
```html
<td data-testid="flight-price">$200</td>
```
```ts
page.getByTestId('flight-price')
```

### Use string enums instead of numeric enums
Numeric enums (`Route.Departure = 0`) are meaningless in logs, reports, and error messages. String enums are self-documenting:
```ts
enum Route {
  DEPARTURE = "departure",
  DESTINATION = "destination",
}
```

---

## 7. Developer Experience

### Add npm scripts to `package.json`
An empty `scripts` object forces developers to remember CLI flags. Add standard commands:
```json
"scripts": {
  "test": "npx playwright test",
  "test:headed": "npx playwright test --headed",
  "test:ui": "npx playwright test --ui",
  "test:debug": "npx playwright test --debug",
  "test:smoke": "npx playwright test --grep @smoke",
  "report": "npx allure generate allure-results --clean && npx allure open"
}
```

### Add a `.env.example` file
Document the environment variables the project expects so new contributors can get set up quickly:
```
BASE_URL=https://blazedemo.com/
```

### Use `test.use()` for shared configuration instead of beforeEach
For settings that apply to a whole describe block (like viewport or locale), `test.use()` is cleaner and more declarative than `beforeEach`.

---

## 8. CI/CD Integration

### Add a GitHub Actions workflow
Tests should run automatically on every pull request to catch regressions before merging. A minimal workflow:
```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Publish the Allure report as a CI artifact
After each run, publish the Allure report so failures can be investigated without needing to re-run locally. Most CI platforms support artifact uploads.

### Run smoke tests on every push, full regression on schedule
Fast feedback on PRs comes from running a small smoke suite. Reserve the full regression suite for nightly or pre-release runs to keep PR pipelines fast.

---

## 9. Documentation

### Create a `README.md`
New contributors should be able to clone the repo and run the tests without asking anyone. A `README.md` should cover:
- Project purpose and what is being tested
- Prerequisites (Node.js version, browsers)
- Installation steps (`npm install`, `npx playwright install`)
- How to run tests (headed, headless, specific file, debug mode)
- How to view reports
- Project structure overview

### Add JSDoc to public page object methods
Document what each method does, what parameters it accepts, and what it returns. This is especially valuable for methods with non-obvious logic like `selectFlightByParameter`:
```ts
/**
 * Selects a flight from the results table based on the given strategy.
 * @param strategy - 'cheapest' selects the lowest price; 'earliest' selects the earliest departure.
 */
async selectFlightByParameter(strategy: 'cheapest' | 'earliest'): Promise<void>
```

### Document locator choices in comments
When a locator is chosen for a specific reason (e.g., using an ID because it is the only stable attribute, or avoiding a CSS selector because the class names are auto-generated), leave a brief comment. This prevents future developers from "improving" a deliberate choice and breaking stability.
