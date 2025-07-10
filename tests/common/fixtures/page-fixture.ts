/**
 * This file sets up Playwright fixtures for various page objects used in the test suite.
 * It exports two test instances: `test` and `testWithOptionalReservation`.
 *
 * The `test` instance extends the base Playwright `test` object and provides fixtures
 * for the following page objects:
 * - {@link HomePage}: Represents the home page of the application.
 * - {@link RoomDetailsPage}: Represents the room details page.
 * - {@link NavigationBarPage}: Represents the common navigation bar.
 * - {@link AdminPage}: Represents the administration page.
 *
 * These page object fixtures are initialised with the current Playwright `page` object
 * and made available to tests that use this `test` instance.
 *
 * The `testWithOptionalReservation` instance extends a base test with optional reservation
 * functionality (`../fixtures/reservation-fixture`). It also includes the same page object
 * fixtures as the `test` instance.
 *
 * The file also re-exports `expect` and `Page` from `@playwright/test` for convenience
 * in test files.
 */

import { test as base } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { RoomDetailsPage } from '../pages/room-details.page';
import { NavigationBarPage } from '../pages/navigation-bar.page';
import { AdminPage } from '../pages/admin.page';

interface Fixtures {
  homePage: HomePage;
  roomDetailsPage: RoomDetailsPage;
  navigationBar: NavigationBarPage;
  adminPage: AdminPage;
}

/**
 * @function getPageFiles
 * @description A factory function that returns an object containing Playwright fixture definitions
 * for various page objects. Each fixture provides an instance of its respective Page Object Model (POM)
 * initialised with the current Playwright `page` object.
 * @returns {object} An object where keys are fixture names and values are Playwright fixture functions.
 */

function getPageFiles() {
  return {
    homePage: async ({ page }, use) => {
      const homePage = new HomePage(page);
      await use(homePage);
    },
    roomDetailsPage: async ({ page }, use) => {
      const roomDetailsPage = new RoomDetailsPage(page);
      await use(roomDetailsPage);
    },
    navigationBar: async ({ page }, use) => {
      const navigationBar = new NavigationBarPage(page);
      await use(navigationBar);
    },
    adminPage: async ({ page }, use) => {
      const adminPage = new AdminPage(page);
      await use(adminPage);
    },
  };
}
export const test = base.extend<Fixtures>(getPageFiles());

import { testWithOptionalReservation as baseWithOptionalReservation } from '../fixtures/reservation-fixture';

export const testWithOptionalReservation = baseWithOptionalReservation.extend<Fixtures>(getPageFiles());

export { expect, Page } from '@playwright/test';
