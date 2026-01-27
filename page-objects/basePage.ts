import { Page, TestInfo } from "@playwright/test"

export abstract class BasePage {

    protected readonly page: Page
    private static testInfo: TestInfo | undefined

    constructor(page: Page) {
        this.page = page
    }

    static setTestInfo(testInfo: TestInfo) {
        BasePage.testInfo = testInfo
    }

    static clearTestInfo() {
        BasePage.testInfo = undefined
    }

    protected async attachScreenshot(name: string = "screenshot", fullPage = false) {
        if (!BasePage.testInfo) return
        const buffer = await this.page.screenshot({fullPage})
        await BasePage.testInfo.attach(name, {body: buffer, contentType: "image/png"})
    }

}