import { test } from "../test-options"
import { HomePage, Route } from "../page-objects/homePage"
import { FlightParameter, FlightsPage } from "../page-objects/flightsPage"
import { PurchasePage } from "../page-objects/purchasePage"

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies()
  await page.goto("/")
})

const flightPreferences = [
  { testName: "Select earliest flight", param: FlightParameter.Earliest },
  { testName: "Select cheapest flight", param: FlightParameter.Cheapest }
]

// Data-driven tests, according to the flightPreferences enum
for (const flightPreference of flightPreferences) {
  test(flightPreference.testName, async ({ page }) => {

    // HOME PAGE
    const homePage = new HomePage(page)
    await homePage.verifyTitle("BlazeDemo")
    // Select a random departure city
    const departureCity = await homePage.selectRandomCity(Route.Departure)
    // Select a random destination city
    const destinationCity = await homePage.selectRandomCity(Route.Destination)
    // Click on the "Find Flights" button
    await homePage.findFlightsButton.click()

    // FLIGHTS PAGE
    const flightsPage = new FlightsPage(page)
    await flightsPage.assertDepartureAndDestinationCities(departureCity!, destinationCity!)
    await flightsPage.selectFlightByParameter(flightPreference.param)

    // PURCHASE PAGE
    const purchasePage = new PurchasePage(page)
    await purchasePage.fillDetails()
    await purchasePage.checkRememberMe()
    await purchasePage.clickPurchaseFlight()
  })
  
}