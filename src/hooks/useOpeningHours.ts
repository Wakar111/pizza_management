import { useState, useEffect } from 'react';
import { openingHoursService, type OpeningHour } from '../lib/supabase';

interface OpeningPeriod {
    start: string;
    end: string;
}

type OpeningHours = Record<number, OpeningPeriod[]>;

export function useOpeningHours() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [openingHours, setOpeningHours] = useState<OpeningHours>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch opening hours from database
        const fetchOpeningHours = async () => {
            try {
                const hours = await openingHoursService.getOpeningHours();
                const hoursMap: OpeningHours = {};

                // Group by day_of_week
                hours.forEach((hour: OpeningHour) => {
                    if (!hoursMap[hour.day_of_week]) {
                        hoursMap[hour.day_of_week] = [];
                    }

                    // Skip if closed
                    if (!hour.is_closed) {
                        hoursMap[hour.day_of_week].push({
                            start: hour.start_time.substring(0, 5), // HH:MM format
                            end: hour.end_time.substring(0, 5)
                        });
                    }
                });

                setOpeningHours(hoursMap);
            } catch (error) {
                console.error('Error fetching opening hours:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOpeningHours();
    }, []);

    useEffect(() => {
        // Update time every minute
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const isOpen = (): boolean => {
        if (loading) return false;

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
        if (loading) return 'Lädt...';

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

    return { isOpen: isOpen(), statusMessage: statusMessage(), loading, openingHours };
}
