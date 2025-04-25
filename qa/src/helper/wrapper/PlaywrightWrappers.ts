import { Page } from '@playwright/test';

export default class PlaywrightWrapper {
    // eslint-disable-next-line no-useless-constructor,no-empty-function
    constructor(private readonly page: Page) {}

    async goto(url: string) {
        await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
        });
    }

    // Custom sleep function
    async customSleep(ms: number): Promise<void> {
        return new Promise((resolve) => { setTimeout(resolve, ms); });
    }

    async waitAndClick(locator: string) {
        const element = this.page.locator(locator);
        await element.waitFor({
            state: 'visible',
        });
        await element.click();
    }

    async navigateTo(link: string) {
        await Promise.all([this.page.waitForLoadState('domcontentloaded'), this.page.click(link)]);
    }
}
