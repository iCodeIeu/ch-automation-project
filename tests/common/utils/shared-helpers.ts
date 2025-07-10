/**
 * @file This file contains a collection of shared helper functions designed to support
 * various common operations and assertions across Playwright tests. These helpers
 * abstract repetitive UI interactions, data extraction, and validation logic
 * to improve test readability, maintainability, and reusability.
 */

import { Page, expect, Locator } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { RoomDetailsPage } from '../pages/room-details.page';
import { NavigationBarPage } from '../pages/navigation-bar.page';
import { AdminPage } from '../pages/admin.page';

/**
 * Asserts that the application successfully returns to the home page.
 * This function clicks the "Return Home" button, typically found on a
 * room details or booking confirmation page, and then verifies that
 * key elements of the home page (like its title and a primary call-to-action button)
 * are visible and enabled, confirming a successful navigation.
 *
 * @param page The Playwright `Page` object used to interact with the browser.
 */

export async function assertReturnToHomePage(page: Page): Promise<void> {
  const homePage = new HomePage(page);
  const roomDetailsPage = new RoomDetailsPage(page);

  await validateAndPerform(roomDetailsPage.returnHomeButton).click();
  await expect(homePage.pageTitle).toBeVisible();
  await expectVisibleAndEnabled(homePage.primaryBookNowButton);
}

/**
 * Extracts and returns numerical digits (integers or decimals) from the text content of a given Playwright `Locator`.
 * This helper is useful for parsing numeric values, such as prices or quantities, directly from UI elements.
 *
 * @param selector The Playwright `Locator` from which to extract the digits.
 * @returns A Promise that resolves to the extracted number. Returns `null` if no digits are found in the locator's text content.
 */

export async function getDigits(selector: Locator): Promise<number | null> {
  const text = (await selector.textContent()) ?? '';
  console.info(`Extracting digits from: "${text}"`);
  const match = text.match(/\d+(\.\d+)?/); // Matches integers or decimals
  return match ? Number(match[0]) : null;
}

/**
 * Calculates the number of nights between two date strings.
 * Assumes date strings can be parsed by Date constructor (e.g., 'YYYY-MM-DD', 'MM/DD/YYYY').
 * @param checkInDateStr The check-in date string.
 * @param checkOutDateStr The check-out date string.
 * @returns The number of nights as an integer.
 * @throws Error if dates are invalid or check-out is not after check-in.
 */
export function calculateNumberOfNights(checkInDateStr: string, checkOutDateStr: string): number {
  const checkIn = new Date(checkInDateStr);
  const checkOut = new Date(checkOutDateStr);

  // Check for invalid dates
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new Error(`Invalid date format provided. Check-in: "${checkInDateStr}", Check-out: "${checkOutDateStr}"`);
  }

  // Set times to midnight to ensure accurate day calculation, avoiding timezone issues
  checkIn.setHours(0, 0, 0, 0);
  checkOut.setHours(0, 0, 0, 0);

  // Calculate the difference in milliseconds
  const timeDiff = checkOut.getTime() - checkIn.getTime();

  // Convert milliseconds to days (1000 ms * 60 sec * 60 min * 24 hours)
  const oneDay = 1000 * 60 * 60 * 24;
  const numberOfNights = Math.round(timeDiff / oneDay); // Round to nearest whole number

  if (numberOfNights <= 0) {
    throw new Error(
      `Check-out date (${checkOutDateStr}) must be after check-in date (${checkInDateStr}). Number of nights calculated: ${numberOfNights}`
    );
  }

  return numberOfNights;
}

/**
 * Asserts that a given Playwright `Locator` is both **visible** and **enabled**.
 * This function uses `Promise.all` to concurrently check both conditions,
 * making it an efficient way to verify that a UI element is ready for interaction.
 *
 * @param locator The Playwright `Locator` to assert.
 * @returns A Promise that resolves when both assertions pass.
 */

