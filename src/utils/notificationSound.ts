/**
 * Notification Sound Utility
 * Plays a three-beep notification sound using Web Audio API
 */

export interface NotificationSoundSettings {
  volume1?: number;
  volume2?: number;
  volume3?: number;
  freq1?: number;
  freq2?: number;
  freq3?: number;
  waveType?: OscillatorType;
}

const DEFAULT_SETTINGS: Required<NotificationSoundSettings> = {
  volume1: 0.6,
  volume2: 0.6,
  volume3: 0.7,
  freq1: 880,
  freq2: 1046,
  freq3: 1318,
  waveType: 'sine'
};

/**
 * Get notification sound settings from localStorage with fallback to defaults
 */
function getSettings(): Required<NotificationSoundSettings> {
  try {
    const saved = localStorage.getItem('notification_sound_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      return {
        volume1: settings.volume1 ?? DEFAULT_SETTINGS.volume1,
        volume2: settings.volume2 ?? DEFAULT_SETTINGS.volume2,
        volume3: settings.volume3 ?? DEFAULT_SETTINGS.volume3,
        freq1: settings.freq1 ?? DEFAULT_SETTINGS.freq1,
        freq2: settings.freq2 ?? DEFAULT_SETTINGS.freq2,
        freq3: settings.freq3 ?? DEFAULT_SETTINGS.freq3,
        waveType: settings.waveType ?? DEFAULT_SETTINGS.waveType
      };
    }
  } catch (e) {
    console.log('Using default notification settings');
  }
  return DEFAULT_SETTINGS;
}

/**
 * Play a three-beep notification sound
 */
export function playNotificationSound(): void {
  try {
    const settings = getSettings();
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
    
    console.log('🔊 Notification sound played');
  } catch (e) {
    console.log('Audio play failed:', e);
  }
}
