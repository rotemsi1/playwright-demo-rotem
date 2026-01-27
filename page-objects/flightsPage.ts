import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./basePage";

export enum FlightParameter {
    Cheapest, Earliest
}

export class FlightsPage extends BasePage {

    readonly title: Locator
    readonly departsTableHead: Locator
    readonly arrivesTableHead: Locator
    readonly table: Locator

    constructor(page: Page) {
        super(page)
        this.title = this.page.getByRole("heading")
        this.departsTableHead = this.page.getByRole("columnheader").filter({ hasText: "Departs:" })
        this.arrivesTableHead = this.page.getByRole("columnheader").filter({ hasText: "Arrives:" })
        this.table = this.page.getByRole("table")
    }

    async assertDepartureAndDestinationCities(departureCity: string, destinationCity: string) {
        await expect(this.title).toContainText(departureCity)
        await expect(this.title).toContainText(destinationCity)
        await expect(this.departsTableHead).toContainText(departureCity)
        await expect(this.arrivesTableHead).toContainText(destinationCity)
    }

    async selectFlightByParameter(parameter: FlightParameter) {
        await this.attachScreenshot()
        const rows = this.table.locator('tbody tr')
        if (parameter === FlightParameter.Cheapest) {
            // Find the index of the row which contains the cheapest flight
            const cheapestPriceIndex = await rows.evaluateAll(tableRows => {
                let minPrice = Infinity
                let minIndex = -1
                tableRows.forEach((tableRow, i) => {
                    const priceInput = tableRow.querySelector('input[name="price"]') as HTMLInputElement
                    const price = Number(priceInput.value)
                    if (price < minPrice) {
                        minPrice = price
                        minIndex = i
                    }
                })
                return minIndex
            })
            // Click on the "Choose this flight" button in the that row
            await rows.nth(cheapestPriceIndex).getByRole("button", { name: "Choose This Flight" }).click()
        }
        // Choose the earliest flight
        else {
            const earliestFlightIndex = await rows.evaluateAll(tableRows => {

                // Inner callback function that converts flight times to minutes after midnight
                const convertToMinutes = (time: string): number => {
                    const hours = Number(time.split(" ")[0].split(":")[0])
                    const minutes = Number(time.split(" ")[0].split(":")[1])
                    return hours * 60 + minutes
                }

                let minTime = 1440 // There 1440 minutes in a day
                let minIndex = -1
                tableRows.forEach((tableRow, i) => {
                    const departureTime = tableRow.querySelectorAll("td")[3].textContent
                    const departureTimeInMinutes = convertToMinutes(departureTime)
                    if (departureTimeInMinutes < minTime) {
                        minTime = departureTimeInMinutes
                        minIndex = i
                    }
                })
                return minIndex
            })
            // Click on the "Choose this flight" button in the that row
            await rows.nth(earliestFlightIndex).getByRole("button", { name: "Choose This Flight" }).click()
        }
        await this.attachScreenshot("Selected flight")
    }

}