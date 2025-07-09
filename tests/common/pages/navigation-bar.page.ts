import { Page, Locator } from '@playwright/test';

export class NavigationBarPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly bookingLink: Locator;
  readonly roomsLink: Locator;
  readonly amenitiesLink: Locator;
  readonly locationLink: Locator;
  readonly contactLink: Locator;
  readonly adminLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.getByRole('link', { name: 'Shady Meadows B&B' });
    this.roomsLink = page.getByRole('link', { name: 'Rooms' }).first();
    this.bookingLink = page.getByRole('link', { name: 'Booking' }).first();
    this.amenitiesLink = page.getByRole('link', { name: 'Amenities' });
    this.locationLink = page.getByRole('link', { name: 'Location' });
    this.contactLink = page.getByRole('link', { name: 'Contact' }).first();
    this.adminLink = page.getByRole('link', { name: 'Admin' }).first();
  }
}
