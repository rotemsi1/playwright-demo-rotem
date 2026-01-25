import { test as base, type TestInfo } from "@playwright/test"
import { BasePage } from "./page-objects/basePage"

export type TestOptions = {
    setTestInfo: void
}

export const test = base.extend<TestOptions>({
    setTestInfo: [
        async ({}, use, testInfo: TestInfo) => {
            BasePage.setTestInfo(testInfo)
            await use()
            BasePage.clearTestInfo()
        },
        {auto: true, scope: "test"}
    ]
})
