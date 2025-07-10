/**
 * @file This file provides a comprehensive API client for interacting with a booking service.
 * It includes a `BookingAPI` class to handle authentication and direct booking operations
 * (retrieval and deletion), as well as utility functions (`findBookingIdByGuestDetails` and
 * `cleanupBooking`) to facilitate finding and cleaning up specific test bookings.
 * This ensures that automated tests can effectively manage test data by creating,
 * verifying, and then removing bookings via the API.
 */

import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { AuthResponse, Booking, GuestBookingDetails } from './types';
import { AdminCredentials, BookingEndpoints, BASE_API_URL } from './constants';
import { base } from '@faker-js/faker';

export class BookingAPI {
  private requestContext: APIRequestContext;
  private authToken: string | undefined;

  constructor(requestContext: APIRequestContext) {
    this.requestContext = requestContext;
  }

  /**
   * Attempts to log in with the provided credentials.
   * @param username The username for login. Defaults to AdminCredentials.Username.
   * @param password The password for login. Defaults to AdminCredentials.Password.
   * @returns The authentication token if successful, otherwise undefined.
   */
  async login(username = AdminCredentials.Username, password = AdminCredentials.Password): Promise<string | undefined> {
    console.log(`Attempting to login as ${username}...`);
    const response = await this.requestContext.post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        username: username,
        password: password,
      },
    });

    // Assert that the response is OK (status 2xx)
    // For positive test cases, we expect OK. For negative, we'll assert specific error statuses.
    if (!response.ok()) {
      console.log(`Login attempt failed with status ${response.status()}: ${await response.text()}`);
      return undefined;
    }

    const authResponseBody: AuthResponse = await response.json();
    expect(authResponseBody).toHaveProperty('token');
    expect(typeof authResponseBody.token).toBe('string');
    expect(authResponseBody.token.length).toBeGreaterThan(0);

    this.authToken = authResponseBody.token;
    if (this.authToken) {
      console.log(`Successfully logged in. Token: ${this.authToken.substring(0, 5)}...`);
    } else {
      console.log('Successfully logged in, but token is undefined.');
    }
    return this.authToken;
  }

  /**
   * Retrieves bookings for a specific room from the API.
   * This is used to find a newly created booking if its ID isn't directly exposed by the UI.
   * @param roomId The ID of the room for which to retrieve bookings.
   * @returns An array of booking details for the specified room.
   * @throws Error if retrieval fails or no authentication token is available.
   */
  async getBookingsByRoomId(roomId: number): Promise<Booking[]> {
    console.log(`Attempting to get bookings for room ID: ${roomId}...`);
    // Ensure authToken is available for this authenticated endpoint
    if (!this.authToken) {
      throw new Error('Cannot get bookings by room ID: No authentication token available. Please login first.');
    }

    // Construct the URL with the required roomid query parameter
    const response: APIResponse = await this.requestContext.get(
      `${BASE_API_URL}${BookingEndpoints.BookingBasePath}${BookingEndpoints.RoomIdQueryParam}${roomId}`,
      {
        headers: {
          Cookie: `token=${this.authToken}`, // Pass the authentication token in the Cookie header
        },
      }
    );

    expect(
      response.ok(),
      `Get bookings for room ID ${roomId} failed with status ${response.status()}: ${await response.text()}`
    ).toBeTruthy();

    const responseBody = await response.json();

    // Check if responseBody has a 'bookings' property and it's an array
    if (responseBody && Array.isArray(responseBody.bookings)) {
      const bookings: Booking[] = responseBody.bookings;
      console.log(`Successfully retrieved ${bookings.length} bookings for room ID: ${roomId}.`);
      return bookings;
    } else {
      // If 'bookings' property is missing or not an array, throw a more specific error
      throw new Error(
        `API response for room ID ${roomId} did not contain a 'bookings' array as expected. Response: ${JSON.stringify(responseBody)}`
      );
    }
  }

  /**
   * Deletes a specific booking. Requires authentication.
   * @param bookingId The ID of the booking to delete.
   * @throws Error if no auth token is available or deletion fails.
   */
  async deleteBooking(bookingId: string): Promise<void> {
    if (!this.authToken) {
      throw new Error('Cannot delete booking: No authentication token available. Please login first.');
    }

    // Use the generic base path and append the ID
    const response: APIResponse = await this.requestContext.delete(`${BASE_API_URL}${BookingEndpoints.BookingBasePath}${bookingId}`, {
      headers: {
        Cookie: `token=${this.authToken}`, // Use the stored token in the Cookie header
      },
    });

    // restful-booker returns 200 Created for successful deletion
    expect(
      response.status(),
      `Deletion failed for booking ID ${bookingId} with status ${response.status()}: ${await response.text()}`
    ).toBe(200);
    console.log(`Successfully deleted booking ID: ${bookingId}`);
  }
}

