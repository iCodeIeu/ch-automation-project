import { test as base } from '@playwright/test';
import { Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { reservationFlow, ReservationFlowStep } from '../utils/setup-helpers';
import { SelectedRoomDetails, GuestBookingDetails, EnquiryDetails } from '../utils/types';

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
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await use(tomorrow.toISOString().split('T')[0]);
    },
    { scope: 'test' },
  ],

  checkOutDate: [
    async ({ checkInDate }, use) => {
      const checkIn = new Date(checkInDate);
      checkIn.setDate(checkIn.getDate() + 3);
      await use(checkIn.toISOString().split('T')[0]);
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
        roomId: 0, // This will be set later in the reservation flow
      };

      const finalGuestDetails: GuestBookingDetails = {
        ...baseRandomDetails,
        ...guestDetailsOverride,
      };

      await use(finalGuestDetails);
    },
    { scope: 'test' },
  ],

  reservation: [
    async ({ page, checkInDate, checkOutDate, stopAt, guestDetails }, use) => {
      let selectedRoom: SelectedRoomDetails | undefined;

      // Perform the setup steps for the reservation flow
      selectedRoom = await reservationFlow(page, checkInDate, checkOutDate, stopAt, guestDetails);

      // Yield control to the test function.
      // The test will execute now, using the 'page' and 'selectedRoom' provided.
      await use({ page, selectedRoom });

      // --- Teardown: Clear browser state after the test has completed ---
      // This ensures that the next test starts with a clean slate,
      // preventing data from previous tests (like selected dates) from persisting.
      console.log('Clearing browser cookies...');
      await page.context().clearCookies();
    },
    { scope: 'test' },
  ],
});

export { base as test };
