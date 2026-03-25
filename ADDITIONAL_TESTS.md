# Additional Test Ideas for BlazeDemo

This document is based on a direct scan of the BlazeDemo website and reflects what is actually present on each page. The goal is to go beyond the two existing happy-path tests and cover the full range of user journeys, edge cases, and UI validations the site enables.

---

## What the Current Tests Cover

- Navigating the full booking flow (Home → Flights → Purchase) twice: once selecting the cheapest flight, once the earliest.
- Verifying the page title on the home page.
- Asserting departure and destination city names appear on the flights page.
- Filling in purchase details with random Faker data.
- Ticking "Remember me" and clicking "Purchase Flight".

Everything below is **not currently tested**.

---

## 1. Home Page

### 1.1 — All departure/destination city combinations render the flights page
The departure dropdown has 7 cities (Paris, Philadelphia, Boston, Portland, San Diego, Mexico City, São Paolo) and the destination dropdown has 7 cities (Buenos Aires, Rome, London, Berlin, New York, Dublin, Cairo). The current tests pick randomly; no test explicitly verifies that every combination navigates successfully to the flights page.

```
test idea: for each departure city, submit the form and assert the flights page loads
```

### 1.2 — Same city as departure and destination
Selecting the same city for both dropdowns (e.g., Paris → Paris) currently shows flights with no error or warning. A test could assert the expected behaviour — whether that is a validation message or a results page.

### 1.3 — Default dropdown values on page load
When the page loads, the dropdowns default to "Paris" and "Buenos Aires". Verify this explicitly so any future change to defaults is caught.

### 1.4 — "Find Flights" button is present and enabled by default
Assert the button is visible and not disabled on page load, before any user interaction.

### 1.5 — "Destination of the week" link navigates to the vacation page
The home page contains a "The Beach!" link pointing to `vacation.html`. This link is never tested. Verify it navigates to the vacation page and that the page loads successfully.

---

## 2. Flights Page

### 2.1 — Page heading reflects chosen cities
The flights page heading should read something like "Flights from Paris to Buenos Aires". The current test asserts city names appear somewhere on the page, but a dedicated test for the exact heading format would be more precise.

### 2.2 — Exactly 5 flights are always displayed
The site consistently returns 5 flights regardless of route. Assert that the table always contains exactly 5 rows.

### 2.3 — All expected columns are present
Verify the table has columns: Flight #, Airline, Departs, Arrives, Price — and that none are empty for any row.

### 2.4 — Flight prices are positive numbers
Parse each price in the table and assert they are all valid positive numbers greater than zero.

### 2.5 — Departure time is before arrival time (within a single day)
For each flight, assert that the departure time value precedes the arrival time value. This catches data regressions where times are swapped or malformed.

### 2.6 — Each "Choose This Flight" button navigates to the purchase page
Click each of the 5 "Choose This Flight" buttons (in separate test runs) and verify the URL changes to the purchase page. This ensures all buttons are functional, not just the one selected by the cheapest/earliest algorithm.

