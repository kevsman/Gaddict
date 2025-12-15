import { GAME_CONFIG } from '../config/constants.js';
import { THEMES } from '../config/themes.js';
import { POWERUP_TYPES } from '../config/powerups.js';
import { GameState } from './GameState.js';
import { InputHandler } from './InputHandler.js';
import { UIManager } from './UIManager.js';
import { Renderer } from '../rendering/Renderer.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { sound } from '../systems/SoundSystem.js';
import { haptic } from '../systems/HapticSystem.js';
import { createRing } from '../entities/Ring.js';
import { Powerup } from '../entities/Powerup.js';

// Main Game Class
export class Game {
    constructor(canvas) {
        this.state = new GameState();
        this.ui = new UIManager();
        this.renderer = new Renderer(canvas);
        this.particles = new ParticleSystem();

        this.input = new InputHandler(
            canvas,
            () => this.onHoldStart(),
            () => this.onHoldEnd(),
            () => this.onThemeKey()
        );

        this.lastTime = 0;
        this.godMode = false; // Debug: auto-clear rings

        // Camera effects
        this.screenShake = 0;
        this.cameraZoom = 1;

        // Debug key listener
        window.addEventListener('keydown', (e) => {
            if (e.key === 'g' || e.key === 'G') {
                this.godMode = !this.godMode;
                console.log(`[DEBUG] God mode: ${this.godMode ? 'ON' : 'OFF'}`);
            }
        });

        this.init();
    }

