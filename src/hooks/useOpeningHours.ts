import { useState, useEffect } from 'react';

interface OpeningPeriod {
    start: string;
    end: string;
}

type OpeningHours = Record<number, OpeningPeriod[]>;

// Opening hours definition (same as Vue project)
const openingHours: OpeningHours = {
    1: [], // Monday - Closed
    2: [{ start: '11:00', end: '14:15' }, { start: '17:00', end: '23:00' }], // Tuesday
    3: [{ start: '11:00', end: '14:15' }, { start: '17:00', end: '23:00' }], // Wednesday
    4: [{ start: '11:00', end: '14:15' }, { start: '17:00', end: '23:00' }], // Thursday
    5: [{ start: '11:00', end: '14:15' }, { start: '17:00', end: '23:00' }], // Friday
    6: [{ start: '17:00', end: '22:15' }], // Saturday
    0: [{ start: '11:00', end: '14:15' }, { start: '17:00', end: '23:00' }]  // Sunday
};

export function useOpeningHours() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Update time every minute
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const isOpen = (): boolean => {
        const day = currentTime.getDay();
        const hours = String(currentTime.getHours()).padStart(2, '0');
        const minutes = String(currentTime.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${hours}:${minutes}`;

        const todayHours = openingHours[day];
        if (!todayHours || todayHours.length === 0) return false;

        return todayHours.some(period => {
            return currentTimeStr >= period.start && currentTimeStr <= period.end;
        });
    };

    const statusMessage = (): string => {
        const day = currentTime.getDay();
        const hours = String(currentTime.getHours()).padStart(2, '0');
        const minutes = String(currentTime.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${hours}:${minutes}`;

        const todayHours = openingHours[day];

        if (!todayHours || todayHours.length === 0) {
            return 'Heute geschlossen';
        }

        // Check if currently open
        for (const period of todayHours) {
            if (currentTimeStr >= period.start && currentTimeStr <= period.end) {
                return `Geöffnet bis ${period.end} Uhr`;
            }
        }

        // Check if will open later today
        for (const period of todayHours) {
            if (currentTimeStr < period.start) {
                return `Geschlossen - Öffnet um ${period.start} Uhr`;
            }
        }

        return 'Heute geschlossen';
    };

    return { isOpen: isOpen(), statusMessage: statusMessage() };
}
