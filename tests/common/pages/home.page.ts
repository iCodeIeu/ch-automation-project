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
  readonly checkAvailabilityButton: Locator;
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
    this.checkAvailabilityButton = page.getByRole('button', { name: 'Check Availability', exact: true });
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

  private formatDateForDatePicker(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    // Use Date.UTC to prevent timezone issues shifting the day, especially for 'weekday' calculation
    const date = new Date(Date.UTC(year, month - 1, day)); // Month is 0-indexed in JS Date (July = 6)

    const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }); // e.g., "Monday"
    const dayOfMonth = date.getUTCDate(); // e.g., 7
    const monthName = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }); // e.g., "July"

    return `${weekday}, ${dayOfMonth} ${monthName}`;
  }

  async enterCheckInCheckOutDatesAndSubmit(page, checkInDate: string, checkOutDate: string): Promise<void> {
    const formattedCheckInDate = this.formatDateForDatePicker(checkInDate);
    const formattedCheckOutDate = this.formatDateForDatePicker(checkOutDate);

    const checkInDateToSelect = this.page.getByRole('option', { name: `Choose ${formattedCheckInDate}` });
    const checkOutDateToSelect = this.page.getByRole('option', { name: `Choose ${formattedCheckOutDate}` });

    console.info(`Entered check-in: ${checkInDate} (${formattedCheckInDate}), check-out: ${checkOutDate} (${formattedCheckOutDate})`);

    await validateAndPerform(this.checkInDateInput).click();
    await this.datePickerModal.waitFor({ state: 'visible' });
    await validateAndPerform(checkInDateToSelect).click();
    await this.datePickerModal.waitFor({ state: 'hidden' });
    await validateAndPerform(this.checkOutDateInput).click();
    await this.datePickerModal.waitFor({ state: 'visible' });
    await validateAndPerform(checkOutDateToSelect).click();
    await this.datePickerModal.waitFor({ state: 'hidden' });
    await validateAndPerform(this.checkAvailabilityButton).click();
  }

  async getRoomRateValue(index: number): Promise<number | null> {
    const roomRate = this.roomCardRate.nth(index);
    await expect(roomRate).toBeVisible();
    return await getDigits(roomRate);
  }

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

      // roomId is no longer extracted here, it will be extracted on the reservation page.
      // We can initialize it as undefined or null here, or simply omit it from the push
      // if the interface allowed it. For consistency with SelectedRoomDetails, we'll keep it,
      // but it won't be used for finding the booking at this stage.
      const roomId: string | undefined = undefined; // Explicitly set to undefined

      if (price !== null) {
        // Only check for price, as roomId is not reliably available here
        rooms.push({ type, price, bookNowButton: bookNowButton, roomId: roomId }); // roomId will be undefined here
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
   * Selects a random room option from the available choices, clicks its "BOOK NOW" button,
   * and returns the type, price, and roomId of the selected room.
   * This method now reliably extracts the roomId from the URL of the room details page.
   */
  async selectRandomRoomOption(): Promise<SelectedRoomDetails> {
    const availableRooms = await this.getAllRoomOptionInternalDetails();
    const randomIndex = Math.floor(Math.random() * availableRooms.length);
    const selectedRoom = availableRooms[randomIndex]; // selectedRoom.roomId will be undefined here

    await selectedRoom.bookNowButton.waitFor({ state: 'visible', timeout: 10000 });
    await selectedRoom.bookNowButton.scrollIntoViewIfNeeded();
    await validateAndPerform(selectedRoom.bookNowButton).click(); // Using direct click for simplicity, adjust if you have validateAndPerform
    await this.page.waitForLoadState('domcontentloaded');
    const currentUrl = this.page.url();
    console.log(`Current URL after clicking Book Now: ${currentUrl}`); // Added log for URL
    // Regex to capture ID from /reservation/{id}
    const urlMatch = currentUrl.match(/\/reservation\/(\d+)/);
    console.log(`URL Match result: ${JSON.stringify(urlMatch)}`); // Added log for regex match result
    let actualRoomId: string;

    if (urlMatch && urlMatch[1]) {
      actualRoomId = urlMatch[1];
      console.log(`Successfully extracted actual Room ID from URL: ${actualRoomId}`);
    } else {
      // If URL pattern is unexpected, this indicates a serious issue with navigation or URL structure.
      // We should throw an error here, as we rely on this for cleanup.
      throw new Error(`Could not extract Room ID from reservation URL: ${currentUrl}. Expected pattern /reservation/{id}.`);
    }

    console.log(`Randomly selected room: "${selectedRoom.type}" (ID: ${actualRoomId}) with 1-night price: ${selectedRoom.price}`);

    return { type: selectedRoom.type, price: selectedRoom.price, roomId: Number(actualRoomId) };
  }

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
