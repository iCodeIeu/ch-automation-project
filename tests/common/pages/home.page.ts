import { Page, expect, Locator } from '@playwright/test';
import { expectVisibleAndEnabled, validateAndPerform, getDigits } from '../utils/shared-helpers';
import { SelectedRoomDetails, RoomOptionInternalDetails } from '../utils/types';
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
   * Adjust selectors within this method based on your actual HTML structure.
   */
  private async getAllRoomOptionInternalDetails(): Promise<RoomOptionInternalDetails[]> {
    const rooms: RoomOptionInternalDetails[] = [];
    await expect(this.roomCard.last()).toBeVisible();
    const count = await this.roomCard.count(); // Get total count of room containers

    if (count === 0) {
      throw new Error('No room cards found on the home page with the selector ".room-card". Please check selector.');
    }

    for (let i = 0; i < count; i++) {
      // Get the specific title locator for the current room card
      const typeLocator = this.roomCardTitle.nth(i);
      const type = (await typeLocator.textContent())?.trim() || `Room ${i + 1}`;

      // Get the price using the dedicated helper for the current room card
      const price = await this.getRoomRateValue(i);

      // Get the button locator using the dedicated helper for the current room card
      const bookNowButton = await this.getRoomBookButtonLocator(i);

      if (price !== null) {
        // Only add if price was successfully extracted
        rooms.push({ type, price, bookNowButton: bookNowButton }); // Store the specific button Locator
      } else {
        console.warn(`Room "${type}" does not have a visible price or 'BOOK NOW' button.`);
      }
    }

    if (rooms.length === 0) {
      throw new Error('No valid room options with visible titles, prices, and "BOOK NOW" buttons found after parsing cards.');
    }
    return rooms;
  }

  /**
   * Selects a random room option from the available choices, clicks its "BOOK NOW" button,
   * and returns the type and price of the selected room.
   * This method assumes navigating to the room details page after clicking.
   */
  async selectRandomRoomOption(): Promise<SelectedRoomDetails> {
    const availableRooms = await this.getAllRoomOptionInternalDetails();
    const randomIndex = faker.number.int({ min: 0, max: availableRooms.length - 1 });
    const selectedRoom = availableRooms[randomIndex];

    await selectedRoom.bookNowButton.scrollIntoViewIfNeeded();
    await validateAndPerform(selectedRoom.bookNowButton).click();
    console.log(`Randomly selected room: "${selectedRoom.type}" with 1-night price: ${selectedRoom.price}`);

    await this.page.waitForLoadState('domcontentloaded');
    return { type: selectedRoom.type, price: selectedRoom.price };
  }
}
