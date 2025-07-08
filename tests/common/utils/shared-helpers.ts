import { Page, expect, Locator } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { RoomDetailsPage } from '../pages/room-details.page';

export async function assertReturnToHomePage(page: Page): Promise<void> {
  const homePage = new HomePage(page);
  const roomDetailsPage = new RoomDetailsPage(page);

  await validateAndPerform(roomDetailsPage.returnHomeButton).click();
  await expect(homePage.pageTitle).toBeVisible();
  await expectVisibleAndEnabled(homePage.primaryBookNowButton);
}

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

export async function expectVisibleAndEnabled(locator: Locator): Promise<void> {
  await Promise.all([expect(locator).toBeVisible(), expect(locator).toBeEnabled()]);
}

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
