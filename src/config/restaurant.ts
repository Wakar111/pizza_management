// Restaurant Configuration
// This file contains restaurant information that is used across the application

export const RESTAURANT_INFO = {
    name: 'Pizza Restaurant',
    address: {
        street: 'Musterstraße 123',
        zip: '12345',
        city: 'Berlin',
        country: 'Deutschland',
        // Full address as a single string
        full: 'Musterstraße 123, 12345 Berlin, Deutschland'
    },
    contact: {
        phone: '+49 30 12345678',
        email: 'info@pizza-restaurant.de'
    }
} as const;
