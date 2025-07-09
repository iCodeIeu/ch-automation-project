import { Locator, APIRequestContext } from '@playwright/test';

export interface SelectedRoomDetails {
  type: string;
  price: number;
  roomId: number;
}

export interface RoomOptionInternalDetails {
  type: string;
  price: number;
  bookNowButton: Locator;
  roomId?: number;
}

export interface GuestBookingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  roomId: number;
}

export interface EnquiryDetails {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export type AuthResponse = {
  token: string;
};

/**
 * Represents the API client for authentication.
 * This class encapsulates the login logic for testing purposes.
 */
export class AuthApiClient {
  private requestContext: APIRequestContext;
  public authToken: string | undefined;

  constructor(requestContext: APIRequestContext) {
    this.requestContext = requestContext;
  }
}

export type BookingDates = {
  checkin: string;
  checkout: string;
};

export type BookingDetails = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
};

export type Booking = BookingDetails & {
  bookingid: string;
};

export type BookingIdResponse = {
  bookingid: string;
};
