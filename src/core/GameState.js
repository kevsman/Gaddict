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
        this.nextPatternChange = 15;

        // Combo system
        this.combo = 0;
        this.perfectStreak = 0;
        this.maxCombo = 0;
        this.multiplier = 1;

        // Powerup states
        this.activePowerups = {};
        this.hasShield = false;
        this.slowTimeActive = false;
        this.autoSizeActive = false;
        this.doublePointsActive = false;

        // Visual effects
        this.screenShake = 0;
        this.pulseEffect = 0;
        this.backgroundPulse = 0;
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
        this.difficulty = 1 + this.score * 0.12;
        this.ringSpeed = GAME_CONFIG.BASE_RING_SPEED + this.score * 0.06;
        this.ringSpawnInterval = Math.max(700, GAME_CONFIG.RING_SPAWN_INTERVAL_BASE - this.score * 25);

        // Pattern mode changes
        if (this.score >= this.nextPatternChange) {
            if (this.patternMode === 'normal') {
                this.patternMode = 'double';
                this.nextPatternChange = this.score + 15;
            } else if (this.patternMode === 'double') {
                this.patternMode = 'moving';
                this.nextPatternChange = this.score + 20;
            } else {
                this.patternMode = 'normal';
                this.nextPatternChange = this.score + 10;
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
}
