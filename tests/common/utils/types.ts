import { Locator } from '@playwright/test';

export interface SelectedRoomDetails {
  type: string;
  price: number;
}

export interface RoomOptionInternalDetails {
  type: string;
  price: number;
  bookNowButton: Locator;
}

export interface GuestBookingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
}

export interface EnquiryDetails {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}