    init() {
        this.ui.updateHighScore(this.state.highScore);
        document.body.style.background = this.getColors().background;

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    getColors() {
        return THEMES[this.state.currentTheme] || THEMES.default;
    }

    onHoldStart() {
        sound.init();
        this.state.isHolding = true;
        if (!this.state.isPlaying) {
            this.startGame();
        }
    }

    onHoldEnd() {
        this.state.isHolding = false;
    }

    onThemeKey() {
        if (!this.state.isPlaying) {
            this.state.cycleTheme();
            document.body.style.background = this.getColors().background;
        }
    }

    startGame() {
        const previousScore = this.state.score; // Save for endowed progress
        this.state.reset();
        this.state.loadSavedData();
        this.state.isPlaying = true;
        this.state.lastRingSpawn = Date.now() - this.state.ringSpawnInterval;
        this.state.waveStartTime = Date.now(); // Initialize sawtooth difficulty
        this.particles.clear();

        // Endowed Progress - start with some powerup progress if previous run was good
        this.state.applyEndowedProgress(previousScore);

        this.ui.showMessage(false);
        this.ui.hideGameOver();
        this.ui.updateMultiplier(1, false);
        this.ui.updatePowerupIndicator({}, false, POWERUP_TYPES);

        sound.startMusic();
        this.spawnRing();
    }

    gameOver() {
        this.state.isPlaying = false;
        this.screenShake = 20; // Heavy shake
        this.state.triggerHitStop(); // Hit stop for impact
        this.renderer.triggerChromaticAberration(1.0); // Full chromatic aberration on death

        sound.play('death');
        sound.stopMusic();
        haptic.death();

        const isNewHighScore = this.state.saveHighScore();
        this.ui.updateHighScore(this.state.highScore);

        // Explosion particles
        this.particles.burst(this.renderer.centerX, this.renderer.centerY, this.getColors().ringFail, 40, {
            minSpeed: 3,
            maxSpeed: 9,
            minSize: 3,
            maxSize: 9,
        });

        // Calculate distance to next unlock for Zeigarnik Effect
        const nextUnlock = this.getNextThemeUnlock();

        setTimeout(() => {
            if (!this.state.isPlaying) {
                this.ui.showGameOver(this.state.score, this.state.highScore, isNewHighScore, nextUnlock);
            }
        }, 500);
    }

    // Zeigarnik Effect - find the next theme unlock
    getNextThemeUnlock() {
        for (const [themeId, theme] of Object.entries(THEMES)) {
            if (!this.state.unlockedThemes.includes(themeId) && theme.unlockScore > this.state.score) {
                return {
                    name: theme.name,
                    score: theme.unlockScore,
                    pointsAway: theme.unlockScore - this.state.score
                };
            }
        }
        return null;
    }

    spawnRing() {
        const colors = this.getColors();
        const ring = createRing(this.renderer.getScreenSize(), this.state.difficulty, this.state.patternMode, colors.ring);
        this.state.rings.push(ring);
    }

    spawnPowerupFromProgress() {
        // Called when progress is full - spawn the previewed powerup type
        const powerup = new Powerup(this.renderer.getScreenSize(), this.state.nextPowerupType);
        this.state.powerups.push(powerup);
        this.state.consumePowerupProgress();

        // Visual feedback - show the powerup name!
        sound.play('combo');
        haptic.medium();
        const powerupInfo = POWERUP_TYPES[powerup.type];
        this.ui.showComboPopup(powerupInfo.icon + ' ' + powerupInfo.name + ' INCOMING!');

        // Burst particles at the icon location
        this.particles.burst(this.renderer.width - 60, 80, '#ffd700', 15, {
            minSpeed: 2,
            maxSpeed: 6,
            minSize: 3,
            maxSize: 7,
        });
    }

    onRingPassed(isPerfect) {
        // Add progress toward powerup (only after score > 3 to let player get started)
        if (this.state.score > 3) {
            this.state.addPowerupProgress();

            // Check if powerup should spawn
            if (this.state.isPowerupReady()) {
                this.spawnPowerupFromProgress();
            }
        }
    }

    activatePowerup(type) {
        const powerupInfo = POWERUP_TYPES[type];

        sound.play('powerup');
        haptic.success();
        
        // Chromatic aberration on powerup activation
        this.renderer.triggerChromaticAberration(0.6);

        // Exciting activation messages for each powerup
        const activationMessages = {
            slowTime: ['⏱️ TIME SLOWED!', '⏱️ MATRIX MODE!', '⏱️ SLOW-MO!'],
            shield: ['🛡️ PROTECTED!', '🛡️ SHIELD UP!', '🛡️ ARMOR ON!'],
            ghost: ['👻 GHOST MODE!', '👻 PHASING!', '👻 UNTOUCHABLE!'],
            freeze: ['❄️ FROZEN!', '❄️ TIME STOP!', '❄️ ICE AGE!'],
            tinyMode: ['🔬 TINY MODE!', '🔬 SHRINK RAY!', '🔬 MINI ME!'],
            giantMode: ['🦖 GIANT MODE!', '🦖 MEGA SIZE!', '🦖 HULK SMASH!'],
            doublePoints: ['⭐ 2X POINTS!', '⭐ DOUBLE UP!', '⭐ BONUS MODE!'],
            triplePoints: ['💎 3X POINTS!', '💎 TRIPLE THREAT!', '💎 JACKPOT!'],
            perfectStreak: ['✨ PERFECTION!', '✨ FLAWLESS!', '✨ GOLDEN TOUCH!'],
            comboKeeper: ['🔒 COMBO LOCKED!', '🔒 UNBREAKABLE!', '🔒 SECURED!'],
            magnetize: ['🧲 MAGNETIZED!', '🧲 ATTRACTION!', '🧲 PULL POWER!'],
            wideGap: ['🚪 WIDE OPEN!', '🚪 EASY MODE!', '🚪 BIG GAPS!'],
            clearRings: ['💥 BOOM!', '💥 CLEARED!', '💥 OBLITERATED!'],
            extraLife: ['❤️ LIFE BANKED!', '❤️ EXTRA LIFE!', '❤️ SAVED!'],
            reverseRings: ['🔄 REVERSED!', '🔄 REWIND!', '🔄 FLIP IT!'],
            rainbow: ['🌈 RAINBOW!', '🌈 DISCO TIME!', '🌈 PARTY MODE!'],
        };
        const messages = activationMessages[type] || [powerupInfo.icon + ' ' + powerupInfo.name];
        const message = messages[Math.floor(Math.random() * messages.length)];
        this.ui.showComboPopup(message, powerupInfo.description);

        // Trigger a satisfaction pulse for the powerup
        this.state.triggerPulse(2);

        switch (type) {
            // DEFENSIVE
            case 'slowTime':
                this.state.slowTimeActive = true;
                this.state.activePowerups.slowTime = Date.now() + powerupInfo.duration;
                break;
            case 'shield':
                this.state.hasShield = true;
                sound.play('shield');
                break;
            case 'ghost':
                this.state.ghostActive = true;
                this.state.activePowerups.ghost = Date.now() + powerupInfo.duration;
                break;
            case 'freeze':
                this.state.freezeActive = true;
                this.state.activePowerups.freeze = Date.now() + powerupInfo.duration;
                break;

            // SIZE
            case 'tinyMode':
                this.state.tinyModeActive = true;
                this.state.giantModeActive = false; // Cancel giant if active
                this.state.activePowerups.tinyMode = Date.now() + powerupInfo.duration;
                delete this.state.activePowerups.giantMode;
                break;
            case 'giantMode':
                this.state.giantModeActive = true;
                this.state.tinyModeActive = false; // Cancel tiny if active
                this.state.activePowerups.giantMode = Date.now() + powerupInfo.duration;
                delete this.state.activePowerups.tinyMode;
                break;

            // SCORING
            case 'doublePoints':
                this.state.doublePointsActive = true;
                this.state.activePowerups.doublePoints = Date.now() + powerupInfo.duration;
                break;
            case 'triplePoints':
                this.state.triplePointsActive = true;
                this.state.doublePointsActive = false; // Triple overrides double
                this.state.activePowerups.triplePoints = Date.now() + powerupInfo.duration;
                delete this.state.activePowerups.doublePoints;
                break;
            case 'perfectStreak':
                this.state.perfectStreakActive = true;
                this.state.activePowerups.perfectStreak = Date.now() + powerupInfo.duration;
                break;
            case 'comboKeeper':
                this.state.comboKeeperActive = true;
                this.state.activePowerups.comboKeeper = Date.now() + powerupInfo.duration;
                break;

            // ASSIST
            case 'magnetize':
                this.state.magnetizeActive = true;
                this.state.activePowerups.magnetize = Date.now() + powerupInfo.duration;
                break;
            case 'wideGap':
                this.state.wideGapActive = true;
                this.state.activePowerups.wideGap = Date.now() + powerupInfo.duration;
                break;

            // SPECIAL (instant effects)
            case 'clearRings':
                // Clear all rings on screen!
                this.screenShake = 15;
                for (const ring of this.state.rings) {
                    if (!ring.passed) {
                        ring.markPassed('#ff4444');
                        this.particles.ring(this.renderer.centerX, this.renderer.centerY, ring.radius, '#ff4444', 8);
                    }
                }
                this.state.rings = [];
                break;
            case 'extraLife':
                if (this.state.hasShield) {
                    this.state.extraLifeStored = true; // Bank it for later
                } else {
                    this.state.hasShield = true; // Use it now
                }
                break;
            case 'reverseRings':
                this.state.reverseRingsActive = true;
                this.state.activePowerups.reverseRings = Date.now() + powerupInfo.duration;
                break;
            case 'rainbow':
                this.state.rainbowActive = true;
                this.state.activePowerups.rainbow = Date.now() + powerupInfo.duration;
                break;
        }

        this.ui.updatePowerupIndicator(this.state.activePowerups, this.state.hasShield, POWERUP_TYPES);

        // Big celebration particles
        this.particles.burst(this.renderer.centerX, this.renderer.centerY, powerupInfo.color, 35, {
            minSpeed: 3,
            maxSpeed: 8,
            minSize: 4,
            maxSize: 10,
        });

        // Extra white sparkle burst
        this.particles.burst(this.renderer.centerX, this.renderer.centerY, '#ffffff', 15, {
            minSpeed: 4,
            maxSpeed: 10,
            minSize: 2,
            maxSize: 5,
        });
    }

    updatePowerups() {
        const now = Date.now();

        // Check each timed powerup for expiration
        const timedPowerups = [
            { key: 'slowTime', state: 'slowTimeActive' },
            { key: 'freeze', state: 'freezeActive' },
            { key: 'ghost', state: 'ghostActive' },
            { key: 'tinyMode', state: 'tinyModeActive' },
            { key: 'giantMode', state: 'giantModeActive' },
            { key: 'doublePoints', state: 'doublePointsActive' },
            { key: 'triplePoints', state: 'triplePointsActive' },
            { key: 'perfectStreak', state: 'perfectStreakActive' },
            { key: 'comboKeeper', state: 'comboKeeperActive' },
            { key: 'magnetize', state: 'magnetizeActive' },
            { key: 'wideGap', state: 'wideGapActive' },
            { key: 'reverseRings', state: 'reverseRingsActive' },
            { key: 'rainbow', state: 'rainbowActive' },
        ];

        for (const powerup of timedPowerups) {
            if (this.state.activePowerups[powerup.key] && now > this.state.activePowerups[powerup.key]) {
                this.state[powerup.state] = false;
                delete this.state.activePowerups[powerup.key];
            }
        }

        // Check if stored extra life should become active shield
        if (this.state.extraLifeStored && !this.state.hasShield) {
            this.state.extraLifeStored = false;
            this.state.hasShield = true;
            this.ui.showComboPopup('❤️ EXTRA LIFE ACTIVATED!');
        }

        this.ui.updatePowerupIndicator(this.state.activePowerups, this.state.hasShield, POWERUP_TYPES);
    }

    checkThemeUnlocks() {
        for (const [themeId, theme] of Object.entries(THEMES)) {
            if (this.state.unlockTheme(themeId) === false) continue;
            if (this.state.score < theme.unlockScore) continue;

            // Theme just unlocked
            sound.play('unlock');
            haptic.heavy();
            this.ui.showThemeUnlock(theme.name);

            this.state.setTheme(themeId);
            document.body.style.background = theme.background;
            break;
        }
    }

    update(deltaTime) {
        const colors = this.getColors();

        // Update Camera Shake
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        // Update Camera Zoom
        let targetZoom = 1.0;
        if (this.state.tinyModeActive) {
            targetZoom = 1.15;
        } else if (this.state.giantModeActive) {
            targetZoom = 0.9;
        } else {
            // Zoom in slightly when moving fast
            const speedFactor = Math.max(0, (this.state.ringSpeed - 200) / 1000);
            targetZoom = 1.0 + Math.min(speedFactor, 0.1);
        }
        this.cameraZoom += (targetZoom - this.cameraZoom) * 0.05;

        // Update dynamic color grading (tension/release visual)
        const speedFactor = Math.max(0, (this.state.ringSpeed - GAME_CONFIG.BASE_RING_SPEED) / 3);
        this.renderer.updateColorGrading(this.state.inRecoveryPhase, speedFactor);

        // Update chromatic aberration decay
        this.renderer.updateChromaticAberration();

        // Update player trail for motion blur effect
        this.renderer.updatePlayerTrail(this.state.playerSize, speedFactor);

        // Visual effects
        this.state.pulseEffect += 0.05;
        this.state.backgroundPulse = Math.sin(this.state.pulseEffect) * 0.5 + 0.5;

        // Particles
        this.particles.update();

        // Update powerup progress animation
        this.state.updatePowerupProgress();

        // Update satisfaction pulse
        this.state.updatePulse();

        // Smooth score display
        if (this.state.displayScore < this.state.score) {
            this.state.displayScore += Math.ceil((this.state.score - this.state.displayScore) * 0.2);
            if (this.state.displayScore > this.state.score) this.state.displayScore = this.state.score;
            this.ui.updateScore(this.state.displayScore);
        }

        if (!this.state.isPlaying) return;

        // Hit Stop - freeze game briefly for impact
        if (this.state.isInHitStop()) return;

        this.updatePowerups();
        sound.updateMusic(this.state.combo);

        // Calculate effective speed
        let effectiveSpeed = this.state.ringSpeed;
        if (this.state.slowTimeActive) effectiveSpeed *= 0.4;
        if (this.state.freezeActive) effectiveSpeed = 0; // Complete stop!

        // Reverse rings direction
        if (this.state.reverseRingsActive) effectiveSpeed *= -0.5;

        // Apply subtle pushback to rings if any
        const pushback = this.state.applyClearancePushback();
        if (pushback > 0) {
            for (const ring of this.state.rings) {
                if (!ring.passed) {
                    ring.radius += pushback;
                }
            }
            for (const powerup of this.state.powerups) {
                if (!powerup.collected) {
                    powerup.radius += pushback;
                }
            }
        }

        // Player size control
        if (this.state.tinyModeActive) {
            // Tiny mode: force minimum size
            this.state.targetSize = GAME_CONFIG.MIN_PLAYER_SIZE;
        } else if (this.state.giantModeActive) {
            // Giant mode: force maximum size
            this.state.targetSize = GAME_CONFIG.MAX_PLAYER_SIZE;
        } else if (this.state.isHolding) {
            this.state.targetSize = Math.min(GAME_CONFIG.MAX_PLAYER_SIZE, this.state.targetSize + GAME_CONFIG.PLAYER_GROW_SPEED);
        } else {
            this.state.targetSize = Math.max(GAME_CONFIG.MIN_PLAYER_SIZE, this.state.targetSize - GAME_CONFIG.PLAYER_SHRINK_SPEED);
        }

        this.state.playerSize += (this.state.targetSize - this.state.playerSize) * 0.15;

        // Ring spawning
        const now = Date.now();
        const spawnInterval = this.state.slowTimeActive ? this.state.ringSpawnInterval * 1.5 : this.state.ringSpawnInterval;
        if (now - this.state.lastRingSpawn > spawnInterval) {
            this.spawnRing();
            this.state.lastRingSpawn = now;
            sound.play('whoosh');
        }

        // Update powerup collectibles
        for (const powerup of this.state.powerups) {
            powerup.update(effectiveSpeed);
            if (powerup.checkCollection(this.state.playerSize)) {
                this.activatePowerup(powerup.type);
            }
        }
        this.state.powerups = this.state.powerups.filter((p) => !p.shouldRemove());

        // Update rings
        for (const ring of this.state.rings) {
            ring.update(effectiveSpeed);

            // Wide gap powerup - temporarily increase ring gap
            if (this.state.wideGapActive && !ring.gapWidened) {
                ring.innerRadius -= 10;
                ring.outerRadius += 10;
                ring.gapWidened = true;
            }

            if (ring.isAtPlayer(this.state.playerSize)) {
                // Ghost mode: always pass through
                // Magnetize: rings adjust their gap to fit player
                // God mode: auto-fit the ring
                let fitsGap = this.godMode || this.state.ghostActive || ring.playerFitsGap(this.state.playerSize);
                let isNearMiss = false;

                // Phantom Hitbox - check if player would survive with forgiveness
                if (!fitsGap && !this.state.ghostActive) {
                    const fitsWithForgiveness = ring.playerFitsGapWithForgiveness(
                        this.state.playerSize, 
                        GAME_CONFIG.PHANTOM_HITBOX_FORGIVENESS
                    );
                    if (fitsWithForgiveness) {
                        fitsGap = true;
                        isNearMiss = true;
                    }
                }

                // Magnetize makes rings easier - widen the gap temporarily
                if (this.state.magnetizeActive && !fitsGap) {
                    const sizeDiff = Math.abs(this.state.playerSize - ring.requiredSize);
                    if (sizeDiff < 25) {
                        fitsGap = true;
                    }
                }

                if (fitsGap) {
                    // Near Miss feedback - "LUCKY!" moment
                    if (isNearMiss) {
                        this.state.recordNearMiss();
                        sound.play('nearMiss');
                        this.ui.showComboPopup('😱 CLOSE CALL!');
                        this.screenShake = 5; // Small shake for tension
                        // Sparks effect for the scrape
                        this.particles.burst(
                            this.renderer.centerX + (Math.random() - 0.5) * this.state.playerSize,
                            this.renderer.centerY + (Math.random() - 0.5) * this.state.playerSize,
                            '#ffa500', 8, { minSpeed: 2, maxSpeed: 5, minSize: 2, maxSize: 4 }
                        );
                    }

                    // Success
                    let isPerfect = this.godMode ? Math.random() > 0.5 : ring.isPerfectPass(this.state.playerSize);

                    // Perfect streak powerup - all passes are perfect!
                    if (this.state.perfectStreakActive) isPerfect = true;

                    // Near misses can't be perfect
                    if (isNearMiss) isPerfect = false;

                    ring.markPassed(colors.ringPassed);

                    if (isPerfect) {
                        this.state.incrementCombo();
                        // Audio Pitch Ramping - play sound with pitch based on streak
                        sound.play('perfect', this.state.getPitchScale());
                    } else {
                        // Combo keeper prevents combo reset on non-perfect
                        if (!this.state.comboKeeperActive) {
                            this.state.resetCombo();
                        }
                        sound.play('pass');
                    }

                    // Calculate points with multipliers
                    let points = 1;
                    if (this.state.triplePointsActive) points *= 3;
                    else if (this.state.doublePointsActive) points *= 2;

                    this.state.addScore(points);
                    this.ui.updateMultiplier(this.state.multiplier, this.state.multiplier > 1);

                    // Trigger satisfaction pulse
                    if (this.state.combo > 0 && this.state.combo % 5 === 0) {
                        this.ui.showComboPopup(`🔥 ${this.state.combo} COMBO!`);
                        sound.play('combo');
                        haptic.medium();
                        this.state.triggerPulse(2);
                        
                        // Chromatic aberration at high combos (50+)
                        if (this.state.combo >= 50) {
                            this.renderer.triggerChromaticAberration(0.8);
                        }
                    } else if (isPerfect) {
                        this.state.triggerPulse(1); // Perfect pulse (medium)
                        haptic.light();
                    } else {
                        this.state.triggerPulse(0); // Normal pulse (small)
                        haptic.light();
                    }

                    // Trigger clearance reward - brief slowdown + ring pushback
                    this.state.triggerClearanceReward(isPerfect);

                    this.state.updateDifficulty();
                    this.checkThemeUnlocks();

                    // Add progress toward next powerup
                    this.onRingPassed(isPerfect);

                    this.particles.ring(
                        this.renderer.centerX,
                        this.renderer.centerY,
                        this.state.playerSize,
                        isPerfect ? '#ffff00' : colors.playerGlow,
                        isPerfect ? 25 : 12
                    );
                } else {
                    // Fail - but ghost mode already handled above
                    if (this.state.hasShield) {
                        this.state.hasShield = false;
                        ring.markPassed('#ffd700');
                        sound.play('shield');
                        haptic.medium();
                        this.ui.showComboPopup('🛡️ SHIELD USED!');
                        this.ui.updatePowerupIndicator(this.state.activePowerups, false, POWERUP_TYPES);
                        this.state.resetCombo();
                        this.ui.updateMultiplier(1, false);
                    } else {
                        ring.color = colors.ringFail;
                        this.gameOver();
                        return;
                    }
                }
            }

            if (ring.hasPassed()) {
                if (this.godMode) {
                    // God mode: just mark as passed
                    ring.passed = true;
                } else if (this.state.hasShield) {
                    this.state.hasShield = false;
                    ring.passed = true;
                    this.ui.updatePowerupIndicator(this.state.activePowerups, false, POWERUP_TYPES);
                } else {
                    ring.color = colors.ringFail;
                    this.gameOver();
                    return;
                }
            }
        }

        this.state.rings = this.state.rings.filter((r) => !r.shouldRemove());
    }

    draw() {
        const colors = this.getColors();

        this.renderer.beginFrame(colors.background, this.cameraZoom, this.screenShake);
        this.renderer.drawBackgroundEffects(this.state.backgroundPulse, colors.accent, colors);

        // Powerups
        for (const powerup of this.state.powerups) {
            this.renderer.drawPowerup(powerup);
        }

        // Target zone for nearest ring
        const nearestRing = this.state.rings.find((r) => !r.passed && r.radius > this.state.playerSize);
        this.renderer.drawTargetZone(nearestRing, this.state.isPlaying);

        // Rings
        for (const ring of this.state.rings) {
            this.renderer.drawRing(ring);
        }

        // Particles
        this.particles.draw(this.renderer.ctx);

        // Player with powerup visual states
        this.renderer.drawPlayer(
            this.state.playerSize,
            colors,
            this.state.hasShield,
            this.state.ghostActive,
            this.state.tinyModeActive,
            this.state.giantModeActive,
            this.state.magnetizeActive,
            this.state.freezeActive,
            this.state.rainbowActive,
            this.state.isHolding,
            this.state.isPlaying,
            this.state.getPulseScale()
        );

        // Powerup progress ring around player
        this.renderer.drawPowerupProgressRing(
            this.state.playerSize,
            this.state.getPowerupProgressPercent(),
            this.state.nextPowerupType,
            this.state.powerupIconAngle,
            this.state.isPowerupReady()
        );

        // Slow time / freeze effect
        this.renderer.drawSlowTimeEffect(this.state.slowTimeActive, this.state.freezeActive);

        // Rainbow mode effect
        if (this.state.rainbowActive) {
            this.renderer.drawRainbowEffect();
        }

        // Chromatic aberration post-process effect (on death, high combo, powerup)
        this.renderer.drawChromaticAberration();

        this.renderer.endFrame();
    }

    gameLoop(timestamp) {
        try {
            const deltaTime = Math.min(timestamp - this.lastTime, 100); // Cap delta to prevent spiral
            this.lastTime = timestamp;

            this.update(deltaTime);
            this.draw();
        } catch (error) {
            console.error('Game loop error:', error);
            console.error('Stack:', error.stack);
        }

        // Always continue the loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}