### 2.7 — Selected flight details carry over to purchase page
After selecting a specific flight (e.g., flight #43, Virgin America, $472.56), assert that the airline name and flight number displayed on the purchase page match what was selected on the flights page.

### 2.8 — Navigating back from flights page returns to home page
Click the "Travel The World" or "home" navigation link from the flights page and assert the home page loads with both dropdowns intact.

---

## 3. Purchase Page

### 3.1 — Flight summary is displayed before filling the form
When arriving on the purchase page, the airline name, flight number, price, fees, and total cost are displayed. Assert all five values are present and non-empty.

### 3.2 — Total cost equals price plus taxes/fees
The page shows Price, Fees/Taxes, and Total. Assert that `Total = Price + Fees/Taxes` to catch any calculation regression.

### 3.3 — All required fields must be filled to submit
Attempt to click "Purchase Flight" with the form completely empty. Assert the form does not submit (e.g., the URL does not change, or a validation message appears).

### 3.4 — Individual required fields block submission when empty
For each required field (Name, Address, City, State, Zip Code, Credit Card Number, Month, Year, Name on Card), submit the form with only that one field left blank and assert submission is blocked.

### 3.5 — Card type dropdown contains the correct options
Assert the card type dropdown contains exactly: Visa, American Express, Diner's Club — and that Visa is the default selection.

### 3.6 — "Remember me" checkbox is unchecked by default
Assert the checkbox starts unchecked. The current test always checks it; no test verifies its default state or that it can be left unchecked.

### 3.7 — Purchase completes successfully without checking "Remember me"
Submit a valid purchase with "Remember me" left unchecked and assert the confirmation page loads. This isolates the checkbox from the happy path.

### 3.8 — Purchase with each card type
Submit the form once with Visa, once with American Express, and once with Diner's Club. Assert that each reaches the confirmation page — verifying the dropdown does not affect submission for any option.

---

## 4. Confirmation Page

### 4.1 — Confirmation page heading is correct
After a successful purchase, assert the heading reads "Thank you for your purchase today!" — the current tests do not assert anything on the confirmation page at all.

### 4.2 — Transaction ID is present and non-empty
Assert a Transaction ID is displayed in the confirmation table and is not blank.

### 4.3 — Status is shown
Assert the Status field is present (e.g., "PendingCapture"). This confirms the booking reached a processing state.

### 4.4 — Amount is a valid number
Assert the Amount field is present and contains a numeric value greater than zero.

### 4.5 — Confirmation page shows the correct card last four digits
Enter a known credit card number (e.g., 4111111111111111) and assert the confirmation page shows the last four digits ("1111"). This verifies that personal data from the form flows correctly to the confirmation.

### 4.6 — JSON block is present on confirmation page
The confirmation page includes a raw JSON block with API links (GET auth, POST capture, POST reverse). Assert this block is rendered and contains the transaction ID. This documents an existing behaviour that could silently disappear.

### 4.7 — Navigating to confirmation page directly (without completing a purchase) shows graceful state
Visit `/confirmation.php` directly without going through the booking flow. Assert either a meaningful default state is shown or that the page still loads without a JavaScript error.

---

## 5. Vacation Page

### 5.1 — Page loads and displays the destination heading
Navigate to `vacation.html` and assert a heading is visible (e.g., "Destination of the week: Hawaii!"). This page is linked from the home page but is completely untested.

### 5.2 — Navigation links on vacation page work
Assert the "Travel The World" and "home" links on the vacation page navigate back to the home page correctly.

---

## 6. Navigation & Cross-Page Behaviour

### 6.1 — Browser back button returns to the correct previous page
After navigating Home → Flights → Purchase, use `page.goBack()` to return to Flights and assert the correct page is shown. Then go back again to Home and assert the dropdowns are still present.

### 6.2 — Refreshing the purchase page mid-form does not crash
Fill in some fields on the purchase page, refresh the browser, and assert the page reloads without a server error. This tests resilience to accidental refreshes.

### 6.3 — All navigation links across all pages point to valid destinations
For each page (home, flights, purchase, confirmation, vacation), assert that all `<a>` navigation links resolve to a page that returns HTTP 200 and renders a visible heading.

---

## 7. Summary Table

| Area | Test Count | Coverage Gap |
|------|-----------|-------------|
| Home Page | 5 ideas | Default state, edge-case same city, link to vacation page |
| Flights Page | 8 ideas | Table integrity, column data, per-button navigation |
| Purchase Page | 8 ideas | Validation, each card type, checkbox default state |
| Confirmation Page | 7 ideas | No assertions exist at all today |
| Vacation Page | 2 ideas | Page is completely untested |
| Navigation | 3 ideas | Back-button behaviour, refresh resilience, link integrity |
| **Total** | **33 ideas** | |

---

## Suggested Priority Order

**Implement first** (highest value, low complexity):
1. Confirmation page heading and transaction ID assertions — these complete the existing happy-path tests.
2. Selected flight details carry over to purchase page — closes a data-integrity gap.
3. All required fields block submission — basic form validation coverage.
4. Card type dropdown options and default — directly tests an untouched UI element.

**Implement next** (medium complexity):
5. Total cost calculation assertion — arithmetic check on displayed data.
6. Exactly 5 flights always displayed — table integrity baseline.
7. All column data present and non-empty — catches silent data regressions.
8. Purchase with each card type — expands coverage of the card type dropdown.

**Implement later** (higher complexity or lower risk):
9. Same-city route behaviour — edge case, requires a decision on expected outcome.
10. All departure/destination city combinations — broad coverage, consider using `test.each`.
11. Vacation page tests — isolated page, low risk of regression.
12. Navigation and back-button tests — useful for UX regression but lower priority.
