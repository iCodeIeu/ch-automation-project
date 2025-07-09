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
    const authApiClient = new AuthApiClient(request);
    const response = await authApiClient['requestContext'].post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        username: AdminCredentials.Username,
        password: 'invalid_password',
      },
    });

    expect(response.status()).not.toBe(200);
    expect(response.status()).toBe(401);
    expect(response.status()).toBeLessThan(500);

    const responseBody = await response.json();
    expect(responseBody).not.toHaveProperty('token');
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toBe('Invalid credentials');
  });

  test('should prevent login with invalid username', async ({ request }) => {
    console.log('Running test: should prevent login with invalid username');
    const authApiClient = new AuthApiClient(request);
    const response = await authApiClient['requestContext'].post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        username: 'invalid_user',
        password: AdminCredentials.Password,
      },
    });

    expect(response.status()).not.toBe(200);
    expect(response.status()).toBe(401);
    expect(response.status()).toBeLessThan(500);

    const responseBody = await response.json();
    expect(responseBody).not.toHaveProperty('token');
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toBe('Invalid credentials');
  });

  test('should prevent login with missing username', async ({ request }) => {
    console.log('Running test: should prevent login with missing username');
    const authApiClient = new AuthApiClient(request);
    const response = await authApiClient['requestContext'].post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        // username: AdminCredentials.Username, // Missing username
        password: AdminCredentials.Password,
      },
    });

    expect(response.status()).not.toBe(200);
    expect(response.status()).toBe(401);
    expect(response.status()).toBeLessThan(500);

    const responseBody = await response.json();
    expect(responseBody).not.toHaveProperty('token');
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toBe('Invalid credentials');
  });

  test('should prevent login with missing password', async ({ request }) => {
    console.log('Running test: should prevent login with missing password');
    const authApiClient = new AuthApiClient(request);
    const response = await authApiClient['requestContext'].post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        username: AdminCredentials.Username,
        // password: AdminCredentials.Password, // Missing password
      },
    });

    expect(response.status()).not.toBe(200);
    expect(response.status()).toBe(401);
    expect(response.status()).toBeLessThan(500);

    const responseBody = await response.json();
    expect(responseBody).not.toHaveProperty('token');
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toBe('Invalid credentials');
  });

  test('should prevent login with empty username and password', async ({ request }) => {
    console.log('Running test: should prevent login with empty username and password');
    const authApiClient = new AuthApiClient(request);
    const response = await authApiClient['requestContext'].post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      data: {
        username: '',
        password: '',
      },
    });

    expect(response.status()).not.toBe(200);
    expect(response.status()).toBe(401);
    expect(response.status()).toBeLessThan(500);

    const responseBody = await response.json();
    expect(responseBody).not.toHaveProperty('token');
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toBe('Invalid credentials');
  });

  test('should prevent login with malformed JSON body', async ({ request }) => {
    console.log('Running test: should prevent login with malformed JSON body');
    const authApiClient = new AuthApiClient(request);

    const malformedJson = `{"username": "testuser", "password": "testpassword",`;

    const response = await authApiClient['requestContext'].post(`${BASE_API_URL}${BookingEndpoints.Login}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: malformedJson,
    });

    expect(response.status()).not.toBe(200);
    expect(response.status()).toBe(401); // Bad Request (400) is more typical though
    expect(response.status()).toBeLessThan(500);

    const responseBody = await response.json();
    expect(responseBody).not.toHaveProperty('token');
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toBe('Invalid credentials');
  });
});
