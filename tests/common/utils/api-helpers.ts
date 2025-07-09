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
   * Authenticates with the API and retrieves an authentication token.
   * @param username The username for authentication (default: 'admin').
   * @param password The password for authentication (default: 'password123').
   * @returns The authentication token string.
   * @throws Error if authentication fails or token is not found.
   */
  async login(username = AdminCredentials.Username, password = AdminCredentials.Password): Promise<string | undefined> {
    console.log(`Attempting to login as ${username}...`);
    const response: APIResponse = await this.requestContext.post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        username: username,
        password: password,
      },
    });

    // Assert that the response is OK (status 2xx)
    expect(response.ok(), `Login failed with status ${response.status()}: ${await response.text()}`).toBeTruthy();

    const authResponseBody: AuthResponse = await response.json();
    // Corrected assertion: Check that the 'token' property exists and is a string.
    // The previous assertion was checking if the token's VALUE was the error message string.
    expect(authResponseBody).toHaveProperty('token'); // Checks if 'token' property exists
    expect(typeof authResponseBody.token).toBe('string'); // Checks if the value is a string
    expect(authResponseBody.token.length).toBeGreaterThan(0); // Checks if the token string is not empty

    this.authToken = authResponseBody.token; // Store the token for future authenticated requests
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
    console.log(
      `'BOOKID URL, GET BOOKINGS BY ROOM ID, '${BASE_API_URL}${BookingEndpoints.BookingBasePath}${BookingEndpoints.RoomIdQueryParam}${roomId}`
    );

    expect(
      response.ok(),
      `Get bookings for room ID ${roomId} failed with status ${response.status()}: ${await response.text()}`
    ).toBeTruthy();

    const responseBody = await response.json();
    console.log(`Raw JSON response for bookings in room ${roomId}:`, JSON.stringify(responseBody, null, 2)); // Keep log for debugging

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

    console.log(`Attempting to delete booking ID: ${bookingId}...`);
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
 * Utility function to find a booking ID based on guest details.
 * This is useful when the UI doesn't directly expose the booking ID after creation.
 * It now strictly relies on the roomid provided in guestDetails.
 *
 * @param bookingApi An instance of BookingAPI.
 * @param guestDetails The details of the guest used to create the booking (e.g., firstname, lastname, dates).
 * @returns The booking ID as a string.
 * @throws Error if the booking is not found or if roomid is missing from guestDetails.
 */
export async function findBookingIdByGuestDetails(bookingApi: BookingAPI, guestDetails: GuestBookingDetails): Promise<string> {
  console.log(
    `Attempting to find booking ID for guest: ${guestDetails.firstName} ${guestDetails.lastName} (${guestDetails.checkInDate} - ${guestDetails.checkOutDate})...`
  );

  // Room ID is now expected to be reliably populated in guestDetails from UI selection
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
        // IMPORTANT: Ensure these properties match the Booking interface (API response)
        // and the GuestDetails interface (your fixture/input).
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
 * Utility function to perform post-test cleanup. It logs in, validates the token,
 * finds the booking ID based on guest details, and then deletes that specific booking.
 * This function should be called in your test's `afterEach` or `afterAll` hook.
 *
 * @param requestContext The Playwright APIRequestContext instance.
 * @param guestDetails The details of the guest used to create the booking.
 * @returns A Promise that resolves when the cleanup is complete.
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
    console.log('Cleanup Step 1: Successfully logged in.');

    // Step 2: Find the booking ID using the guest details (now relies on guestDetails.roomid)
    console.log('Cleanup Step 2: Attempting to find booking ID by guest details...');
    bookingId = await findBookingIdByGuestDetails(bookingApi, guestDetails);
    console.log(`Cleanup Step 2a: Found booking ID: ${bookingId}`);

    // Step 3: Delete the booking using the authenticated session and found ID
    console.log(`Cleanup Step 3: Attempting to delete booking ID: ${bookingId}...`);
    await bookingApi.deleteBooking(bookingId);
    console.log(`--- Successfully completed cleanup for booking ID: ${bookingId} ---`);
  } catch (error) {
    console.error(`--- Cleanup failed for booking for guest ${guestDetails.firstName} ${guestDetails.lastName} ---`);
    console.error(`Error during cleanup: ${error instanceof Error ? error.message : String(error)}`);
    // Re-throw the error if you want the test to fail if cleanup fails
    throw error;
  }
}
