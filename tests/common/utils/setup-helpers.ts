// Assuming this is in a file like 'your-project/tests/helpers/reservation-flow.ts'
import { Page } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { RoomDetailsPage } from '../pages/room-details.page';
import { GuestBookingDetails, SelectedRoomDetails } from '../utils/types'; // Assuming GuestDetails is your type, previously GuestBookingDetails
import { assertReturnToHomePage } from './shared-helpers';

export type ReservationFlowStep = 'start' | 'selectDates' | 'selectRoom' | 'enterGuestDetails' | 'bookingVerification' | 'complete';

export const stopAtPriority: Record<ReservationFlowStep, number> = {
  start: 1,
  selectDates: 2,
  selectRoom: 3,
  enterGuestDetails: 4,
  bookingVerification: 5,
  complete: 6,
};

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
