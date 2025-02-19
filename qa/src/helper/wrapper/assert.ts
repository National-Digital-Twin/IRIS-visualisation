import { expect, Page } from '@playwright/test';

export default class Assert {
  // eslint-disable-next-line no-useless-constructor,no-empty-function
  constructor(private readonly page: Page) { }

  async assertTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  async assertTitleContains(title: string) {
    const pageTitle = await this.page.title();
    expect(pageTitle).toContain(title);
  }

  async assertURL(url: string) {
    await expect(this.page).toHaveURL(url);
  }

  async assertURLContains(title: string) {
    const pageURL = this.page.url();
    expect(pageURL).toContain(title);
  }
}
