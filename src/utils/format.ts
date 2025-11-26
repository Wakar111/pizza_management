// Format price as EUR currency
export function formatPrice(value: number): string {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
}

// Format date/time
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}

// Get Tailwind classes for category badges
export function getCategoryClass(category: string): string {
    const classes: Record<string, string> = {
        'Pizza': 'bg-red-50 text-red-700',
        'Pasta': 'bg-blue-50 text-blue-700',
        'Salate': 'bg-green-50 text-green-700',
        'Burger': 'bg-yellow-50 text-yellow-700',
        'Getränke': 'bg-indigo-50 text-indigo-700',
        'Desserts': 'bg-purple-50 text-purple-700',
        'Vorspeise': 'bg-pink-50 text-pink-700'
    };
    return classes[category] || 'bg-gray-100 text-gray-700';
}
