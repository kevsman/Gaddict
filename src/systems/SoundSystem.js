// Sound System - Web Audio API based sound effects
export class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.log('Audio not supported');
            this.enabled = false;
        }
    }

    play(type) {
        if (!this.enabled || !this.audioContext) return;

        switch (type) {
            case 'pass':
                this.playTone(440, 0.1, 'sine', 0.3);
                this.playTone(554, 0.1, 'sine', 0.3, 0.05);
                break;
            case 'perfect':
                this.playTone(523, 0.15, 'sine', 0.4);
                this.playTone(659, 0.15, 'sine', 0.4, 0.08);
                this.playTone(784, 0.15, 'sine', 0.4, 0.16);
                break;
            case 'combo':
                this.playTone(698, 0.2, 'sine', 0.5);
                this.playTone(880, 0.2, 'sine', 0.5, 0.1);
                break;
            case 'powerup':
                this.playTone(392, 0.15, 'square', 0.2);
                this.playTone(523, 0.15, 'square', 0.2, 0.1);
                this.playTone(659, 0.15, 'square', 0.2, 0.2);
                this.playTone(784, 0.2, 'square', 0.3, 0.3);
                break;
            case 'death':
                this.playTone(200, 0.3, 'sawtooth', 0.4);
                this.playTone(150, 0.3, 'sawtooth', 0.3, 0.1);
                this.playTone(100, 0.4, 'sawtooth', 0.2, 0.2);
                break;
            case 'whoosh':
                this.playNoise(0.1, 0.15);
                break;
            case 'unlock':
                this.playTone(523, 0.2, 'sine', 0.4);
                this.playTone(659, 0.2, 'sine', 0.4, 0.15);
                this.playTone(784, 0.2, 'sine', 0.4, 0.3);
                this.playTone(1047, 0.3, 'sine', 0.5, 0.45);
                break;
            case 'shield':
                this.playTone(300, 0.2, 'triangle', 0.3);
                break;
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3, delay = 0) {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

        gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

        oscillator.start(ctx.currentTime + delay);
        oscillator.stop(ctx.currentTime + delay + duration);
    }

    playNoise(duration, volume = 0.2) {
        const ctx = this.audioContext;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        noise.start();
        noise.stop(ctx.currentTime + duration);
    }
}

// Singleton instance
export const sound = new SoundSystem();
