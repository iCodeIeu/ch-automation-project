import { test as base } from '@playwright/test';
import { Page } from '@playwright/test';
import { faker } from '@faker-js/faker'; // Faker stays here, used by the fixture for defaults
import { reservationFlow, ReservationFlowStep } from '../utils/setup-helpers';
import { SelectedRoomDetails, GuestBookingDetails } from '../utils/types'; // Assuming GuestBookingDetails is here now

export const testWithReservation = base.extend<{
  checkInDate: string;
  checkOutDate: string;
  stopAt: ReservationFlowStep;
  guestDetails: GuestBookingDetails;
  guestDetailsOverride?: Partial<GuestBookingDetails>; // This is the input for overrides
  dateOverride?: { checkIn?: string; checkOut?: string };
  reservation: {
    page: Page;
    selectedRoom?: SelectedRoomDetails;
  };
}>({
  // --- Input Fixtures (Configuration for the reservation flow) ---

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
      checkIn.setDate(checkIn.getDate() + 1);
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

  // --- NEW: The guestDetailsOverride fixture (input for overrides) ---
  guestDetailsOverride: [
    async ({}, use) => {
      // This fixture simply passes through any overrides provided by the test.
      // Default is undefined, meaning no overrides unless specified by testInfo.project.use().
      await use(undefined);
    },
    { scope: 'test' },
  ],

  // --- UPDATED: The guestDetails fixture (generates defaults and applies overrides) ---
  guestDetails: [
    async ({ checkInDate, checkOutDate, guestDetailsOverride }, use) => {
      // Generate a base set of random guest details
      const baseRandomDetails: GuestBookingDetails = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        checkInDate: checkInDate, // Get date from fixture dependency
        checkOutDate: checkOutDate, // Get date from fixture dependency
      };

      // Merge the base random details with any provided overrides.
      // Properties in guestDetailsOverride will take precedence.
      const finalGuestDetails: GuestBookingDetails = {
        ...baseRandomDetails,
        ...guestDetailsOverride, // Apply overrides if provided (undefined won't change anything)
      };

      await use(finalGuestDetails);
    },
    { scope: 'test' },
  ],

  // --- NEW: The dateOverride fixture (input for overrides) ---
  dateOverride: [
    async ({}, use) => {
      await use(undefined); // Default to no date overrides
    },
    { scope: 'test' },
  ],

  // --- Action Fixture (Executes the reservation flow) ---
  reservation: [
    async (
      {
        page,
        checkInDate,
        checkOutDate,
        stopAt,
        guestDetails, // This is the final, complete GuestBookingDetails object
        dateOverride, // <--- ENSURE THIS IS PRESENT IN THE DEPENDENCY LIST
      },
      use
    ) => {
      let selectedRoom: SelectedRoomDetails | undefined;

      // Call reservationFlow, passing the already merged guestDetails object.
      selectedRoom = await reservationFlow(page, checkInDate, checkOutDate, stopAt, guestDetails, dateOverride);

      await use({ page, selectedRoom });
    },
    { scope: 'test' },
  ],
});

export { base as test };
