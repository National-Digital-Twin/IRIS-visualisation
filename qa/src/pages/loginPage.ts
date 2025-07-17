import { expect, Page } from '@playwright/test';
import PlaywrightWrapper from '../helper/wrapper/PlaywrightWrappers';

export default class LoginPage {
    private readonly base: PlaywrightWrapper;

    constructor(private readonly page: Page) {
        this.base = new PlaywrightWrapper(page);
    }

    // Object Locators
    private readonly Elements = {
        userInput: 'username',
        passwordInput: 'Password',
        loginBtn: "button[color='primary']",
        errorMessage: 'alert',
    };

    async navigateToLoginPage(url: string) {
        await this.base.goto(url);
        await this.base.customSleep(2000);
        await expect(this.page).toHaveTitle('Sign-in');
    }

    async enterUserName(user: string) {
        await this.page.locator('[name="username"]').fill(user);
    }

    async enterPassword(password: string) {
        await this.page.locator('[name="password"]').fill(password);
    }

    async clickLoginButton() {
        await this.page.getByRole('button', { name: 'Sign in' }).click();
    }

    getErrorMessage() {
        return this.page.getByRole('alert');
    }

    async loginUser(user: string, password: string) {
        await this.enterUserName(user);
        await this.enterPassword(password);
        await this.clickLoginButton();
    }
}
