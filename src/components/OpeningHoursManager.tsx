import { useState, useEffect } from 'react';
import { openingHoursService, type OpeningHour, type OpeningPeriod } from '../lib/supabase';

interface DayHours {
    isClosed: boolean;
    periods: OpeningPeriod[];
}

const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

interface OpeningHoursManagerProps {
    onSave: (message: string, type: 'success' | 'error') => void;
}

export default function OpeningHoursManager({ onSave }: OpeningHoursManagerProps) {
    const [hours, setHours] = useState<Record<number, DayHours>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadHours();
    }, []);

    const loadHours = async () => {
        try {
            setLoading(true);
            const data = await openingHoursService.getOpeningHours();

            //Initialize all days
            const hoursMap: Record<number, DayHours> = {};
            for (let i = 0; i <= 6; i++) {
                hoursMap[i] = { isClosed: false, periods: [] };
            }

            // Group by day
            data.forEach((hour: OpeningHour) => {
                if (hour.is_closed) {
                    hoursMap[hour.day_of_week].isClosed = true;
                } else {
                    hoursMap[hour.day_of_week].periods.push({
                        start: hour.start_time.substring(0, 5),
                        end: hour.end_time.substring(0, 5)
                    });
                }
            });

            setHours(hoursMap);
        } catch (error) {
            console.error('Error loading opening hours:', error);
            onSave('Fehler beim Laden der Öffnungszeiten', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleClosed = (day: number) => {
        setHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                isClosed: !prev[day].isClosed
            }
        }));
    };

    const handlePeriodChange = (day: number, periodIndex: number, field: 'start' | 'end', value: string) => {
        setHours(prev => {
            const newPeriods = [...prev[day].periods];
            newPeriods[periodIndex] = {
                ...newPeriods[periodIndex],
                [field]: value
            };
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    periods: newPeriods
                }
            };
        });
    };

    const handleAddPeriod = (day: number) => {
        if (hours[day].periods.length >= 2) {
            onSave('Maximal 2 Zeiträume pro Tag erlaubt', 'error');
            return;
        }
        setHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                periods: [...prev[day].periods, { start: '11:00', end: '14:00' }]
            }
        }));
    };

    const handleRemovePeriod = (day: number, periodIndex: number) => {
        setHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                periods: prev[day].periods.filter((_, i) => i !== periodIndex)
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await openingHoursService.updateAllHours(hours);
            onSave('Öffnungszeiten erfolgreich gespeichert', 'success');
        } catch (error) {
            console.error('Error saving opening hours:', error);
            onSave('Fehler beim Speichern der Öffnungszeiten', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="py-8 text-center text-gray-500">Lädt...</div>;
    }

    return (
        <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6, 0].map(day => (
                <div key={day} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{DAY_NAMES[(day + 6) % 7]}</h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hours[day]?.isClosed || false}
                                onChange={() => handleToggleClosed(day)}
                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Geschlossen</span>
                        </label>
                    </div>

                    {!hours[day]?.isClosed && (
                        <div className="space-y-2">
                            {hours[day]?.periods.map((period, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={period.start}
                                        onChange={(e) => handlePeriodChange(day, index, 'start', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <span className="text-gray-500">—</span>
                                    <input
                                        type="time"
                                        value={period.end}
                                        onChange={(e) => handlePeriodChange(day, index, 'end', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    {hours[day]?.periods.length > 1 && (
                                        <button
                                            onClick={() => handleRemovePeriod(day, index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            {hours[day]?.periods.length < 2 && (
                                <button
                                    onClick={() => handleAddPeriod(day)}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Zeitraum hinzufügen
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-2 py-1 md:px-6 md:py-2 bg-gradient-to-r from-primary-500 to-primary-500 hover:from-primary-600 hover:to-primary-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-semibold transition-all shadow-md disabled:cursor-not-allowed"
                >
                    {saving ? 'Speichert...' : 'Öffnungszeiten speichern'}
                </button>
            </div>
        </div>
    );
}
