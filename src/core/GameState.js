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

        // Powerup progress orbs
        this.powerupProgress = 0; // Rings passed toward next powerup
        this.powerupOrbs = []; // Visual orbs spiraling inward
        this.powerupOrbsAngle = 0; // Current rotation angle for orbiting
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

    // Powerup progress orb system
    addPowerupOrb(color) {
        // Each orb starts at outer orbit and will spiral in
        this.powerupOrbs.push({
            angle: Math.random() * Math.PI * 2, // Random starting angle
            radius: GAME_CONFIG.POWERUP_ORB_ORBIT_RADIUS,
            targetRadius: 8, // Spirals close to center but not all the way
            color: color,
            speed: 0.02 + Math.random() * 0.02, // Slightly different speeds
            size: GAME_CONFIG.POWERUP_ORB_SIZE,
            displaySize: GAME_CONFIG.POWERUP_ORB_SIZE, // Initialize displaySize
            alpha: 1,
        });
        this.powerupProgress++;
    }

    updatePowerupOrbs() {
        this.powerupOrbsAngle += GAME_CONFIG.POWERUP_ORB_SPEED;

        const isReady = this.isPowerupReady();

        for (const orb of this.powerupOrbs) {
            // Orbit rotation - faster when ready
            orb.angle += isReady ? orb.speed * 2 : orb.speed;

            // Spiral inward toward target radius
            if (orb.radius > orb.targetRadius + 1) {
                orb.radius -= isReady ? 0.8 : 0.4;
            }

            // Pulse size - more dramatic when ready
            const pulseIntensity = isReady ? 3 : 1.5;
            orb.displaySize = orb.size + Math.sin(orb.angle * 3) * pulseIntensity;
        }
    }

    isPowerupReady() {
        return this.powerupProgress >= GAME_CONFIG.RINGS_FOR_POWERUP;
    }

    consumePowerupProgress() {
        this.powerupProgress = 0;
        this.powerupOrbs = [];
    }
}
