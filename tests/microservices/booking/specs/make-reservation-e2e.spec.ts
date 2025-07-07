import { testWithReservation } from '../../../common/fixtures/page-fixture';
import { expect } from '@playwright/test';

testWithReservation.describe('Make Reservation End-to-End', () => {
  // This .use() applies to all tests within this describe block
  testWithReservation.use({
    checkInDate: '2025-07-07',
    checkOutDate: '2025-07-08',
    stopAt: 'complete',
    // No need to explicitly provide guestDetailsOverride here unless you want
    // non-random guest details for *this specific test suite*.
    // The `guestDetails` fixture will run by default if requested or depended upon.
  });

  // CRITICAL CHANGE: Request the 'reservation' fixture in the test parameters.
  testWithReservation('should complete the reservation flow', async ({ reservation, baseURL }) => {
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
