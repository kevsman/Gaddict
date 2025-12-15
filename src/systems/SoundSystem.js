// Sound System - Web Audio API based sound effects
export class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initialized = false;

        // Music System
        this.musicPlaying = false;
        this.currentCombo = 0;
        this.nextNoteTime = 0;
        this.beatCount = 0;
        this.musicTimer = null;
        this.bpm = 120;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            this.startMusic();
        } catch (e) {
            console.log('Audio not supported');
            this.enabled = false;
        }
    }

    startMusic() {
        if (!this.enabled || !this.audioContext) return;
        if (this.musicPlaying) return;

        this.musicPlaying = true;
        this.nextNoteTime = this.audioContext.currentTime + 0.1;
        this.beatCount = 0;
        this.scheduleMusic();
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicTimer) clearTimeout(this.musicTimer);
    }

    updateMusic(combo) {
        this.currentCombo = combo;
    }

    scheduleMusic() {
        if (!this.musicPlaying || !this.audioContext) return;

        const secondsPerBeat = 60.0 / this.bpm;
        const lookahead = 25.0; // ms
        const scheduleAheadTime = 0.1; // sec

        while (this.nextNoteTime < this.audioContext.currentTime + scheduleAheadTime) {
            this.playMusicLayer(this.nextNoteTime, this.beatCount);
            this.nextNoteTime += secondsPerBeat / 4; // 16th notes resolution
            this.beatCount++;
        }

        this.musicTimer = setTimeout(() => this.scheduleMusic(), lookahead);
    }

    playMusicLayer(time, beat) {
        // Calculate relative time for scheduling
        const t = time - this.audioContext.currentTime;
        if (t < 0) return; // Don't play in the past

        const measureBeat = beat % 16; // 0-15 (16th notes in a 4/4 measure)
        const quarterBeat = beat % 4; // 0-3

        // Layer 1: Bass (Always active, gets more complex)
        // Simple pulse on every beat
        if (quarterBeat === 0) {
            this.playTone(110, 0.1, 'triangle', 0.15, t);
        }
        // Off-beat bass at higher combos
        if (this.currentCombo >= 5 && quarterBeat === 2) {
            this.playTone(110, 0.1, 'triangle', 0.1, t);
        }

        // Layer 2: Drums (Combo > 10)
        if (this.currentCombo >= 10) {
            // Hi-hats every 8th note
            if (beat % 2 === 0) {
                this.playNoise(0.03, 0.05, t);
            }
            // Snare on 2 and 4 (quarter beats 4 and 12 in 16th grid)
            if (measureBeat === 4 || measureBeat === 12) {
                this.playNoise(0.1, 0.15, t);
            }
        }

        // Layer 3: Melody (Combo > 20)
        if (this.currentCombo >= 20) {
            // Simple arpeggio
            const notes = [440, 554, 659, 880]; // A Major
            if (beat % 2 === 0) {
                const noteIdx = (beat / 2) % 4;
                this.playTone(notes[noteIdx], 0.1, 'sine', 0.1, t);
            }
        }

        // Layer 4: High Energy (Combo > 30)
        if (this.currentCombo >= 30) {
            // Fast 16th note pulses
            if (beat % 2 !== 0) {
                this.playTone(1760, 0.05, 'square', 0.05, t);
            }
        }
    }

    play(type, pitchScale = 1.0) {
        if (!this.enabled || !this.audioContext) return;

        // Clamp pitch scale to avoid ear-piercing sounds
        const p = Math.min(Math.max(pitchScale, 0.5), 2.0);

        switch (type) {
            case 'pass':
                this.playTone(440 * p, 0.1, 'sine', 0.3);
                this.playTone(554 * p, 0.1, 'sine', 0.3, 0.05);
                break;
            case 'perfect':
                this.playTone(523 * p, 0.15, 'sine', 0.4);
                this.playTone(659 * p, 0.15, 'sine', 0.4, 0.08);
                this.playTone(784 * p, 0.15, 'sine', 0.4, 0.16);
                break;
            case 'combo':
                this.playTone(698 * p, 0.2, 'sine', 0.5);
                this.playTone(880 * p, 0.2, 'sine', 0.5, 0.1);
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

    playNoise(duration, volume = 0.2, delay = 0) {
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

        gainNode.gain.setValueAtTime(volume, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

        noise.start(ctx.currentTime + delay);
        noise.stop(ctx.currentTime + delay + duration);
    }
}

// Singleton instance
export const sound = new SoundSystem();
