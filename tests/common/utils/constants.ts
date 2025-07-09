export const CLEANING_FEE: number = 25;
export const SERVICE_FEE: number = 15;

export const GUEST_DETAILS_FORM_ERRORS = {
  EMPTY_SUBMISSION: [
    'Firstname should not be blank',
    'size must be between 3 and 18',
    'must not be empty',
    'size must be between 3 and 30',
    'size must be between 11 and 21',
    'must not be empty',
    'Lastname should not be blank',
  ],
  POPULATED_SUBMISSION: [
    'must be a well-formed email address',
    'size must be between 3 and 30',
    'size must be between 3 and 18',
    'size must be between 11 and 21',
  ],
};

export const ENQUIRY_DETAILS_FORM_ERRORS = {
  EMPTY_SUBMISSION: [
    'Subject must be between 5 and 100 characters.',
    'Email may not be blank',
    'Phone must be between 11 and 21 characters.',
    'Phone may not be blank',
    'Message must be between 20 and 2000 characters.',
    'Subject may not be blank',
    'Message may not be blank',
    'Name may not be blank',
  ],
  POPULATED_SUBMISSION: [
    'Message must be between 20 and 2000 characters.',
    'Phone must be between 11 and 21 characters.',
    'Subject must be between 5 and 100 characters.',
    'must be a well-formed email address',
  ],
};

export enum AdminCredentials {
  Username = 'admin',
  Password = 'password',
}
export const BASE_API_URL = 'https://automationintesting.online/api';

export enum BookingEndpoints {
  Login = '/auth/login',
  ValidateToken = '/auth/validate',
  BookingBasePath = '/booking/',
  RoomIdQueryParam = '?roomid=',
}
