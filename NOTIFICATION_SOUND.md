# Notification Sound Configuration

This document explains how to customize the notification sound that plays when new orders arrive in the admin dashboard.

## Overview

The notification sound uses the Web Audio API to generate three beeps with rising pitch to alert admins of new orders. The sound plays immediately when a new order arrives and repeats every 3 seconds until the admin confirms or declines the order.

## Environment Variables

You can customize the notification sound by adding these variables to your `.env` file:

```env
# Notification Sound Settings
VITE_NOTIFICATION_VOLUME_1=0.6    # First beep volume (0.0 - 1.0)
VITE_NOTIFICATION_VOLUME_2=0.6    # Second beep volume (0.0 - 1.0)
VITE_NOTIFICATION_VOLUME_3=0.7    # Third beep volume (0.0 - 1.0)
VITE_NOTIFICATION_FREQ_1=880      # First beep frequency in Hz (A5 note)
VITE_NOTIFICATION_FREQ_2=1046     # Second beep frequency in Hz (C6 note)
VITE_NOTIFICATION_FREQ_3=1318     # Third beep frequency in Hz (E6 note)
VITE_NOTIFICATION_TYPE=sine       # Wave type: sine, square, sawtooth, triangle
VITE_NOTIFICATION_INTERVAL=3000   # Repeat interval in milliseconds
```

## Default Values

If no environment variables are set, the system uses these defaults:

| Setting | Default | Description |
|---------|---------|-------------|
| Volume 1 | 0.6 | First beep volume (60%) |
| Volume 2 | 0.6 | Second beep volume (60%) |
| Volume 3 | 0.7 | Third beep volume (70%) |
| Frequency 1 | 880 Hz | A5 musical note |
| Frequency 2 | 1046 Hz | C6 musical note |
| Frequency 3 | 1318 Hz | E6 musical note |
| Wave Type | sine | Smooth, pleasant tone |
| Repeat Interval | 3000 ms | 3 seconds between repeats |

## Customization Guide

### Volume Settings (0.0 - 1.0)

- **0.0** - Silent
- **0.3** - Quiet
- **0.6** - Medium (default)
- **0.8** - Loud
- **1.0** - Maximum volume

**Recommendation:** Keep between 0.5 and 0.8 for comfortable listening.

### Frequency Settings (Hz)

Common musical notes you can use:

| Note | Frequency | Description |
|------|-----------|-------------|
| C5 | 523 Hz | Middle C |
| E5 | 659 Hz | Pleasant mid tone |
| G5 | 784 Hz | Harmonious |
| A5 | 880 Hz | Default first beep |
| C6 | 1046 Hz | Default second beep |
| E6 | 1318 Hz | Default third beep |
| G6 | 1568 Hz | Very high, urgent |

**Recommendation:** Use ascending frequencies (e.g., 800 → 1000 → 1200) for an alert-like sound.

### Wave Types

- **sine** (default) - Smooth, pleasant, musical tone
- **square** - Harsh, electronic, more alarming
- **sawtooth** - Buzzy, attention-grabbing
- **triangle** - Softer than square, warmer than sine

**Recommendation:** Use `sine` for pleasant notifications, `square` for urgent alerts.

### Repeat Interval

- **1000** - Every 1 second (very frequent)
- **3000** - Every 3 seconds (default, balanced)
- **5000** - Every 5 seconds (less intrusive)
- **10000** - Every 10 seconds (minimal)

**Recommendation:** 3-5 seconds is optimal for balance between alertness and annoyance.

## Example Configurations

### Loud and Urgent
```env
VITE_NOTIFICATION_VOLUME_1=0.9
VITE_NOTIFICATION_VOLUME_2=0.9
VITE_NOTIFICATION_VOLUME_3=1.0
VITE_NOTIFICATION_FREQ_1=1000
VITE_NOTIFICATION_FREQ_2=1200
VITE_NOTIFICATION_FREQ_3=1500
VITE_NOTIFICATION_TYPE=square
VITE_NOTIFICATION_INTERVAL=2000
```

### Soft and Pleasant
```env
VITE_NOTIFICATION_VOLUME_1=0.4
VITE_NOTIFICATION_VOLUME_2=0.4
VITE_NOTIFICATION_VOLUME_3=0.5
VITE_NOTIFICATION_FREQ_1=523
VITE_NOTIFICATION_FREQ_2=659
VITE_NOTIFICATION_FREQ_3=784
VITE_NOTIFICATION_TYPE=sine
VITE_NOTIFICATION_INTERVAL=5000
```

### Classic Alarm
```env
VITE_NOTIFICATION_VOLUME_1=0.7
VITE_NOTIFICATION_VOLUME_2=0.7
VITE_NOTIFICATION_VOLUME_3=0.8
VITE_NOTIFICATION_FREQ_1=800
VITE_NOTIFICATION_FREQ_2=800
VITE_NOTIFICATION_FREQ_3=800
VITE_NOTIFICATION_TYPE=square
VITE_NOTIFICATION_INTERVAL=1000
```

## Troubleshooting

### Sound Not Playing

1. **Check browser volume** - Ensure system and browser volume are not muted
2. **Browser permissions** - Some browsers require user interaction before playing audio
3. **Brave browser** - Has strict autoplay policies; may require clicking on the page first
4. **Console errors** - Check browser console for any audio-related errors

### Sound Too Quiet

1. Increase volume values in `.env` (try 0.8 - 1.0)
2. Check system volume settings
3. Try `square` wave type for louder sound

### Sound Too Annoying

1. Decrease volume values (try 0.3 - 0.5)
2. Increase repeat interval (try 5000 or 10000 ms)
3. Use `sine` wave type for smoother sound

## Technical Details

The notification sound is generated using the Web Audio API's `OscillatorNode` and `GainNode`. The sound consists of three sequential beeps with exponential volume decay for a natural sound envelope.

**Browser Support:**
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ⚠️ Brave (requires user interaction first)

## Stopping the Sound

The notification sound automatically stops when:
- Admin confirms the order
- Admin declines the order
- Order status changes to 'pending' or 'cancelled'
- Admin navigates away from the dashboard

## Notes

- Changes to `.env` require restarting the development server (`npm run dev`)
- Volume values above 0.8 may cause distortion on some systems
- Very high frequencies (>2000 Hz) may be uncomfortable for some users
- The sound plays through the system's default audio output device
