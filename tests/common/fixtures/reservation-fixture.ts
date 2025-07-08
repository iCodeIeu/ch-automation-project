import { test as base } from '@playwright/test';
import { Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { reservationFlow, ReservationFlowStep } from '../utils/setup-helpers';
import { SelectedRoomDetails, GuestBookingDetails, EnquiryDetails } from '../utils/types';

export const testWithReservation = base.extend<{
  checkInDate: string;
  checkOutDate: string;
  stopAt: ReservationFlowStep;
  guestDetails: GuestBookingDetails;
  guestDetailsOverride?: Partial<GuestBookingDetails>;
  enquiryDetailsOverride?: Partial<EnquiryDetails>;
  dateOverride?: { checkIn?: string; checkOut?: string };
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
      };

      const finalGuestDetails: GuestBookingDetails = {
        ...baseRandomDetails,
        ...guestDetailsOverride,
      };

      await use(finalGuestDetails);
    },
    { scope: 'test' },
  ],

  dateOverride: [
    async ({}, use) => {
      await use(undefined); // Default to no date overrides
    },
    { scope: 'test' },
  ],

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

      selectedRoom = await reservationFlow(page, checkInDate, checkOutDate, stopAt, guestDetails, dateOverride);

      await use({ page, selectedRoom });
    },
    { scope: 'test' },
  ],
});

export { base as test };