/**
 * Finds a specific booking ID from the API based on guest details and room ID.
 *
 * This asynchronous function searches for a booking by matching the guest's first name,
 * last name, check-in date, and check-out date within a specific room.
 * It's crucial that `guestDetails.roomId` is populated before calling this function,
 * as it's used to narrow down the API search and avoid extraneous calls.
 *
 * @param bookingApi An instance of the `BookingAPI` class used to interact with the booking service.
 * @param guestDetails An object containing the guest's booking details, including
 * `firstName`, `lastName`, `checkInDate`, `checkOutDate`, and crucially, `roomId`.
 * @returns A Promise that resolves with the found booking ID (a string).
 * @throws {Error} If `guestDetails.roomId` is not provided, if the API call to get bookings fails,
 * or if the specific booking cannot be found within the results for the given room.
 */

export async function findBookingIdByGuestDetails(bookingApi: BookingAPI, guestDetails: GuestBookingDetails): Promise<string> {
  console.log(
    `Attempting to find booking ID for guest: ${guestDetails.firstName} ${guestDetails.lastName} (${guestDetails.checkInDate} - ${guestDetails.checkOutDate})...`
  );

  if (!guestDetails.roomId) {
    throw new Error('GuestDetails must include a roomid to find the booking. Ensure it is populated after room selection in your test.');
  }

  const roomIdToSearch = guestDetails.roomId;
  console.log(`Searching for booking in room ID: ${roomIdToSearch}`);

  try {
    const bookingsInRoom = await bookingApi.getBookingsByRoomId(roomIdToSearch);
    console.log(`Fetched ${bookingsInRoom.length} bookings from API for room ID: ${roomIdToSearch}.`);

    const foundBooking = bookingsInRoom.find(
      booking =>
        booking.firstname === guestDetails.firstName &&
        booking.lastname === guestDetails.lastName &&
        booking.bookingdates.checkin === guestDetails.checkInDate &&
        booking.bookingdates.checkout === guestDetails.checkOutDate
    );
    console.log(`Found booking: ${JSON.stringify(foundBooking, null, 2)}`); // Log the found booking details

    if (foundBooking) {
      console.log(`Found booking ID: ${foundBooking.bookingid} in room ID: ${roomIdToSearch}`);
      return foundBooking.bookingid; // Return the ID as soon as it's found
    } else {
      throw new Error(
        `Newly created booking for ${guestDetails.firstName} ${guestDetails.lastName} and dates ${guestDetails.checkInDate}-${guestDetails.checkOutDate} not found in room ID: ${roomIdToSearch}.`
      );
    }
  } catch (error) {
    // Re-throw the error, as we are now relying on guestDetails.roomid to be accurate
    throw new Error(
      `Failed to retrieve bookings for room ID ${roomIdToSearch} or find the specific booking: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Cleans up a specific booking by logging in, finding the booking ID, and then deleting it.
 *
 * This asynchronous function orchestrates the process of removing a previously
 * created booking. It first authenticates with the booking API to obtain a token,
 * then uses the provided guest details (including a crucial `roomId`) to locate
 * the specific booking ID. Finally, it attempts to delete the identified booking.
 * Detailed logs are provided for each step of the cleanup process, and errors
 * are caught and logged, with the option to re-throw them if a test
 * should fail due to cleanup issues.
 *
 * @param requestContext The Playwright `APIRequestContext` used for making API calls.
 * @param guestDetails An object containing the guest's booking details, including
 * `firstName`, `lastName`, `checkInDate`, `checkOutDate`, and `roomId`, which is
 * essential for finding the booking.
 * @returns A Promise that resolves once the cleanup process is attempted.
 * @throws {Error} If authentication fails, the booking ID cannot be found, or the deletion fails.
 */

export async function cleanupBooking(requestContext: APIRequestContext, guestDetails: GuestBookingDetails): Promise<void> {
  console.log(`\n--- Starting cleanup for guest: ${guestDetails.firstName} ${guestDetails.lastName} ---`);
  console.log(`Guest details received for cleanup: ${JSON.stringify(guestDetails)}`); // Log received guest details
  const bookingApi = new BookingAPI(requestContext);
  let bookingId: string | undefined; // Declare bookingId here

  try {
    // Step 1: Login to get an authentication token
    console.log('Cleanup Step 1: Attempting to log in...');
    const token = await bookingApi.login();
    if (!token) {
      console.error('Cleanup failed: Could not obtain authentication token. Aborting cleanup.');
      return; // Exit early if login fails
    }
    console.log('--- Cleanup Step 1a: Successfully logged in. ---');

    // Step 2: Find the booking ID using the guest details (now relies on guestDetails.roomid)
    console.log('Cleanup Step 2: Attempting to find booking ID by guest details...');
    bookingId = await findBookingIdByGuestDetails(bookingApi, guestDetails);
    console.log(`--- Cleanup Step 2a: Found booking ID: ${bookingId} ---`);

    // Step 3: Delete the booking using the authenticated session and found ID
    console.log(`Cleanup Step 3: Attempting to delete booking ID: ${bookingId}...`);
    await bookingApi.deleteBooking(bookingId);
    console.log(`--- Cleanup Step 3a:Successfully completed cleanup for booking ID: ${bookingId} ---`);
  } catch (error) {
    console.error(`--- Cleanup failed for booking for guest ${guestDetails.firstName} ${guestDetails.lastName} ---`);
    console.error(`Error during cleanup: ${error instanceof Error ? error.message : String(error)}`);
    // Re-throw the error if you want the test to fail if cleanup fails
    throw error;
  }
}
