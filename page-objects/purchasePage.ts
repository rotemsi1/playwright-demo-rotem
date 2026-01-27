import { Locator, Page } from "@playwright/test"
import {faker} from "@faker-js/faker"
import { BasePage } from "./basePage"

export class PurchasePage extends BasePage {

    readonly name: Locator
    readonly address: Locator
    readonly city: Locator
    readonly state: Locator
    readonly zipCode: Locator
    readonly cardType: Locator
    readonly creditCardNumber: Locator
    readonly month: Locator
    readonly year: Locator
    readonly nameOnCard: Locator
    readonly rememberMe: Locator
    readonly purchaseFlightButton: Locator

    constructor(page: Page) {
        super(page)
        this.name = this.page.locator("#inputName")
        this.address = this.page.locator("#address")
        this.city = this.page.locator("#city")
        this.state = this.page.locator("#state")
        this.zipCode = this.page.locator("#zipCode")
        this.cardType = this.page.locator("#cardType")
        this.creditCardNumber = this.page.locator("#creditCardNumber")
        this.month = this.page.locator("#creditCardMonth")
        this.year = this.page.locator("#creditCardYear")
        this.nameOnCard = this.page.locator("#nameOnCard")
        this.rememberMe = this.page.locator("#rememberMe")
        this.purchaseFlightButton = this.page.getByRole("button", {name: "Purchase Flight"})
    }

    async fillDetails() {
        await this.attachScreenshot("Before filling the details")
        const fullName = `${faker.person.firstName()} ${faker.person.lastName()}`
        await this.name.fill(fullName)
        await this.address.fill(faker.location.streetAddress({useFullAddress: true}))
        await this.city.fill(faker.location.city())
        await this.state.fill(faker.location.state({abbreviated: true}))
        await this.zipCode.fill(faker.location.zipCode())
        await this.creditCardNumber.fill(faker.finance.creditCardNumber())
        await this.month.fill(faker.date.month({abbreviated: true}))
        await this.year.fill(faker.date.past({years: 100}).getFullYear().toString())
        await this.nameOnCard.fill(fullName)
        await this.attachScreenshot("After filling the details")
    }

    async checkRememberMe() {
        await this.rememberMe.click()
    }

    async clickPurchaseFlight() {
        await this.purchaseFlightButton.click()
    }

}