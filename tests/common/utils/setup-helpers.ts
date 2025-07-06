import { request } from '@playwright/test';


const ApiUrls = {
    // Base URL for the API
    BaseUrl: process.env.BASE_URL || '',
    
    // Endpoints
    Login: 'auth/login',
    Validate: 'auth/validate',
    
    // Other endpoints can be added here as needed
} as const;