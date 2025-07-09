// importing test from the oracle-fixture to allow the use of the runQuery function in addtion to access to page objects
import { test as base } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { RoomDetailsPage } from '../pages/room-details.page';
import { NavigationBarPage } from '../pages/navigation-bar.page';
import { AdminPage } from '../pages/admin.page';

/**
 * This interface defines the fixtures used in our tests.
 * We switched from using a 'type' to an 'interface' because interfaces in TypeScript
 * allow for more flexibility, especially when dealing with classes that have constructors
 * accepting additional arguments. This change accommodates the new page files that can
 * pass in dynamic values to their constructors, ensuring that our fixtures can handle
 * these additional parameters seamlessly.
 */
interface Fixtures {
  homePage: HomePage;
  roomDetailsPage: RoomDetailsPage;
  navigationBar: NavigationBarPage;
  adminPage: AdminPage;
}

// Define a function that returns the page objects to avoid repetition
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

// Create a base fixture that includes the common page objects
export const test = base.extend<Fixtures>(getPageFiles());

// Import the login fixture to combine it with shared page objects

import { testWithOptionalReservation as baseWithOptionalReservation } from '../fixtures/reservation-fixture';

// Includes the page files and login fixture to ensure the user is logged in before running tests

export const testWithOptionalReservation = baseWithOptionalReservation.extend<Fixtures>(getPageFiles());

// Re-export the expect function from Playwright for use in the tests

export { expect, Page } from '@playwright/test';
