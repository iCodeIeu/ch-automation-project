/**
 * @file This file defines Playwright fixtures for managing test setup related to room reservations.
 * It provides fixtures for dynamic check-in/check-out dates, guest details generation,
 * and a `reservation` fixture that can execute a full or partial reservation flow
 * before a test runs. This allows tests to start from a specific state in the
 * reservation process without duplicating setup logic.
 *
 * It extends the base Playwright `test` object to include these custom fixtures,
 * making them available to any test file that imports `testWithOptionalReservation`.
 */

import { test as base } from '@playwright/test';
import { Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { reservationFlow, ReservationFlowStep } from '../utils/setup-helpers';
import { SelectedRoomDetails, GuestBookingDetails, EnquiryDetails } from '../utils/types';

/**
 * @interface Fixtures
 * @description Defines the types for the Playwright fixtures provided by `testWithOptionalReservation`.
 * @property {string} checkInDate - The calculated check-in date for the reservation (YYYY-MM-DD format).
 * @property {string} checkOutDate - The calculated check-out date for the reservation (YYYY-MM-DD format).
 * @property {ReservationFlowStep} stopAt - Specifies at which step the reservation flow should stop.
 * @property {GuestBookingDetails} guestDetails - Generated guest booking details, potentially overridden.
 * @property {Partial<GuestBookingDetails> | undefined} guestDetailsOverride - Optional partial override for guest details.
 * @property {Partial<EnquiryDetails> | undefined} enquiryDetailsOverride - Optional partial override for enquiry details.
 * @property {{ page: Page; selectedRoom?: SelectedRoomDetails; }} reservation - An object containing the Playwright `page`
 * and optionally the details of the room selected during the reservation flow.
 */

export const testWithOptionalReservation = base.extend<{
  checkInDate: string;
  checkOutDate: string;
  stopAt: ReservationFlowStep;
  guestDetails: GuestBookingDetails;
  guestDetailsOverride?: Partial<GuestBookingDetails>;
  enquiryDetailsOverride?: Partial<EnquiryDetails>;
  reservation: {
    page: Page;
    selectedRoom?: SelectedRoomDetails;
  };
}>({
  checkInDate: [
    async ({}, use) => {
      const fourWeeksTime = new Date();
      fourWeeksTime.setDate(fourWeeksTime.getDate() + 28);
      await use(fourWeeksTime.toISOString().split('T')[0]);
    },
    { scope: 'test' },
  ],

  checkOutDate: [
    async ({ checkInDate }, use) => {
      const checkOut = new Date(checkInDate);
      checkOut.setDate(checkOut.getDate() + 7);
      await use(checkOut.toISOString().split('T')[0]);
    },
    { scope: 'test' },
  ],

  stopAt: [
    async ({}, use) => {
      await use('complete');
    },
    { scope: 'test' },
  ],

  guestDetailsOverride: [
    async ({}, use) => {
      await use(undefined);
    },
    { scope: 'test' },
  ],

  enquiryDetailsOverride: [
    async ({}, use) => {
      await use(undefined); // Default to no override for enquiry details
    },
    { scope: 'test' },
  ],

  guestDetails: [
    async ({ checkInDate, checkOutDate, guestDetailsOverride }, use) => {
      const baseRandomDetails: GuestBookingDetails = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        roomId: 0,
      };

      const finalGuestDetails: GuestBookingDetails = {
        ...baseRandomDetails,
        ...guestDetailsOverride,
      };

      await use(finalGuestDetails);
    },
    { scope: 'test' },
  ],

  /**
   * @fixture reservation
   * @description Executes the `reservationFlow` utility function with the provided
   * `checkInDate`, `checkOutDate`, `stopAt` step, and `guestDetails`.
   * This fixture sets up the browser state to a specific point in the reservation process.
   * After the test completes, it clears browser cookies for a clean state for subsequent tests.
   * @param {object} providers - Playwright fixture providers.
   * @param {Page} providers.page - The Playwright Page object.
   * @param {string} providers.checkInDate - The check-in date.
   * @param {string} providers.checkOutDate - The check-out date.
   * @param {ReservationFlowStep} providers.stopAt - The step to stop the reservation flow.
   * @param {GuestBookingDetails} providers.guestDetails - The guest details for the reservation.
   * @param {function({ page: Page; selectedRoom?: SelectedRoomDetails; }): Promise<void>} use - Function to yield
   * an object containing the `page` and optionally the `selectedRoom` details.
   * @returns {Promise<void>}
   * @scope test
   */

  reservation: [
    async ({ page, checkInDate, checkOutDate, stopAt, guestDetails }, use) => {
      let selectedRoom: SelectedRoomDetails | undefined;

      selectedRoom = await reservationFlow(page, checkInDate, checkOutDate, stopAt, guestDetails);

      await use({ page, selectedRoom });
      console.log('Clearing browser cookies...');
      await page.context().clearCookies();
    },
    { scope: 'test' },
  ],
});

export { base as test };
