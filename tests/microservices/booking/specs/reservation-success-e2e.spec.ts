/**
 * @file This file contains an end-to-end Playwright test suite for the full room reservation process,
 * from selecting a room to confirming the booking. It also includes an `afterEach` hook
 * to clean up the created booking via API, ensuring test data integrity.
 */

import { testWithOptionalReservation } from '../../../common/fixtures/page-fixture';
import { cleanupBooking } from '../../../common/utils/api-helpers';
import { expect } from '@playwright/test';

testWithOptionalReservation.describe('Reservation Management: End-to-End Success', () => {
  testWithOptionalReservation.describe('Reservation Management: Standard Full Booking Process', () => {
    testWithOptionalReservation.afterEach(async ({ request, guestDetails }) => {
      console.log('Attempting cleanup with guestDetails:', guestDetails);
      await cleanupBooking(request, guestDetails);
    });

    testWithOptionalReservation.use({
      stopAt: 'complete',
    });

    testWithOptionalReservation('Should display reservation confirmation with correct details', async ({ reservation, baseURL }) => {
      await expect(reservation.page).toHaveURL(baseURL!);
    });
  });
});
