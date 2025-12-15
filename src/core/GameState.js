import { GAME_CONFIG, STORAGE_KEYS } from '../config/constants.js';

// Game State Management
export class GameState {
    constructor() {
        this.reset();
        this.loadSavedData();
    }

    reset() {
        // Core game state
        this.isPlaying = false;
        this.isHolding = false;
        this.score = 0;
        this.displayScore = 0;

        // Player state
        this.playerSize = 40;
        this.targetSize = 40;

        // Game objects
        this.rings = [];
        this.powerups = [];

        // Timing
        this.lastRingSpawn = 0;
        this.ringSpeed = GAME_CONFIG.BASE_RING_SPEED;
        this.ringSpawnInterval = GAME_CONFIG.RING_SPAWN_INTERVAL_BASE;

        // Difficulty
        this.difficulty = 1;
        this.patternMode = 'normal';
        this.nextPatternChange = 25; // First pattern change at score 25 (was 15)

        // Combo system
        this.combo = 0;
        this.perfectStreak = 0;
        this.maxCombo = 0;
        this.multiplier = 1;

        // Powerup states
        this.activePowerups = {};
        this.hasShield = false;
        this.slowTimeActive = false;
        this.tinyModeActive = false;
        this.doublePointsActive = false;
        this.magnetizeActive = false;
        this.ghostActive = false;

        // Visual effects
        this.screenShake = 0;
        this.pulseEffect = 0;
        this.backgroundPulse = 0;

        // Satisfaction pulse (when clearing rings)
        this.satisfactionPulse = 0; // Current pulse amount (0-1)
        this.satisfactionPulseType = 0; // 0 = normal, 1 = perfect, 2 = combo

        // Clearance reward (brief slowdown + pushback)
        this.clearanceSlowdown = 0; // Time remaining for slowdown effect
        this.clearancePushback = 0; // Amount to push rings back

        // Powerup progress system (integrated around player)
        this.powerupProgress = 0; // Rings passed toward next powerup (0 to max)
        this.nextPowerupType = this.pickNextPowerup(); // What powerup is coming
        this.powerupIconAngle = 0; // Orbiting icon angle
        this.powerupReady = false; // Flashes when ready to collect
    }

    pickNextPowerup() {
        const types = ['slowTime', 'shield', 'tinyMode', 'doublePoints', 'magnetize', 'ghost'];
        return types[Math.floor(Math.random() * types.length)];
    }

    loadSavedData() {
        this.highScore = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE)) || 0;
        this.unlockedThemes = JSON.parse(localStorage.getItem(STORAGE_KEYS.UNLOCKED_THEMES)) || ['default'];
        this.currentTheme = localStorage.getItem(STORAGE_KEYS.CURRENT_THEME) || 'default';

        // Validate current theme is unlocked
        if (!this.unlockedThemes.includes(this.currentTheme)) {
            this.currentTheme = 'default';
        }
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, this.highScore);
            return true;
        }
        return false;
    }

    unlockTheme(themeId) {
        if (!this.unlockedThemes.includes(themeId)) {
            this.unlockedThemes.push(themeId);
            localStorage.setItem(STORAGE_KEYS.UNLOCKED_THEMES, JSON.stringify(this.unlockedThemes));
            return true;
        }
        return false;
    }

    setTheme(themeId) {
        if (this.unlockedThemes.includes(themeId)) {
            this.currentTheme = themeId;
            localStorage.setItem(STORAGE_KEYS.CURRENT_THEME, themeId);
        }
    }

    cycleTheme() {
        const currentIndex = this.unlockedThemes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.unlockedThemes.length;
        this.setTheme(this.unlockedThemes[nextIndex]);
        return this.currentTheme;
    }

    updateDifficulty() {
        // More gradual difficulty scaling
        const scoreForDifficulty = Math.max(0, this.score - 5); // First 5 rings are easy

        this.difficulty = 1 + scoreForDifficulty * 0.08; // Slower difficulty ramp (was 0.12)
        this.ringSpeed = GAME_CONFIG.BASE_RING_SPEED + scoreForDifficulty * 0.04; // Slower speed increase (was 0.06)
        this.ringSpawnInterval = Math.max(800, GAME_CONFIG.RING_SPAWN_INTERVAL_BASE - scoreForDifficulty * 20); // Slower spawn rate increase

        // Pattern mode changes - delayed and more gradual
        if (this.score >= this.nextPatternChange) {
            if (this.patternMode === 'normal') {
                this.patternMode = 'double';
                this.nextPatternChange = this.score + 20; // Was 15
            } else if (this.patternMode === 'double') {
                this.patternMode = 'moving';
                this.nextPatternChange = this.score + 25; // Was 20
            } else {
                this.patternMode = 'normal';
                this.nextPatternChange = this.score + 15; // Was 10
            }
        }
    }

    addScore(points) {
        this.score += Math.floor(points * this.multiplier);
    }

    updateMultiplier() {
        this.multiplier = 1 + Math.floor(this.combo / 3) * 0.5;
        if (this.doublePointsActive) {
            this.multiplier *= 2;
        }
    }

    incrementCombo() {
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        this.perfectStreak++;
        this.updateMultiplier();
    }

    resetCombo() {
        this.combo = 0;
        this.perfectStreak = 0;
        this.multiplier = this.doublePointsActive ? 2 : 1;
    }

    // Satisfaction pulse system
    triggerPulse(type = 0) {
        // type: 0 = normal, 1 = perfect, 2 = combo
        this.satisfactionPulse = 1;
        this.satisfactionPulseType = type;
    }

    updatePulse() {
        if (this.satisfactionPulse > 0) {
            // Fast decay for snappy feel
            this.satisfactionPulse *= 0.85;
            if (this.satisfactionPulse < 0.01) {
                this.satisfactionPulse = 0;
            }
        }
    }

    getPulseScale() {
        if (this.satisfactionPulse <= 0) return 1;

        // Different pulse intensities based on type
        const intensity = this.satisfactionPulseType === 2 ? 0.25 : this.satisfactionPulseType === 1 ? 0.15 : 0.08;

        // Quick pop out then back - use easing for snappy feel
        const eased = Math.sin(this.satisfactionPulse * Math.PI);
        return 1 + eased * intensity;
    }

    // Clearance reward system - subtle ring pushback only
    triggerClearanceReward(isPerfect) {
        // Small pushback - gives a tiny bit of breathing room
        this.clearancePushback = isPerfect ? 10 : 6;
    }

    applyClearancePushback() {
        const pushback = this.clearancePushback;
        this.clearancePushback = 0;
        return pushback;
    }

    // Powerup progress system
    addPowerupProgress() {
        this.powerupProgress++;
        if (this.powerupProgress >= GAME_CONFIG.RINGS_FOR_POWERUP) {
            this.powerupReady = true;
        }
    }

    updatePowerupProgress() {
        // Animate the orbiting icon
        this.powerupIconAngle += this.powerupReady ? 0.08 : 0.03;
    }

    isPowerupReady() {
        return this.powerupProgress >= GAME_CONFIG.RINGS_FOR_POWERUP;
    }

    consumePowerupProgress() {
        this.powerupProgress = 0;
        this.powerupReady = false;
        this.nextPowerupType = this.pickNextPowerup();
    }

    getPowerupProgressPercent() {
        return Math.min(1, this.powerupProgress / GAME_CONFIG.RINGS_FOR_POWERUP);
    }
}
