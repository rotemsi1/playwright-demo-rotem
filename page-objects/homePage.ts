import { Locator, Page } from "@playwright/test"
import { BasePage } from "./basePage"

export enum Route {
  Departure, Destination
}

export class HomePage extends BasePage {

    readonly destinationOfTheWeekLink: Locator
    readonly departureCityDropdown: Locator
    readonly destinationCityDropdown: Locator
    readonly findFlightsButton: Locator

    constructor(page: Page) {
        super(page)
        this.destinationOfTheWeekLink = this.page.getByRole("link", {name: "destination of the week!"})
        this.departureCityDropdown = this.page.locator('select[name="fromPort"]')
        this.destinationCityDropdown = this.page.locator('select[name="toPort"]')
        this.findFlightsButton = this.page.getByRole("button", {name: "Find Flights"})
    }

    async clickDestinationOfTheWeek() {
        await this.destinationOfTheWeekLink.click()
    }

    async selectRandomCity(route: Route) {
        await this.attachScreenshot("Before selecting a random city")
        const cityDropdown = route === Route.Departure ? this.departureCityDropdown : this.destinationCityDropdown
        const cityOptions = cityDropdown.getByRole("option")
        const cityOptionsCount = await cityOptions.count()
        const randomIndex = Math.floor(Math.random() * cityOptionsCount)
        const selectedCityValue = await cityOptions.nth(randomIndex).getAttribute("value")
        await cityDropdown.selectOption(selectedCityValue!)
        await this.attachScreenshot("After selecting a city")
        return selectedCityValue
    }

}