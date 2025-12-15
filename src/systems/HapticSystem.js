// Haptic Feedback System - Vibration API wrapper
export class HapticSystem {
    constructor() {
        this.enabled = 'vibrate' in navigator;
    }

    light() {
        if (this.enabled) navigator.vibrate(10);
    }

    medium() {
        if (this.enabled) navigator.vibrate(25);
    }

    heavy() {
        if (this.enabled) navigator.vibrate([50, 30, 50]);
    }

    success() {
        if (this.enabled) navigator.vibrate([10, 50, 20]);
    }

    death() {
        if (this.enabled) navigator.vibrate([100, 50, 100, 50, 150]);
    }
}

// Singleton instance
export const haptic = new HapticSystem();
