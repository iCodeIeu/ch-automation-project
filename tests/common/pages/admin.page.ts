import { Page, Locator } from '@playwright/test';
import { validateAndPerform } from '../utils/shared-helpers';

export class AdminPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly invalidCredentialsError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { name: 'Login' });
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.invalidCredentialsError = page.locator('//*[@class="alert alert-danger"]');
  }

  /**
   * Fills the username and password fields and clicks the login button.
   * This method performs the login attempt but does not assert the outcome.
   *
   * @param username The username to input.
   * @param password The password to input.
   */
  async login(username: string, password: string): Promise<void> {
    await validateAndPerform(this.usernameInput).fill(username);
    await validateAndPerform(this.passwordInput).fill(password);
    await validateAndPerform(this.loginButton).click();
  }
}
