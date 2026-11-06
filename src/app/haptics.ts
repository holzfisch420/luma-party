/**
 * Haptisches Feedback für Handy-Controller.
 *
 * - Android (und andere Browser mit Vibration API): echte Vibrationsmuster.
 * - iPhone (Safari ab iOS 18): Safari unterstützt `navigator.vibrate` nicht. Beim Umschalten
 *   eines `<input type="checkbox" switch>` löst Safari aber einen kurzen haptischen Klick aus.
 *   Diesen Klick nutzen wir – für stärkere Rückmeldungen mehrfach kurz hintereinander.
 *   Zuverlässig funktioniert das bei Berührungen (Tastendruck); bei Ereignissen ohne
 *   Berührung (z. B. „getroffen“) kann iOS den Klick unterdrücken.
 *
 * Kann pro Gerät abgeschaltet werden (localStorage).
 */

export type HapticKind =
  | 'tick' // sehr kurz (Joystick-Rand, Countdown)
  | 'light' // leichte Taste
  | 'medium' // Haupttaste (Feuer)
  | 'heavy' // Power-up einsetzen, Schild getroffen
  | 'success' // etwas eingesammelt
  | 'double' // Gegner erwischt
  | 'error'; // selbst zerstört

const STORAGE_KEY = 'luma.haptics';

/** Vibrationsmuster in Millisekunden (Android) */
const PATTERNS: Record<HapticKind, number | number[]> = {
  tick: 6,
  light: 12,
  medium: 22,
  heavy: [35, 25, 35],
  success: [18, 60, 30],
  double: [25, 50, 25],
  error: [90, 50, 160, 50, 60],
};

/** Anzahl kurzer Klicks auf dem iPhone */
const IOS_TAPS: Record<HapticKind, number> = { tick: 1, light: 1, medium: 1, heavy: 2, success: 2, double: 2, error: 3 };

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document);
const hasVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

let enabled = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
})();

/** Ein haptischer Klick über den Safari-Schalter-Trick */
function iosTap() {
  try {
    const label = document.createElement('label');
    label.ariaHidden = 'true';
    label.style.display = 'none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    label.appendChild(input);
    document.head.appendChild(label);
    label.click();
    document.head.removeChild(label);
  } catch {
    /* ignorieren */
  }
}

export const haptics = {
  /** Wird auf diesem Gerät irgendeine Form von Haptik unterstützt? */
  supported: hasVibrate || isIOS,
  /** 'vibrate' = echte Vibration, 'ios' = Safari-Klick, 'none' */
  mode: (hasVibrate ? 'vibrate' : isIOS ? 'ios' : 'none') as 'vibrate' | 'ios' | 'none',

  play(kind: HapticKind) {
    if (!enabled) return;
    if (hasVibrate) {
      try {
        navigator.vibrate(PATTERNS[kind]);
      } catch {
        /* ignorieren */
      }
      return;
    }
    if (isIOS) {
      const n = IOS_TAPS[kind];
      iosTap();
      for (let i = 1; i < n; i++) setTimeout(iosTap, i * 70);
    }
  },

  isEnabled: () => enabled,
  setEnabled(on: boolean) {
    enabled = on;
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      /* ignorieren */
    }
    if (on) haptics.play('medium');
  },
};
