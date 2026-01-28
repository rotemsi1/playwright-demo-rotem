import { expect, Page, TestInfo } from "@playwright/test"
import { test } from "allure-playwright"

export abstract class BasePage {

    protected readonly page: Page
    private static testInfo: TestInfo | undefined

    constructor(page: Page) {
        this.page = page
    }

    async verifyTitle(expectedTitle: string) {
        expect(await this.page.title()).toEqual(expectedTitle)
    }

    static setTestInfo(testInfo: TestInfo) {
        BasePage.testInfo = testInfo
    }

    static clearTestInfo() {
        BasePage.testInfo = undefined
    }

    protected async attachScreenshot(name = "Screenshot") {
        if (!BasePage.testInfo) return
        await test.step(name, async () => {
            const buffer = await this.page.screenshot()
            await BasePage.testInfo!.attach(name, {body: buffer, contentType: "image/png"})
        })
    }

}