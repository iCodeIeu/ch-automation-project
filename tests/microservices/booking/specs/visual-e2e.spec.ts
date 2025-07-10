/**
 * @file This file contains non-functional (visual) tests for the reservation flow.
 * It verifies consistent UI between runs by masking dynamic values to ensure stability.
 *
 * Important Note on Dynamic Content:
 * This platform undergoes frequent visual updates and dynamic content changes multiple times daily.
 * While comprehensive masking is applied, significant variations in content and layout (e.g., dynamic container heights)
 * can lead to frequent snapshot mismatches.
 *
 * These tests are crucial for identifying *unintended* visual regressions that may occur
 * due to code changes, even in a highly dynamic environment.
 *
 * To manage baselines effectively:
 * - Snapshots may require frequent updates. Use `npx playwright test --update-snapshots`
 * to refresh baselines when *intentional* visual changes have been deployed.
 */

import { testWithOptionalReservation } from '../../../common/fixtures/page-fixture';
import { cleanupBooking } from '../../../common/utils/api-helpers';
import { expect } from '@playwright/test';

testWithOptionalReservation.describe('Visual Regression: Reservation Flow', () => {
  testWithOptionalReservation.use({
    stopAt: 'selectDates',
  });
  testWithOptionalReservation('should have consistent UI throughout the home page', async ({ reservation, homePage }) => {
    await expect(reservation.page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      mask: [homePage.roomCard, homePage.checkInDateInput, homePage.checkOutDateInput],
    });
  });

  testWithOptionalReservation.describe('should have consistent UI throughout the reservation page', () => {
    testWithOptionalReservation.use({
      stopAt: 'enterGuestDetails',
    });
    testWithOptionalReservation('should have consistent UI throughout the room details page', async ({ reservation, roomDetailsPage }) => {
      await expect(reservation.page).toHaveScreenshot('room-details-page.png', {
        fullPage: true,
        mask: [
          roomDetailsPage.similarRoomsContainer,
          roomDetailsPage.priceSummaryCard,
          roomDetailsPage.calendarBookingsCard,
          roomDetailsPage.selectedRoomDetailsCard,
          roomDetailsPage.roomPricePerNight,
          roomDetailsPage.breadcrumbRoomType,
          roomDetailsPage.footerContainer,
        ],
      });
    });
  });

  testWithOptionalReservation.describe('Should have consistent UI on the upon successful booking', () => {
    testWithOptionalReservation.afterEach(async ({ request, guestDetails }) => {
      console.log('Attempting cleanup with guestDetails:', guestDetails);
      await cleanupBooking(request, guestDetails);
    });
    testWithOptionalReservation.use({
      stopAt: 'bookingVerification',
    });
    testWithOptionalReservation('should have consistent UI upong successful booking', async ({ reservation, roomDetailsPage }) => {
      await expect(reservation.page).toHaveScreenshot('booking-verification.png', {
        fullPage: true,
        mask: [
          roomDetailsPage.similarRoomsContainer,
          roomDetailsPage.priceSummaryCard,
          roomDetailsPage.calendarBookingsCard,
          roomDetailsPage.selectedRoomDetailsCard,
          roomDetailsPage.roomPricePerNight,
          roomDetailsPage.breadcrumbRoomType,
          roomDetailsPage.footerContainer,
          roomDetailsPage.displayedBookingDates,
        ],
      });
    });
  });
});
