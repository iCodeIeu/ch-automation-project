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
