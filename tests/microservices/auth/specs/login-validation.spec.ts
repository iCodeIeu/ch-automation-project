import { testWithOptionalReservation, expect } from '../../../common/fixtures/page-fixture';
import { createNavigationActions, validateAndPerform, verifyValidationErrors } from '../../../common/utils/shared-helpers';
import { AdminCredentials, ADMIN_INVALID_CREDENTIALS_ERROR } from '../../../common/utils/constants';
import { faker } from '@faker-js/faker';

testWithOptionalReservation.describe('Admin Login Validation', () => {
  testWithOptionalReservation.beforeEach(async ({ page }) => {
    const navigationActions = createNavigationActions(page);
    navigationActions.clickAdmin();
  });

  testWithOptionalReservation.describe('Admin Login Validation: Invalid Username Submission', () => {
    testWithOptionalReservation.use({
      stopAt: 'selectDates',
    });

    testWithOptionalReservation('Should enter an invalid username and check the error is present', async ({ reservation, adminPage }) => {
      adminPage.login(faker.internet.username(), AdminCredentials.Password);
      await verifyValidationErrors(reservation.page, adminPage.invalidCredentialsError, [ADMIN_INVALID_CREDENTIALS_ERROR]);
    });
  });

  testWithOptionalReservation.describe('Admin Login Validation: Invalid Password Submission', () => {
    testWithOptionalReservation.use({
      stopAt: 'selectDates',
    });

    testWithOptionalReservation('Should enter an invalid password and check the error is present', async ({ reservation, adminPage }) => {
      adminPage.login(AdminCredentials.Username, faker.internet.password());
      await verifyValidationErrors(reservation.page, adminPage.invalidCredentialsError, [ADMIN_INVALID_CREDENTIALS_ERROR]);
    });
  });

  testWithOptionalReservation.describe('Admin Login Validation: Empty Field Submissions', () => {
    testWithOptionalReservation.use({
      stopAt: 'selectDates',
    });

    testWithOptionalReservation(
      'Should attempt login with empty fields and check the error is present',
      async ({ reservation, adminPage }) => {
        adminPage.login('', '');
        await verifyValidationErrors(reservation.page, adminPage.invalidCredentialsError, [ADMIN_INVALID_CREDENTIALS_ERROR]);
      }
    );
  });

  testWithOptionalReservation.describe('Admin Login Validation: Valid Credentials', () => {
    testWithOptionalReservation.use({
      stopAt: 'selectDates',
    });

    testWithOptionalReservation('Should login successfully and logout as expected', async ({ reservation, adminPage, homePage }) => {
      adminPage.login(AdminCredentials.Username, AdminCredentials.Password);
      await verifyValidationErrors(reservation.page, adminPage.invalidCredentialsError, []);
      await expect(reservation.page).toHaveURL(/\/admin\/rooms\/?/);
      await validateAndPerform(adminPage.logoutButton).click();
      await expect(homePage.pageTitle).toBeVisible();
    });
  });
});
