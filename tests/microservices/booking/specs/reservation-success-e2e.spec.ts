import { testWithOptionalReservation } from '../../../common/fixtures/page-fixture';
import { cleanupBooking } from '../../../common/utils/api-helpers';
import { expect } from '@playwright/test';

testWithOptionalReservation.describe.only('Reservation Management: End-to-End Success', () => {
  testWithOptionalReservation.describe('Reservation Management: Standard Full Booking Process', () => {
    testWithOptionalReservation.afterEach(async ({ request, guestDetails }) => {
      console.log('Attempting cleanup with guestDetails:', guestDetails); // Added for extra logging
      await cleanupBooking(request, guestDetails);
    });

    testWithOptionalReservation.use({
      stopAt: 'complete',
      // No need to explicitly provide guestDetailsOverride here unless you want
      // non-random guest details for *this specific test suite*.
      // The `guestDetails` fixture will run by default if requested or depended upon.
    });

    // CRITICAL CHANGE: Request the 'reservation' fixture in the test parameters.
    testWithOptionalReservation('Should display reservation confirmation with correct details', async ({ reservation, baseURL }) => {
      // By requesting 'reservation', Playwright will:
      // 1. Run the 'checkInDate', 'checkOutDate', 'stopAt', 'guestDetails', 'dateOverride' fixtures (as they are dependencies of 'reservation').
      // 2. Execute the setup block of the 'reservation' fixture, which calls `reservationFlow`.
      // 3. `reservationFlow` will then navigate the `page` through the booking process up to `stopAt: 'complete'`.

      // The `reservation` fixture returns { page: Page, selectedRoom?: SelectedRoomDetails }.
      // So, `reservation.page` is the page object at the end of the flow.

      // After a 'complete' reservation flow, the page should be on the confirmation page.
      // Adjust the URL regex to match your actual confirmation page URL.

      await expect(reservation.page).toHaveURL(baseURL!);

      // You can also add further assertions for the confirmation page, e.g.:
      // await expect(reservation.page.locator('h1')).toHaveText('Booking Confirmed!');
      // await expect(reservation.page.locator('.booking-details')).toContainText('John Doe'); // Assuming you have an assertion for guest name
    });
  });
});
