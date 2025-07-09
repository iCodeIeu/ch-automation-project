import { testWithOptionalReservation } from '../../../common/fixtures/page-fixture';
import { verifyValidationErrors } from '../../../common/utils/shared-helpers';
import { GUEST_DETAILS_FORM_ERRORS } from '../../../common/utils/constants';
import { faker } from '@faker-js/faker';

testWithOptionalReservation.describe('Guest Details Validation', () => {
  testWithOptionalReservation.describe('Guest Details Validation: Empty Fields Submission', () => {
    testWithOptionalReservation.use({
      checkInDate: '2025-07-21',
      checkOutDate: '2025-07-28',
      stopAt: 'bookingVerification',
      guestDetailsOverride: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      },
    });

    testWithOptionalReservation('Should check that the empty form errors are present', async ({ reservation, roomDetailsPage }) => {
      await verifyValidationErrors(reservation.page, roomDetailsPage.guestDetailsError, GUEST_DETAILS_FORM_ERRORS.EMPTY_SUBMISSION);
    });
  });

  testWithOptionalReservation.describe('Guest Details Validation: Invalid Input Submission', () => {
    testWithOptionalReservation.use({
      checkInDate: '2025-07-21',
      checkOutDate: '2025-07-28',
      stopAt: 'bookingVerification',
      guestDetailsOverride: {
        firstName: faker.string.alpha(19),
        lastName: faker.string.alpha(31),
        email: `@f${faker.internet.domainName()}`,
        phone: faker.string.numeric(22),
      },
    });

    testWithOptionalReservation('Should check that the populated form errors are present', async ({ reservation, roomDetailsPage }) => {
      await verifyValidationErrors(reservation.page, roomDetailsPage.guestDetailsError, GUEST_DETAILS_FORM_ERRORS.POPULATED_SUBMISSION);
    });
  });
});
