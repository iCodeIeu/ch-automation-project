/**
 * @file This file contains Playwright tests designed to validate the functionality
 * of the contact enquiry form on the application's home page. It includes test cases
 * for submitting the form with empty fields, invalid input, and valid data,
 * asserting the correct display of validation errors or success messages.
 */

import { testWithOptionalReservation, expect } from '../../../common/fixtures/page-fixture';
import { verifyValidationErrors } from '../../../common/utils/shared-helpers';
import { ENQUIRY_DETAILS_FORM_ERRORS } from '../../../common/utils/constants';
import { faker } from '@faker-js/faker';

testWithOptionalReservation.describe('Enquiry Details Validation', () => {
  testWithOptionalReservation.describe('Enquiry Details Validation: Empty Fields Submission', () => {
    testWithOptionalReservation.use({
      stopAt: 'selectDates',
      enquiryDetailsOverride: {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      },
    });

    testWithOptionalReservation(
      'Should check that the empty form errors are present',
      async ({ reservation, homePage, enquiryDetailsOverride }) => {
        await homePage.fillEnquiryDetailsAndSubmit(enquiryDetailsOverride!);
        await verifyValidationErrors(reservation.page, homePage.enquiryDetailsError, ENQUIRY_DETAILS_FORM_ERRORS.EMPTY_SUBMISSION);
      }
    );
  });

  testWithOptionalReservation.describe('Enquiry Details Validation: Invalid Input Submission', () => {
    testWithOptionalReservation.use({
      stopAt: 'selectDates',
      enquiryDetailsOverride: {
        name: faker.person.fullName(),
        email: `@f${faker.internet.domainName()}`,
        phone: faker.string.numeric(22),
        subject: faker.string.alpha(101),
        message: faker.string.alpha(2001),
      },
    });

    testWithOptionalReservation(
      'Should check that the populated form errors are present',
      async ({ reservation, homePage, enquiryDetailsOverride }) => {
        await homePage.fillEnquiryDetailsAndSubmit(enquiryDetailsOverride!);
        await verifyValidationErrors(reservation.page, homePage.enquiryDetailsError, ENQUIRY_DETAILS_FORM_ERRORS.POPULATED_SUBMISSION);
      }
    );
  });

  testWithOptionalReservation.describe('Enquiry Details Validation: Successful Submission', () => {
    testWithOptionalReservation.use({
      stopAt: 'selectDates',
      enquiryDetailsOverride: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.string.numeric(faker.number.int({ min: 11, max: 21 })),
        subject: faker.string.alpha({ length: { min: 5, max: 100 } }),
        message: faker.string.alpha({ length: { min: 20, max: 2000 } }),
      },
    });

    testWithOptionalReservation(
      'Should successfully submit the enquiry form',
      async ({ reservation, homePage, enquiryDetailsOverride }) => {
        await homePage.fillEnquiryDetailsAndSubmit(enquiryDetailsOverride!);
        await verifyValidationErrors(reservation.page, homePage.enquiryDetailsError, []);
        await expect(homePage.successfulEnquirySubmisionMessage).toContainText(enquiryDetailsOverride?.name || '');
        await expect(homePage.successfulEnquiruSubmissionSubject).toContainText(enquiryDetailsOverride?.subject || '');
      }
    );
  });
});
