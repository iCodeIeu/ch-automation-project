import { Page, expect, Locator } from '@playwright/test';
import { getDigits, calculateNumberOfNights, validateAndPerform } from '../utils/shared-helpers';
import { SelectedRoomDetails, GuestBookingDetails } from '../utils/types';
import { CLEANING_FEE, SERVICE_FEE } from '../utils/constants';

export class RoomDetailsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly breadcrumbRoomType: Locator;
  readonly checkInDateDisplay: Locator;
  readonly checkOutDateDisplay: Locator;
  readonly displayedRoomRate: Locator;
  readonly totalPriceDisplay: Locator;
  readonly combinedRateAndNightsDisplay: Locator;
  readonly reserveNowButton: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly guestDetailsError: Locator;
  readonly bookingConfirmedTitle: Locator;
  readonly displayedBookingDates: Locator;
  readonly returnHomeButton: Locator;
  readonly similarRoomsContainer: Locator;
  readonly priceSummaryCard: Locator;
  readonly calendarBookingsCard: Locator;
  readonly selectedRoomDetailsCard: Locator;
  readonly roomPricePerNight: Locator;
  readonly footerContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { level: 1, exact: true });
    this.breadcrumbRoomType = page.locator('//*[@class="breadcrumb-item active"]');
    this.checkInDateDisplay = page.locator('#checkInDisplay');
    this.checkOutDateDisplay = page.locator('#checkOutDisplay');
    this.displayedRoomRate = page.locator('//*[@class="fs-2 fw-bold text-primary me-2"]');
    this.totalPriceDisplay = page.locator('//*[@class="d-flex justify-content-between fw-bold"]//span[2]');
    this.combinedRateAndNightsDisplay = page.locator('//*[@class="d-flex justify-content-between mb-2"]').first();
    this.reserveNowButton = page.getByRole('button', { name: 'Reserve Now', exact: true }).first();
    this.firstNameInput = page.getByRole('textbox', { name: 'Firstname' });
    this.lastNameInput = page.getByRole('textbox', { name: 'Lastname' });
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.phoneInput = page.getByRole('textbox', { name: 'Phone' });
    this.guestDetailsError = page.locator('//*[@class="alert alert-danger"]//li');
    this.bookingConfirmedTitle = page.getByRole('heading', { name: 'Booking Confirmed', exact: true });
    this.displayedBookingDates = page.locator('//*[@class="text-center pt-2"]//strong');
    this.returnHomeButton = page.getByRole('link', { name: 'Return home', exact: true });
    this.similarRoomsContainer = page.locator('//*[@class="container"]').nth(2);
    this.priceSummaryCard = page.locator('//*[@class="card bg-light border-0 mb-4"]');
    this.calendarBookingsCard = page.locator('//*[@class="rbc-month-view"]');
    this.selectedRoomDetailsCard = page.locator('//*[@class="col-lg-8 mb-4 mb-lg-0"]');
    this.roomPricePerNight = page.locator('//*[@class="fs-2 fw-bold text-primary me-2"]');
    this.footerContainer = page.locator('//*[@class="bg-dark text-white py-5"]');
  }

  /**
   * Asserts that the room details displayed on the page match the selected room
   * and that the number of nights is correctly displayed from the combined string.
   * @param expectedRoom The details of the room selected on the home page.
   * @param checkInDateStr The check-in date string (e.g., '2025-07-10').
   * @param checkOutDateStr The check-out date string (e.g., '2025-07-12').
   */
  async assertRoomDetailsAndNights(expectedRoom: SelectedRoomDetails, checkInDateStr: string, checkOutDateStr: string): Promise<void> {
    await expect(this.pageTitle).toHaveText(`${expectedRoom.type} Room`);
    await expect(this.breadcrumbRoomType).toHaveText(`${expectedRoom.type} Room`);

    const combinedText = await this.combinedRateAndNightsDisplay.textContent();
    expect(combinedText).not.toBeNull(); // Ensure text content exists

    // --- Extracting Daily Rate ---
    // getDigits will find the first number in the string "£225 x 1 nights" which is 225
    const displayedRate = await getDigits(this.combinedRateAndNightsDisplay);
    expect(displayedRate).not.toBeNull();
    expect(displayedRate).toBe(expectedRoom.price);

    // --- Extracting Number of Nights using split and direct parsing ---
    const extractedNightsPart = combinedText?.split('x')[1]; // This gives " 1 nights" (or similar, or undefined)
    // Your concise line here:
    const displayedNights = extractedNightsPart ? Number(extractedNightsPart.match(/\d+/)?.[0]) : null;

    expect(displayedNights).not.toBeNull(); // Ensure digits were found and parsed
    expect(isNaN(displayedNights!)).toBeFalsy(); // Further check for valid number

    // Calculate expected number of nights based on dates
    const expectedNights = calculateNumberOfNights(checkInDateStr, checkOutDateStr);

    // Assert the extracted number of nights matches the calculated number of nights
    expect(displayedNights).toBe(expectedNights);

    console.info(
      `Room details asserted for "${expectedRoom.type}", daily rate: ${displayedRate}, and ${displayedNights} nights confirmed.`
    );
  }

  /**
   * Calculates the expected total price including fixed fees and asserts it against the displayed total.
   * @param dailyRate The daily rate of the room (from selectedRoom, passed from HomePage).
   * @param checkInDateStr The check-in date string.
   * @param checkOutDateStr The check-out date string.
   */
  async assertTotalPriceCalculationAndProceed(dailyRate: number, checkInDateStr: string, checkOutDateStr: string): Promise<void> {
    const expectedNights = calculateNumberOfNights(checkInDateStr, checkOutDateStr);

    // Calculate base room cost
    const baseRoomCost = dailyRate * expectedNights;

    // Add fixed fees to the expected total price
    const expectedTotalPrice = baseRoomCost + CLEANING_FEE + SERVICE_FEE;

    console.log(`Expected total price: £${expectedTotalPrice}`);

    const displayedTotalPrice = await getDigits(this.totalPriceDisplay);
    expect(displayedTotalPrice).not.toBeNull();
    expect(displayedTotalPrice).toBe(expectedTotalPrice);

    console.info(`Total price calculation asserted:
      Base room cost: £${baseRoomCost}
      Cleaning fee: £${CLEANING_FEE}
      Service fee: £${SERVICE_FEE}
      Expected total: £${expectedTotalPrice}, Displayed total: £${displayedTotalPrice}.`);

    await validateAndPerform(this.reserveNowButton).click();
  }

  async fillGuestBookingDetailsAndProceed(details: Partial<GuestBookingDetails>): Promise<void> {
    await validateAndPerform(this.firstNameInput).fill(details.firstName || '');
    await validateAndPerform(this.lastNameInput).fill(details.lastName || '');
    await validateAndPerform(this.emailInput).fill(details.email || '');
    await validateAndPerform(this.phoneInput).fill(details.phone || '');
    await validateAndPerform(this.reserveNowButton).click();
  }

  async verifyBookingSuccess(details: Partial<GuestBookingDetails>): Promise<void> {
    await expect(this.bookingConfirmedTitle).toBeVisible();
    const expectedDateString = `${details.checkInDate} - ${details.checkOutDate}`;
    await expect(this.displayedBookingDates).toHaveText(expectedDateString);
    console.info(`Booking successfully verified for dates: ${expectedDateString}`);
  }
}