export async function expectVisibleAndEnabled(locator: Locator): Promise<void> {
  await Promise.all([expect(locator).toBeVisible(), expect(locator).toBeEnabled()]);
}

/**
 * Creates a utility wrapper around a Playwright `Locator` to simplify common UI interactions.
 * Before performing any action (e.g., `click`, `fill`, `check`), it implicitly
 * **validates that the locator is visible and enabled**. This reduces boilerplate code
 * and makes tests more robust by ensuring elements are interactive before attempting an action.
 *
 * @param locator The Playwright `Locator` to wrap with validation and performance methods.
 * @returns An object containing methods for various UI interactions, each pre-validated
 * for visibility and enabled state.
 */

export function validateAndPerform(locator: Locator) {
  async function expectVisibleAndEnabled(loc: Locator): Promise<void> {
    await expect(loc).toBeVisible();
    await expect(loc).toBeEnabled();
  }
  return {
    async check(): Promise<void> {
      await expectVisibleAndEnabled(locator);
      await locator.check();
      await expect(locator).toBeChecked();
    },
    async uncheck(): Promise<void> {
      await expectVisibleAndEnabled(locator);
      await locator.uncheck();
      await expect(locator).not.toBeChecked();
    },
    async fill(value: string): Promise<void> {
      await expectVisibleAndEnabled(locator);
      await locator.fill(value);
      await expect(locator).toHaveValue(value);
    },
    async click(): Promise<void> {
      await expectVisibleAndEnabled(locator);
      await locator.click();
    },
    async selectOption(value: string | { label?: string; value?: string; index?: number }): Promise<void> {
      await expectVisibleAndEnabled(locator);
      await locator.selectOption(value);
      if (typeof value === 'string') {
        await expect(locator).toHaveValue(value);
      } else if (value.value) {
        await expect(locator).toHaveValue(value.value);
      }
    },
  };
}

/**
 * Common function to get all visible error messages from the page.
 * @param page The Playwright Page object.
 * @param errorMessageSelector The CSS or XPath selector that identifies all validation error messages.
 * @param timeout Max time in milliseconds to wait for error messages to appear.
 * @returns A promise that resolves to an array of trimmed error messages.
 */
export async function getAllVisibleErrorMessages(page: Page, errorMessageSelector: Locator, timeout: number = 5000): Promise<string[]> {
  // Wait for at least one error message to appear and be visible.
  // This makes the helper more robust, as errors might take a moment to render.
  try {
    await errorMessageSelector.first().waitFor({ state: 'visible', timeout });
  } catch (e) {
    // If no errors are visible within timeout, return empty array rather than throwing
    return [];
  }

  const actualErrorMessages: string[] = await errorMessageSelector.allTextContents();

  // Clean up actual messages: trim whitespace, remove empty strings
  return actualErrorMessages.map(msg => msg.trim()).filter(msg => msg.length > 0);
}

/**
 * Verifies that specific validation error messages are present on the page.
 * It handles potential whitespace and filters empty strings.
 *
 * @param page The Playwright Page object.
 * @param errorMessageSelector The CSS or XPath selector that identifies all validation error messages.
 * YOU MUST ADJUST THIS SELECTOR to match your actual HTML structure.
 * @param expectedErrors An array of strings representing the exact expected error messages.
 * @param options An object with options for assertion strictness:
 * - `shouldContainAll` (boolean): If true, asserts that the page contains all `expectedErrors` (order doesn't matter). (Default: true)
 * - `shouldContainOnly` (boolean): If true, asserts that the page contains *only* `expectedErrors` and no other error messages (strict match). (Default: false)
 * - `timeout` (number): Max time in milliseconds to wait for error messages to appear. (Default: 5000ms)
 */
