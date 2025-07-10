/**
 * @file This file defines a flexible reservation flow helper function for Playwright tests.
 * It allows tests to execute the booking process up to a specified step, enabling
 * targeted testing of different stages of the reservation journey.
 */

import { Page } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { RoomDetailsPage } from '../pages/room-details.page';
import { GuestBookingDetails, SelectedRoomDetails } from '../utils/types'; // Assuming GuestDetails is your type, previously GuestBookingDetails
import { assertReturnToHomePage } from './shared-helpers';

/**
 * Defines the possible stopping points within the reservation flow.
 * Each step represents a distinct stage in the booking process.
 */

export type ReservationFlowStep = 'start' | 'selectDates' | 'selectRoom' | 'enterGuestDetails' | 'bookingVerification' | 'complete';

/**
 * A record mapping each `ReservationFlowStep` to a numerical priority.
 * This is used internally by `reservationFlow` to determine how far to proceed
 * based on the `stopAt` parameter. Higher numbers indicate later stages in the flow.
 */

export const stopAtPriority: Record<ReservationFlowStep, number> = {
  start: 1,
  selectDates: 2,
  selectRoom: 3,
  enterGuestDetails: 4,
  bookingVerification: 5,
  complete: 6,
};

/**
 * Executes a simulated reservation flow on the given Playwright page.
 *
 * This function orchestrates the steps of booking a room, from navigating to the home page,
 * selecting dates, choosing a room, filling guest details, and verifying the booking.
 * It allows for stopping the flow at a specific stage, which is useful for testing
 * partial scenarios or states.
 *
 * @param page The Playwright `Page` object to interact with the browser.
 * @param checkIn The desired check-in date in 'YYYY-MM-DD' format.
 * @param checkOut The desired check-out date in 'YYYY-MM-DD' format.
 * @param stopAt The step at which the reservation flow should stop. Defaults to 'complete'.
 * @param guestDetails An object containing the guest's booking details. This object
 * will have its `roomId` property populated if a room is successfully selected during the flow.
 * @returns A Promise that resolves to `SelectedRoomDetails` if a room was selected,
 * otherwise `undefined`. This can be used by the calling test to perform further
 * assertions or cleanup based on the selected room.
 * @throws {Error} If a room cannot be selected when the flow is configured to proceed
 * to the 'selectRoom' stage or beyond.
 */

export async function reservationFlow(
  page: Page,
  checkIn: string,
  checkOut: string,
  stopAt: ReservationFlowStep = 'complete',
  guestDetails: GuestBookingDetails
): Promise<SelectedRoomDetails | undefined> {
  const homePage = new HomePage(page);
  const roomDetailsPage = new RoomDetailsPage(page);

  const shouldProceedTo = (step: ReservationFlowStep) => stopAtPriority[stopAt] > stopAtPriority[step];

  let selectedRoom: SelectedRoomDetails | undefined; // To store details of the selected room

  // Step 1: Go to Home Page
  if (shouldProceedTo('start')) {
    await homePage.goToHomePage();
  }

  // Step 2: Enter Check-in/Check-out dates and submit
  if (shouldProceedTo('selectDates')) {
    await homePage.enterCheckInCheckOutDatesAndSubmit(page, checkIn, checkOut);
  }

  // Step 3: Select a random room and capture its details
  if (shouldProceedTo('selectRoom')) {
    selectedRoom = await homePage.selectRandomRoomOption();

    if (selectedRoom) {
      guestDetails.roomId = selectedRoom.roomId;
      console.info(`Assigned selected room ID to guestDetails: ${guestDetails.roomId}`);
    } else {
      throw new Error('Failed to select a room. Cannot proceed with reservation flow.');
    }

    console.info(`Selected room: ${selectedRoom.type} with price: ${selectedRoom.price}`);
    await roomDetailsPage.assertRoomDetailsAndNights(selectedRoom, checkIn, checkOut);
    await roomDetailsPage.assertTotalPriceCalculationAndProceed(selectedRoom.price, checkIn, checkOut);
  }

  // Step 4: Enter guest details and book the room
  if (shouldProceedTo('enterGuestDetails')) {
    await roomDetailsPage.fillGuestBookingDetailsAndProceed(guestDetails);
  }

  // Step 5: Verify booking success
  if (shouldProceedTo('bookingVerification')) {
    await roomDetailsPage.verifyBookingSuccess(guestDetails);
  }

  const reachedComplete = stopAtPriority[stopAt] >= stopAtPriority['complete'];
  // Step 6:  Final check for completion
  if (reachedComplete) {
    await assertReturnToHomePage(page);
    console.info('Reservation flow completed.');
  }

  // Return selectedRoom if needed for further assertions in the test, otherwise return undefined
  return selectedRoom;
}
