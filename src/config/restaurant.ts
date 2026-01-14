// Restaurant Configuration
// This file contains restaurant information that is used across the application

export const RESTAURANT_INFO = {
    name: 'Crusty Pizza',
    logo: '/crusty-logo.png',
    address: {
        street: 'Hauptstrasse 66',
        zip: '63853',
        city: 'Mömlingen',
        country: 'Deutschland',
        // Full address as a single string
        full: 'Hauptstrasse 66, 63853 Mömlingen'
    },
    contact: {
        phone: '06022 2656947',
        email: 'info@pizza-restaurant.de'
    },
    taxNumber: '63552794804'
} as const;
