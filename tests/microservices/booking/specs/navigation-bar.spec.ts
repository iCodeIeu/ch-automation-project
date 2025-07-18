/**
 * @file This file contains Playwright tests for validating the functionality of the navigation bar
 * across different sections of the application. It ensures that clicking each navigation link
 * directs the user to the correct page or section.
 */

import { testWithOptionalReservation } from '../../../common/fixtures/page-fixture';
import { createNavigationActions } from '../../../common/utils/shared-helpers';

testWithOptionalReservation.describe('Navigation Bar', () => {
  testWithOptionalReservation.describe('Navigation Bar: Check links work as expected', () => {
    testWithOptionalReservation.use({
      stopAt: 'selectDates',
    });

    testWithOptionalReservation(
      'Should checkt the navigation bar links work as expected',
      {
        annotation: {
          type: 'issue',
          description: 'Amenities link is currently broken so not included here. Ticket ref: bug-1',
        },
      },
      async ({ reservation }) => {
        const navigationActions = createNavigationActions(reservation.page);

        await navigationActions.clickBooking();
        await navigationActions.clickRooms();
        await navigationActions.clickLocation();
        await navigationActions.clickContact();
        await navigationActions.clickHome();
        await navigationActions.clickAdmin();
      }
    );
  });
});
