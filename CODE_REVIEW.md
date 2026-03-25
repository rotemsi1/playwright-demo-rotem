# Code Review: Playwright Demo Project

## Table of Contents
1. [Project Overview](#project-overview)
2. [Bugs Found](#bugs-found)
3. [File-by-File Analysis](#file-by-file-analysis)
4. [Cross-Cutting Concerns](#cross-cutting-concerns)
5. [Missing Best Practices](#missing-best-practices)
6. [Priority Action Items](#priority-action-items)

---

## Project Overview

The project follows a Page Object Model (POM) structure for automating the BlazeDemo travel booking site. The overall architecture is sound, but there are critical bugs and several opportunities to improve quality, maintainability, and reliability.

---

## Bugs Found

| Severity | File | Line | Issue |
|----------|------|------|-------|
| ~~**Critical**~~ ✅ | ~~`playwright.config.ts`~~ | ~~33~~ | ~~`baseURL` contains a hash/text-anchor, making it invalid for navigation~~ — **Fixed** |
| ~~**Critical**~~ ✅ | ~~`page-objects/purchasePage.ts`~~ | ~~46~~ | ~~`faker.date.past()` generates a past year for card expiration — should be `faker.date.future()`~~ — **Fixed** |
| ~~**High**~~ ✅ | ~~`page-objects/flightsPage.ts`~~ | ~~72~~ | ~~Positional selector `querySelectorAll("td")[3]` is fragile and will break if the table structure changes~~ — **Fixed** |
| **High** ⏭️ | `page-objects/basePage.ts` | 7, 17–23 | Static `testInfo` storage causes test isolation issues in parallel execution — **Skipped for now** |
| ~~**Medium**~~ ✅ | ~~`test-options.ts`~~ | ~~5~~ | ~~`setTestInfo: void` is an incorrect type — it should be `() => void` or a proper function signature~~ — **Fixed** |
| ~~**Low**~~ ✅ | ~~`page-objects/purchasePage.ts`~~ | ~~12~~ | ~~`cardType` locator is defined but never used — dead code~~ — **Fixed** |
| ~~**Low**~~ ✅ | ~~`page-objects/flightsPage.ts`~~ | ~~69~~ | ~~Magic number `1440` should be extracted into a named constant: `const MINUTES_PER_DAY = 1440`~~ — **Fixed** |
| **Low** | `page-objects/flightsPage.ts` | 69 | Grammatical error in comment: `"There 1440 minutes"` → `"There are 1440 minutes"` |
| **Low** | `tests/blaze-tests.spec.ts` | 17–42 | Using a `for` loop instead of `test.describe.each()` — works correctly, style preference only |

---

## File-by-File Analysis

### `playwright.config.ts`

- **Invalid `baseURL`** (line 33): The URL contains a hash and a text anchor (`#:~:text=...`). This is not a valid base URL and will cause navigation to fail. It should be `'https://blazedemo.com/'`.
- **No screenshot or video on failure**: Adding `screenshot: 'only-on-failure'` and `video: 'retain-on-failure'` makes debugging much easier.
- **No explicit timeouts**: Consider setting `actionTimeout`, `navigationTimeout`, and `expect.timeout` to avoid silent hangs.
- **Only two browsers tested**: Only Chromium and Mobile iPhone are configured. Adding Firefox and WebKit would improve cross-browser coverage.
- **HTML reporter commented out**: The HTML reporter provides a quick local summary. It is worth keeping alongside the Allure reporter.

**Suggested additions:**
```ts
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  actionTimeout: 10_000,
  navigationTimeout: 30_000,
},
expect: { timeout: 5_000 },
```

---

### `test-options.ts`

- **Wrong type for `setTestInfo`** (line 5): `void` is a value type, not a function type. The fixture is a function, so the type should reflect that (e.g., `() => void` or the actual Allure parameter setter signature).
- The fixture does its job but is minimal. As the suite grows, consider adding shared fixtures for authentication state, API clients, or test data setup here.

---

### `page-objects/basePage.ts`

- **Static `testInfo` is an anti-pattern** (lines 7, 17–23): Storing `testInfo` as a static class property means all parallel test workers share the same reference. This will cause race conditions and test pollution. Pass `testInfo` through the constructor or method parameters instead.
- **Allure import in a page object** (line 2): `import { test } from "allure-playwright"` couples the page object to the reporting framework. Page objects should only depend on Playwright. Move allure-specific calls to the test file or a test-layer helper.
- **Non-null assertion** (line 29): `BasePage.testInfo!.attach(...)` — even with a guard above it, the `!` signals a design smell. Eliminating the static field removes this risk entirely.
- The `verifyTitle()` method is a good start. Over time, add more shared assertion helpers here (e.g., `verifyVisible`, `verifyText`, `verifyURL`).

---

### `page-objects/homePage.ts`

- **Numeric enums are ambiguous** (lines 4–6): `Route.Departure` is `0` and `Route.Destination` is `1`. These values have no meaning to a reader. Use string enums:
  ```ts
  enum Route { DEPARTURE = "departure", DESTINATION = "destination" }
  ```
- **Non-deterministic tests are hard to debug**: Random city selection means a failure might not be reproducible. Consider a data-driven approach with predefined city pairs, or at minimum log which cities were selected in each step.
- **No validation after selection**: After calling `selectOption`, assert that the dropdown value matches the expected selection.

---

### `page-objects/flightsPage.ts`

- **Positional selector** (line 72): `querySelectorAll("td")[3]` depends on the column order in the table. If the site changes its table layout, this silently reads the wrong column. Use a named selector or add `data-testid` attributes to the application.
- **Time parsing** (lines 63–67): `time.split(" ")[0].split(":")[0]` assumes a specific format (`HH:MM AM/PM`). Extract this into a named utility function with a format check, so failures produce a clear error instead of `NaN`.
- ~~**Magic number** (line 69): Extract `1440` into `const MINUTES_PER_DAY = 1440`.~~ ✅ **Fixed**
- **No handling for empty flight list**: If the site returns no flights for the selected route, `evaluateAll` will return an empty array and the test will silently do nothing. Add an assertion that at least one flight is available.
- **Business logic in the page object**: The flight-ranking algorithm (finding cheapest/earliest) is business logic. Consider extracting it to a utility function (`utils/flightUtils.ts`) and keeping the page object focused on interactions.

---

### `page-objects/purchasePage.ts`

- **`faker.date.past()` for card expiry year** (line 46): This generates a year in the past, making the credit card data invalid. Use `faker.date.future()` to generate a future expiry year.
- ~~**`cardType` locator is unused** (line 12): Remove or implement it.~~ ✅ **Fixed** — removed dead code.
- **No assertions after `fillDetails()`**: Verify that the form was filled correctly before clicking purchase. A simple check that the first name field is not empty is better than nothing.
- **No error handling**: If `fill()` fails on one field, the test error will not indicate which field caused the problem. Consider wrapping in a try-catch with a descriptive message, or rely on step annotations.

---

### `tests/blaze-tests.spec.ts`

- **`for` loop instead of `test.describe.each()`** (lines 17–42): The `for` loop works correctly in Playwright — tests are registered synchronously at module load time. This is purely a style preference; `test.each` is the more idiomatic Playwright approach but offers no functional advantage here.
- **No assertion on purchase success** (end of test): The test clicks "Purchase Flight" and stops. There is no verification that the booking was completed. Assert on the confirmation page title or success message.
- **Clear only cookies, not all storage** (lines 6–9): Add `localStorage` and `sessionStorage` clearing to ensure a fully clean state:
  ```ts
  await page.context().clearCookies();
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  ```
- **Non-null assertions on city values** (lines 32–33): `departureCity!` and `destinationCity!` — these values could legitimately be `null` if `getAttribute` returns nothing. Add an explicit check.
- **Missing Allure annotations**: The project uses Allure reporting but tests have no `@feature`, `@story`, or severity labels. Add these for useful reports.

---

## Cross-Cutting Concerns

### Locator Strategy
- Semantic locators (`getByRole`, `getByLabel`) and ID-based locators are used well in most places.
- The main exception is the positional `querySelectorAll("td")[3]` in `flightsPage.ts`.
- Document your locator choices: if you use an ID because it's stable, say so in a comment.

### Non-Null Assertions (`!`)
Multiple files use TypeScript's `!` operator to silence null checks. Each instance is a potential runtime crash. Address the root cause (check for null, use a default, or fix the type) rather than suppressing the warning.

### Test Data
Using `faker` for test data is good for variety, but it makes failures hard to reproduce. Consider one of:
- **Seeded Faker**: `faker.seed(42)` makes runs deterministic.
- **Predefined data set**: A small `testData.ts` file with a few known-good city pairs and card details.

### Documentation
- There is no `README.md` with setup instructions or a description of the test suite.
- No JSDoc on public page object methods.
- No explanation of the project structure for new contributors.

---

## Missing Best Practices

1. **npm scripts**: `package.json` has an empty `scripts` object. Add scripts for `test`, `test:headed`, `test:ui`, `test:debug`, and report generation so contributors know how to run the suite.
2. **Environment configuration**: The base URL is hardcoded. Use an environment variable or a `.env` file (with `dotenv`) so the suite can run against different environments without code changes.
3. **CI configuration**: There is no `.github/workflows` or similar pipeline file. Adding one ensures tests run automatically on every pull request.
4. **Trace strategy**: `trace: 'on-first-retry'` is a reasonable default. Consider also enabling `screenshot: 'only-on-failure'` to get instant visual context without needing to open the full trace.

---

## Priority Action Items

### Immediate — Fix Before Next Run
1. ~~Fix `baseURL` in `playwright.config.ts` — remove the hash/anchor.~~ ✅
2. ~~Fix `faker.date.past()` → `faker.date.future()` in `purchasePage.ts`.~~ ✅
3. Add an assertion on the purchase confirmation page at the end of each test.

### Short Term
2. ~~Remove static `testInfo` from `BasePage`; pass it via constructor or method argument.~~ ⏭️ Skipped for now
3. Remove the allure import from `basePage.ts`.
4. Replace positional `querySelectorAll("td")[3]` in `flightsPage.ts` with a named selector.
5. ~~Fix the `setTestInfo: void` type in `test-options.ts`.~~ ✅
6. Add `screenshot: 'only-on-failure'` to `playwright.config.ts`.
7. Add npm scripts to `package.json`.

### Medium Term
1. Extract the flight-ranking algorithm from `flightsPage.ts` into a utility function.
2. Extract time parsing into a named utility with format validation.
3. Switch to seeded or data-driven test data to make failures reproducible.
4. Add Allure `@feature`/`@story` annotations to test cases.
5. Add storage clearing (`localStorage`, `sessionStorage`) to the `beforeEach` hook.
6. Write a `README.md` with setup and execution instructions.

### Long Term
1. Add cross-browser coverage (Firefox, WebKit).
2. Implement environment-based configuration (`.env` / env vars).
3. Set up a CI pipeline that runs tests and publishes the Allure report.
4. Add JSDoc to all public page object methods.
