import { Page, expect, Locator } from '@playwright/test';
import { expectVisibleAndEnabled, validateAndPerform, getDigits } from '../utils/shared-helpers';
import { SelectedRoomDetails, RoomOptionInternalDetails, EnquiryDetails } from '../utils/types';
import { faker } from '@faker-js/faker';

export class HomePage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly primaryBookNowButton: Locator;
  readonly checkInDateInput: Locator;
  readonly checkOutDateInput: Locator;
  readonly datePickerModal: Locator;
  readonly checkInDateToSelect: Locator;
  readonly checkOutDateToSelect: Locator;
  readonly nextMonthButton: Locator;
  readonly checkAvailabilityButton: Locator;
  readonly locationTitle: Locator;
  readonly roomsTitle: Locator;
  readonly contactUsTitle: Locator;
  readonly roomCard: Locator;
  readonly roomCardTitle: Locator;
  readonly roomCardRate: Locator;
  readonly roomCardBookButton: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly subjectInput: Locator;
  readonly messageInput: Locator;
  readonly submitEnquiryButton: Locator;
  readonly enquiryDetailsError: Locator;
  readonly successfulEnquirySubmisionMessage: Locator;
  readonly successfulEnquiruSubmissionSubject: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { name: 'Welcome to Shady Meadows B&B', exact: true });
    this.primaryBookNowButton = page.getByRole('link', { name: 'Book Now', exact: true }).first();
    this.checkInDateInput = page
      .locator('div')
      .filter({ hasText: /^Check In$/ })
      .getByRole('textbox');
    this.checkOutDateInput = page
      .locator('div')
      .filter({ hasText: /^Check Out$/ })
      .getByRole('textbox');
    this.datePickerModal = page.locator('//*[@class="react-datepicker"]');
    this.checkInDateToSelect = page.getByRole('button', { name: '' });
    this.checkOutDateToSelect = page.getByRole('button', { name: '' });
    this.nextMonthButton = page.getByRole('button', { name: 'Next Month' });
    this.checkAvailabilityButton = page.getByRole('button', { name: 'Check Availability', exact: true });
    this.locationTitle = page.getByRole('heading', { name: 'Our Location' });
    this.roomsTitle = page.getByRole('heading', { name: 'Our Rooms' });
    this.contactUsTitle = page.getByRole('heading', { name: 'Send Us a Message' });
    this.roomCard = page.locator('//*[@class="card h-100 shadow-sm room-card"]');
    this.roomCardTitle = this.roomCard.getByRole('heading', { level: 5 });
    this.roomCardRate = this.roomCard.locator('//*[@class="fw-bold fs-5"]');
    this.roomCardBookButton = this.roomCard.locator('//*[@class="btn btn-primary"]');
    this.nameInput = page.getByTestId('ContactName');
    this.emailInput = page.getByTestId('ContactEmail');
    this.phoneInput = page.getByTestId('ContactPhone');
    this.subjectInput = page.getByTestId('ContactSubject');
    this.messageInput = page.getByTestId('ContactDescription');
    this.submitEnquiryButton = page.getByRole('button', { name: 'Submit' });
    this.enquiryDetailsError = page.locator('//*[@class="alert alert-danger"]//p');
    this.successfulEnquirySubmisionMessage = page.locator('//*[@class="h4 mb-4"]').nth(1);
    this.successfulEnquiruSubmissionSubject = this.successfulEnquirySubmisionMessage.locator('xpath=./following-sibling::p[2]');
  }

  async goToHomePage() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    await Promise.all([await expect(this.pageTitle).toBeVisible(), await expectVisibleAndEnabled(this.primaryBookNowButton)]);
  }

  /**
   * Formats a date string into a more readable format for a date picker.
   *
   * This function takes a date string in 'YYYY-MM-DD' format and converts it into
   * a human-readable string like "Weekday, Day MonthName" (e.g., "Monday, 7 July").
   * It uses `Date.UTC` to prevent timezone issues from affecting the day, especially
   * during the calculation of the weekday.
   *
   * @param dateString The date string to format, in 'YYYY-MM-DD' format.
   * @returns The formatted date string (e.g., "Monday, 7 July").
   */

  private formatDateForDatePicker(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    // Use Date.UTC to prevent timezone issues shifting the day, especially for 'weekday' calculation
    const date = new Date(Date.UTC(year, month - 1, day)); // Month is 0-indexed in JS Date (July = 6)

    const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }); // e.g., "Monday"
    const dayOfMonth = date.getUTCDate(); // e.g., 7
    const monthName = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }); // e.g., "July"

    return `${weekday}, ${dayOfMonth} ${monthName}`;
  }

  /**
   * Helper method to click a date in the date picker.
   * If the date is not visible, it clicks the 'Next Month' button once and retries.
   *
   * @param dateLocator The Playwright Locator for the specific date 'option' to click.
   * @param dateDescription A descriptive string for logging (e.g., "Check-in Date: 2025-07-15").
   */
  private async selectDateInDatePicker(dateLocator: Locator, dateDescription: string): Promise<void> {
    if (await dateLocator.isVisible()) {
      await validateAndPerform(dateLocator).click();
      console.log(`Successfully selected ${dateDescription}.`);
      return;
    }

    console.warn(`${dateDescription} not visible in current month. Clicking next month arrow.`);
    await validateAndPerform(this.nextMonthButton).click();
    await this.datePickerModal.waitFor({ state: 'visible' });

    if (await dateLocator.isVisible()) {
      await validateAndPerform(dateLocator).click();
      console.log(`Successfully selected ${dateDescription} after navigating to next month.`);
      return;
    } else {
      throw new Error(`Failed to select ${dateDescription}. It was not found in the current or next month view.`);
    }
  }

  /**
   * Enters the check-in and check-out dates into the date picker and submits the form.
   *
   * This asynchronous function automates the process of selecting check-in and check-out dates
   * within a date picker component and then clicking the "Check Availability" button.
   * It formats the provided date strings for display in the date picker,
   * interacts with the UI elements to select the dates, and includes
   * waits to ensure the date picker modal is visible and hidden at appropriate times.
   *
   * @param page The Playwright `Page` object to interact with the browser.
   * @param checkInDate The desired check-in date in 'YYYY-MM-DD' format.
   * @param checkOutDate The desired check-out date in 'YYYY-MM-DD' format.
   */

  async enterCheckInCheckOutDatesAndSubmit(page, checkInDate: string, checkOutDate: string): Promise<void> {
    const formattedCheckInDate = this.formatDateForDatePicker(checkInDate);
    const formattedCheckOutDate = this.formatDateForDatePicker(checkOutDate);

    const checkInDateToSelect = this.page.getByRole('option', { name: `Choose ${formattedCheckInDate}` });
    const checkOutDateToSelect = this.page.getByRole('option', { name: `Choose ${formattedCheckOutDate}` });

    await validateAndPerform(this.checkInDateInput).click();
    await this.datePickerModal.waitFor({ state: 'visible' });
    await this.selectDateInDatePicker(checkInDateToSelect, `Check-in Date: ${checkInDate}`);
    await this.datePickerModal.waitFor({ state: 'hidden' });
    await validateAndPerform(this.checkOutDateInput).click();
    await this.datePickerModal.waitFor({ state: 'visible' });
    await this.selectDateInDatePicker(checkOutDateToSelect, `Check-out Date: ${checkOutDate}`);
    await this.datePickerModal.waitFor({ state: 'hidden' });
    await validateAndPerform(this.checkAvailabilityButton).click();
  }

  /**
   * Retrieves the numerical room rate value from a specific room card.
   *
   * This asynchronous function locates a room rate element by its index,
   * asserts its visibility, and then extracts and returns only the digit
   * characters from its text content. This is useful for obtaining the
   * monetary value without currency symbols or other text.
   *
   * @param index The zero-based index of the room card's rate to retrieve.
   * @returns A Promise that resolves to the numerical room rate, or `null` if no digits are found.
   */

  async getRoomRateValue(index: number): Promise<number | null> {
    const roomRate = this.roomCardRate.nth(index);
    await expect(roomRate).toBeVisible();
    return await getDigits(roomRate);
  }

  /**
   * Retrieves the Playwright `Locator` for the "Book Room" button of a specific room card.
   *
   * This asynchronous function locates the "Book Room" button based on its index
   * among the room cards. It also asserts that the button is both visible and enabled
   * before returning its `Locator`, ensuring it's ready for interaction.
   *
   * @param index The zero-based index of the room card's "Book Room" button to retrieve.
   * @returns A Promise that resolves to the Playwright `Locator` for the specified button.
   */

  async getRoomBookButtonLocator(index: number): Promise<Locator> {
    const bookRoomButton = this.roomCardBookButton.nth(index);
    await expectVisibleAndEnabled(bookRoomButton);
    return bookRoomButton;
  }

  /**
   * Internal helper to extract details from all room cards on the page.
   * This method is now simplified as the exact roomId for cleanup is obtained from the detail page.
   */
  private async getAllRoomOptionInternalDetails(): Promise<RoomOptionInternalDetails[]> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.roomCardBookButton.first()).toBeVisible(); // Check first button
    const count = await this.roomCardBookButton.count(); // Get total count of room containers
    console.log(`Found ${count} room cards.`);
    const rooms: RoomOptionInternalDetails[] = [];

    if (count === 0) {
      throw new Error('No room cards found on the home page with the selector ".room-card". Please check selector.');
    }

    for (let i = 0; i < count; i++) {
      const typeLocator = this.roomCardTitle.nth(i);
      const type = (await typeLocator.textContent())?.trim() || `Room ${i + 1}`;
      const price = await this.getRoomRateValue(i);
      const bookNowButton = await this.getRoomBookButtonLocator(i);

      const roomId: string | undefined = undefined;

      if (price !== null) {
        rooms.push({ type, price, bookNowButton: bookNowButton, roomId: roomId });
      } else {
        console.warn(`Room "${type}" does not have a visible price or 'BOOK NOW' button. This room will be skipped for selection.`);
      }
    }

    if (rooms.length === 0) {
      throw new Error('No valid room options with visible titles, prices, and "BOOK NOW" buttons found after parsing cards.');
    }
    return rooms;
  }

  /**
   * Selects a random available room option and attempts to book it.
   *
   * This asynchronous method first retrieves details of all available room options.
   * It then randomly selects one of these rooms, clicks its "Book Now" button,
   * waits for the page to navigate and load, and extracts the `roomId` from the
   * resulting reservation URL. If the `roomId` cannot be extracted, an error is thrown.
   * Finally, it returns an object containing the details of the selected room,
   * including its type, price, and the extracted `roomId`.
   *
   * @returns A Promise that resolves to a `SelectedRoomDetails` object
   * containing the type, price, and `roomId` of the randomly selected and booked room.
   * @throws {Error} If the room ID cannot be extracted from the reservation URL after booking.
   */

  async selectRandomRoomOption(): Promise<SelectedRoomDetails> {
    const availableRooms = await this.getAllRoomOptionInternalDetails();
    const randomIndex = Math.floor(Math.random() * availableRooms.length);
    const selectedRoom = availableRooms[randomIndex];

    await selectedRoom.bookNowButton.waitFor({ state: 'visible', timeout: 10000 });
    await selectedRoom.bookNowButton.scrollIntoViewIfNeeded();
    await validateAndPerform(selectedRoom.bookNowButton).click();
    await this.page.waitForLoadState('domcontentloaded');
    const currentUrl = this.page.url();
    console.log(`Current URL after clicking Book Now: ${currentUrl}`);
    const urlMatch = currentUrl.match(/\/reservation\/(\d+)/);
    console.log(`URL Match result: ${JSON.stringify(urlMatch)}`);
    let actualRoomId: string;

    if (urlMatch && urlMatch[1]) {
      actualRoomId = urlMatch[1];
      console.log(`Successfully extracted actual Room ID from URL: ${actualRoomId}`);
    } else {
      throw new Error(`Could not extract Room ID from reservation URL: ${currentUrl}. Expected pattern /reservation/{id}.`);
    }

    console.log(`Randomly selected room: "${selectedRoom.type}" (ID: ${actualRoomId}) with 1-night price: ${selectedRoom.price}`);

    return { type: selectedRoom.type, price: selectedRoom.price, roomId: Number(actualRoomId) };
  }

  /**
   * Fills out the enquiry form with the provided details and submits it.
   *
   * This asynchronous method takes a partial `EnquiryDetails` object,
   * which allows for flexibility in providing only the necessary fields.
   * It scrolls the name input into view, fills each input field (name, email, phone, subject, message)
   * with the corresponding data, and then clicks the "Submit Enquiry" button.
   * Empty strings are used as fallback values for any missing details to avoid errors.
   *
   * @param details A `Partial<EnquiryDetails>` object containing the enquiry information.
   * Expected properties include `name`, `email`, `phone`, `subject`, and `message`.
   */

  async fillEnquiryDetailsAndSubmit(details: Partial<EnquiryDetails>): Promise<void> {
    await this.nameInput.scrollIntoViewIfNeeded();
    await validateAndPerform(this.nameInput).fill(details.name || '');
    await validateAndPerform(this.emailInput).fill(details.email || '');
    await validateAndPerform(this.phoneInput).fill(details.phone || '');
    await validateAndPerform(this.subjectInput).fill(details.subject || '');
    await validateAndPerform(this.messageInput).fill(details.message || '');
    await validateAndPerform(this.submitEnquiryButton).click();
  }
}