export async function verifyValidationErrors(
  page: Page,
  errorMessageSelector: Locator,
  expectedErrors: string[],
  options?: { shouldContainAll?: boolean; shouldContainOnly?: boolean; timeout?: number }
): Promise<void> {
  const { shouldContainAll = true, shouldContainOnly = false, timeout = 5000 } = options || {};

  const cleanedActualErrors = await getAllVisibleErrorMessages(page, errorMessageSelector, timeout);

  // Sort both arrays for reliable comparison, as the order of messages in the DOM might vary
  const sortedExpectedErrors = [...expectedErrors].sort();
  const sortedActualErrors = [...cleanedActualErrors].sort();

  console.log('\n--- Validation Error Check ---');
  console.log('Expected:', sortedExpectedErrors);
  console.log('Actual:  ', sortedActualErrors);
  console.log('------------------------------');

  if (shouldContainAll) {
    // Assert that every expected error message is present in the actual messages found.
    for (const expectedError of sortedExpectedErrors) {
      if (!sortedActualErrors.includes(expectedError)) {
        throw new Error(`❌ Expected error message "${expectedError}" was NOT found on the page.`);
      }
    }
    console.log('✅ Assertion: All expected errors are present.');
  }

  if (shouldContainOnly) {
    // Assert that the actual messages exactly match the expected messages (implies same count and content).
    expect(sortedActualErrors).toEqual(sortedExpectedErrors);
    console.error(
      `❌ Assertion: Actual errors do not EXACTLY match expected errors.` +
        `\n  Expected: ${JSON.stringify(sortedExpectedErrors)}` +
        `\n  Actual:   ${JSON.stringify(sortedActualErrors)}`
    );
    console.log('✅ Assertion: Only expected errors are present (strict match).');
  }
}

/**
 * Provides a consolidated set of navigation actions for the application.
 * This helper initialises necessary Page Object Models and exposes methods
 * to click navigation links and assert their outcomes.
 *
 * @param page The Playwright Page object.
 * @returns An object containing various navigation helper methods.
 */

export function createNavigationActions(page: Page) {
  const homePage = new HomePage(page);
  const navigationBar = new NavigationBarPage(page);
  const adminPage = new AdminPage(page);

  return {
    /**
     * Clicks the Home link in the navigation bar and asserts the home page title.
     */
    async clickHome(): Promise<void> {
      await validateAndPerform(navigationBar.homeLink).click();
      await expect(homePage.pageTitle).toBeVisible();
    },

    /**
     * Clicks the Rooms link in the navigation bar and asserts the rooms title is.
     */
    async clickRooms(): Promise<void> {
      await validateAndPerform(navigationBar.roomsLink).click();
      await expect(homePage.roomsTitle).toBeVisible();
    },

    /**
     * Clicks the Booking link in the navigation bar and asserts the check availability button.
     */
    async clickBooking(): Promise<void> {
      await validateAndPerform(navigationBar.bookingLink).click();
      await expect(homePage.checkAvailabilityButton).toBeVisible();
    },

    /**
     * Clicks the Amenities link in the navigation bar and asserts the check availability button.
     */

    // Issue: Amenities link is currently broken, so not included in navigation test currently
    async clickAmenities(): Promise<void> {
      // Ensure navigationBar.amenitiesLink is defined in NavBarPage
      await validateAndPerform(navigationBar.amenitiesLink).click();
      await page.waitForLoadState('domcontentloaded');
    },

    /**
     * Clicks the Location link in the navigation bar and asserts the location title.
     */
    async clickLocation(): Promise<void> {
      await validateAndPerform(navigationBar.locationLink).click();
      await expect(homePage.locationTitle).toBeVisible();
    },

    /**
     * Clicks the Contact link in the navigation bar and waits for page load.
     */
    async clickContact(): Promise<void> {
      await validateAndPerform(navigationBar.contactLink).click();
      await expect(homePage.contactUsTitle).toBeVisible();
    },

    /**
     * Clicks the Admin (Login) link in the navigation bar and waits for page load.
     */
    async clickAdmin(): Promise<void> {
      await validateAndPerform(navigationBar.adminLink).click();
      await page.waitForLoadState('domcontentloaded');
      await expect(adminPage.pageTitle).toBeVisible();
    },
  };
}
