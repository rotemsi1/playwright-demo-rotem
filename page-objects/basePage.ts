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

    protected async attachScreenshot(name: string = "") {
        if (!BasePage.testInfo) return
        await BasePage.testInfo.attach(name, {body: await this.page.screenshot(), contentType: "image/png"})
    }

}