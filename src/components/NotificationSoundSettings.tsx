import { useState, useEffect } from 'react';

interface NotificationSettings {
    volume1: number;
    volume2: number;
    volume3: number;
    freq1: number;
    freq2: number;
    freq3: number;
    waveType: 'sine' | 'square' | 'sawtooth' | 'triangle';
    interval: number;
}

interface NotificationSoundSettingsProps {
    onSave: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function NotificationSoundSettings({ onSave }: NotificationSoundSettingsProps) {
    const [settings, setSettings] = useState<NotificationSettings>(() => {
        // Load from localStorage
        try {
            const saved = localStorage.getItem('notification_sound_settings');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (err) {
            console.error('Error loading notification settings:', err);
        }
        return {
            volume1: 0.6,
            volume2: 0.6,
            volume3: 0.7,
            freq1: 880,
            freq2: 1046,
            freq3: 1318,
            waveType: 'sine',
            interval: 3000
        };
    });

    const [originalSettings, setOriginalSettings] = useState<NotificationSettings>(settings);

    useEffect(() => {
        setOriginalSettings(settings);
    }, []);

    const hasChanges = () => {
        return JSON.stringify(settings) !== JSON.stringify(originalSettings);
    };

    const handleSave = () => {
        try {
            localStorage.setItem('notification_sound_settings', JSON.stringify(settings));
            setOriginalSettings(settings);
            onSave('🔊 Benachrichtigungseinstellungen gespeichert!', 'success');
        } catch (err) {
            console.error('Error saving notification settings:', err);
            onSave('Fehler beim Speichern der Benachrichtigungseinstellungen', 'error');
        }
    };

    const handleReset = () => {
        setSettings(originalSettings);
    };

    const handleTestSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // First beep
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = settings.freq1;
            oscillator.type = settings.waveType;
            gainNode.gain.setValueAtTime(settings.volume1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            
            // Second beep
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            oscillator2.frequency.value = settings.freq2;
            oscillator2.type = settings.waveType;
            gainNode2.gain.setValueAtTime(settings.volume2, audioContext.currentTime + 0.2);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
            oscillator2.start(audioContext.currentTime + 0.2);
            oscillator2.stop(audioContext.currentTime + 0.35);
            
            // Third beep
            const oscillator3 = audioContext.createOscillator();
            const gainNode3 = audioContext.createGain();
            oscillator3.connect(gainNode3);
            gainNode3.connect(audioContext.destination);
            oscillator3.frequency.value = settings.freq3;
            oscillator3.type = settings.waveType;
            gainNode3.gain.setValueAtTime(settings.volume3, audioContext.currentTime + 0.4);
            gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
            oscillator3.start(audioContext.currentTime + 0.4);
            oscillator3.stop(audioContext.currentTime + 0.6);
            
            onSave('🔊 Testton abgespielt', 'info');
        } catch (e) {
            console.error('Audio play failed:', e);
            onSave('Fehler beim Abspielen des Testtons', 'error');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">🔔 Benachrichtigungston</h2>
                    <p className="text-sm text-gray-500 mt-1">Passen Sie den Ton für neue Bestellungen an</p>
                </div>
                <button
                    onClick={handleTestSound}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                    🔊 Test
                </button>
            </div>

            <div className="space-y-6">
                {/* Volume Settings */}
                <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Lautstärke (0.0 - 1.0)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Erster Ton
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.volume1}
                                onChange={(e) => setSettings({ ...settings, volume1: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Zweiter Ton
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.volume2}
                                onChange={(e) => setSettings({ ...settings, volume2: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dritter Ton
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.volume3}
                                onChange={(e) => setSettings({ ...settings, volume3: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Frequency Settings */}
                <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Frequenz (Hz)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Erster Ton (Hz)
                            </label>
                            <input
                                type="number"
                                min="200"
                                max="2000"
                                step="50"
                                value={settings.freq1}
                                onChange={(e) => setSettings({ ...settings, freq1: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Standard: 880 Hz (A5)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Zweiter Ton (Hz)
                            </label>
                            <input
                                type="number"
                                min="200"
                                max="2000"
                                step="50"
                                value={settings.freq2}
                                onChange={(e) => setSettings({ ...settings, freq2: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Standard: 1046 Hz (C6)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dritter Ton (Hz)
                            </label>
                            <input
                                type="number"
                                min="200"
                                max="2000"
                                step="50"
                                value={settings.freq3}
                                onChange={(e) => setSettings({ ...settings, freq3: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Standard: 1318 Hz (E6)</p>
                        </div>
                    </div>
                </div>

                {/* Wave Type */}
                <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Wellenform</h3>
                    <select
                        value={settings.waveType}
                        onChange={(e) => setSettings({ ...settings, waveType: e.target.value as any })}
                        className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="sine">Sinus (Weich, angenehm)</option>
                        <option value="square">Rechteck (Scharf, alarmierend)</option>
                        <option value="sawtooth">Sägezahn (Summend)</option>
                        <option value="triangle">Dreieck (Weicher als Rechteck)</option>
                    </select>
                </div>

                {/* Repeat Interval */}
                <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Wiederholungsintervall</h3>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            min="1000"
                            max="10000"
                            step="1000"
                            value={settings.interval}
                            onChange={(e) => setSettings({ ...settings, interval: parseInt(e.target.value) })}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-sm text-gray-600">Millisekunden ({(settings.interval / 1000).toFixed(1)}s)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Zeit zwischen Wiederholungen des Tons</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={handleReset}
                        disabled={!hasChanges()}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Zurücksetzen
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges()}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Speichern
                    </button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Hinweis:</strong> Diese Einstellungen werden lokal in Ihrem Browser gespeichert. 
                        Der Ton wird nur auf diesem Gerät angepasst.
                    </p>
                </div>
            </div>
        </div>
    );
}
