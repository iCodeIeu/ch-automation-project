import { test, expect } from '@playwright/test';
import { AuthApiClient } from '../../../common/utils/types';
import { AdminCredentials, BASE_API_URL, BookingEndpoints } from '../../../common/utils/constants';

/**
 * @file This file contains non-functional (security) tests for the Login API endpoint.
 * It verifies the API's behavior with invalid, missing, and empty credentials
 * to ensure proper error handling and prevent unauthorized access.
 */

test.describe('Login API Security Tests', () => {
  test('should prevent login with invalid password', async ({ request }) => {
    console.log('Running test: should prevent login with invalid password');
    const authApiClient = new AuthApiClient(request); // <-- Instantiate AuthApiClient per test
    const response = await authApiClient['requestContext'].post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        username: AdminCredentials.Username,
        password: 'invalid_password',
      },
    });

    // Expect a non-200 status code (e.g., 401 Unauthorized, 403 Forbidden)
    expect(response.status()).not.toBe(200);
    expect(response.status()).toBeGreaterThanOrEqual(400); // Expect a client error status
    expect(response.status()).toBeLessThan(500); // Expect not a server error

    const responseBody = await response.json();
    // Expect no token in the response for failed login
    expect(responseBody).not.toHaveProperty('token');
    // Expect an error message or specific error structure
    expect(responseBody).toHaveProperty('error'); // Changed from 'reason' to 'error'
    expect(responseBody.error).toBe('Invalid credentials'); // Changed from 'Bad credentials'
  });

  test('should prevent login with invalid username', async ({ request }) => {
    // <-- Get 'request' fixture here
    console.log('Running test: should prevent login with invalid username');
    const authApiClient = new AuthApiClient(request); // <-- Instantiate AuthApiClient per test
    const response = await authApiClient['requestContext'].post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        username: 'invalid_user', // Invalid username
        password: AdminCredentials.Password,
      },
    });

    expect(response.status()).not.toBe(200);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const responseBody = await response.json();
    expect(responseBody).not.toHaveProperty('token');
    expect(responseBody).toHaveProperty('error'); // Changed from 'reason' to 'error'
    expect(responseBody.error).toBe('Invalid credentials'); // Changed from 'Bad credentials'
  });

  test('should prevent login with missing username', async ({ request }) => {
    // <-- Get 'request' fixture here
    console.log('Running test: should prevent login with missing username');
    const authApiClient = new AuthApiClient(request); // <-- Instantiate AuthApiClient per test
    const response = await authApiClient['requestContext'].post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        // username: AdminCredentials.Username, // Missing username
        password: AdminCredentials.Password,
      },
    });

    expect(response.status()).not.toBe(200);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const responseBody = await response.json();
    expect(responseBody).not.toHaveProperty('token');
    // Expect an error message indicating missing fields or bad request
    expect(responseBody).toHaveProperty('error'); // Changed from 'reason' to 'error'
    expect(responseBody.error).toBe('Invalid credentials'); // Assuming generic 'Invalid credentials' for missing fields
  });

  test('should prevent login with missing password', async ({ request }) => {
    // <-- Get 'request' fixture here
    console.log('Running test: should prevent login with missing password');
    const authApiClient = new AuthApiClient(request); // <-- Instantiate AuthApiClient per test
    const response = await authApiClient['requestContext'].post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        username: AdminCredentials.Username,
        // password: AdminCredentials.Password, // Missing password
      },
    });

    expect(response.status()).not.toBe(200);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const responseBody = await response.json();
    expect(responseBody).not.toHaveProperty('token');
    expect(responseBody).toHaveProperty('error'); // Changed from 'reason' to 'error'
    expect(responseBody.error).toBe('Invalid credentials'); // Assuming generic 'Invalid credentials' for missing fields
  });

  test('should prevent login with empty username and password', async ({ request }) => {
    // <-- Get 'request' fixture here
    console.log('Running test: should prevent login with empty username and password');
    const authApiClient = new AuthApiClient(request); // <-- Instantiate AuthApiClient per test
    const response = await authApiClient['requestContext'].post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        username: '',
        password: '',
      },
    });

    expect(response.status()).not.toBe(200);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const responseBody = await response.json();
    expect(responseBody).not.toHaveProperty('token');
    expect(responseBody).toHaveProperty('error'); // Changed from 'reason' to 'error'
    expect(responseBody.error).toBe('Invalid credentials'); // Assuming generic 'Invalid credentials' for empty fields
  });
});
