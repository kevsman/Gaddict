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
        this.state.reset();
        this.state.loadSavedData();
        this.state.isPlaying = true;
        this.state.lastRingSpawn = Date.now();
        this.particles.clear();

        this.ui.showMessage(false);
        this.ui.hideGameOver();
        this.ui.updateMultiplier(1, false);
        this.ui.updatePowerupIndicator({}, false, POWERUP_TYPES);

        this.spawnRing();
    }

    gameOver() {
        this.state.isPlaying = false;

        sound.play('death');
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

        setTimeout(() => {
            if (!this.state.isPlaying) {
                this.ui.showGameOver(this.state.score, this.state.highScore, isNewHighScore);
            }
        }, 500);
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

        // Exciting activation messages for each powerup
        const activationMessages = {
            slowTime: ['⏱️ TIME SLOWED!', '⏱️ MATRIX MODE!', '⏱️ SLOW-MO!'],
            shield: ['🛡️ PROTECTED!', '🛡️ SHIELD UP!', '🛡️ INVINCIBLE!'],
            tinyMode: ['🔬 TINY MODE!', '🔬 SHRINK RAY!', '🔬 MINI ME!'],
            doublePoints: ['⭐ 2X POINTS!', '⭐ DOUBLE UP!', '⭐ BONUS MODE!'],
            magnetize: ['🧲 MAGNETIZED!', '🧲 ATTRACTION!', '🧲 PULL POWER!'],
            ghost: ['👻 GHOST MODE!', '👻 PHASING!', '👻 UNTOUCHABLE!'],
        };
        const messages = activationMessages[type] || [powerupInfo.icon + ' ' + powerupInfo.name];
        const message = messages[Math.floor(Math.random() * messages.length)];
        this.ui.showComboPopup(message);

        // Trigger a satisfaction pulse for the powerup
        this.state.triggerPulse(2); // Type 2 = combo/powerup pulse (biggest)

        switch (type) {
            case 'slowTime':
                this.state.slowTimeActive = true;
                this.state.activePowerups.slowTime = Date.now() + powerupInfo.duration;
                break;
            case 'shield':
                this.state.hasShield = true;
                sound.play('shield');
                break;
            case 'tinyMode':
                this.state.tinyModeActive = true;
                this.state.activePowerups.tinyMode = Date.now() + powerupInfo.duration;
                break;
            case 'doublePoints':
                this.state.doublePointsActive = true;
                this.state.activePowerups.doublePoints = Date.now() + powerupInfo.duration;
                break;
            case 'magnetize':
                this.state.magnetizeActive = true;
                this.state.activePowerups.magnetize = Date.now() + powerupInfo.duration;
                break;
            case 'ghost':
                this.state.ghostActive = true;
                this.state.activePowerups.ghost = Date.now() + powerupInfo.duration;
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

        if (this.state.activePowerups.slowTime && now > this.state.activePowerups.slowTime) {
            this.state.slowTimeActive = false;
            delete this.state.activePowerups.slowTime;
        }

        if (this.state.activePowerups.tinyMode && now > this.state.activePowerups.tinyMode) {
            this.state.tinyModeActive = false;
            delete this.state.activePowerups.tinyMode;
        }

        if (this.state.activePowerups.doublePoints && now > this.state.activePowerups.doublePoints) {
            this.state.doublePointsActive = false;
            delete this.state.activePowerups.doublePoints;
        }

        if (this.state.activePowerups.magnetize && now > this.state.activePowerups.magnetize) {
            this.state.magnetizeActive = false;
            delete this.state.activePowerups.magnetize;
        }

        if (this.state.activePowerups.ghost && now > this.state.activePowerups.ghost) {
            this.state.ghostActive = false;
            delete this.state.activePowerups.ghost;
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

        this.updatePowerups();

        // Calculate effective speed
        let effectiveSpeed = this.state.ringSpeed;
        if (this.state.slowTimeActive) effectiveSpeed *= 0.4;

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

            if (ring.isAtPlayer(this.state.playerSize)) {
                // Ghost mode: always pass through
                // Magnetize: rings adjust their gap to fit player
                // God mode: auto-fit the ring
                let fitsGap = this.godMode || this.state.ghostActive || ring.playerFitsGap(this.state.playerSize);
                
                // Magnetize makes rings easier - widen the gap temporarily
                if (this.state.magnetizeActive && !fitsGap) {
                    // Check if player is close to fitting
                    const sizeDiff = Math.abs(this.state.playerSize - ring.requiredSize);
                    if (sizeDiff < 25) {
                        fitsGap = true; // Magnetize pulls you through!
                    }
                }

                if (fitsGap) {
                    // Success
                    const isPerfect = this.godMode ? Math.random() > 0.5 : ring.isPerfectPass(this.state.playerSize);
                    ring.markPassed(colors.ringPassed);

                    if (isPerfect) {
                        this.state.incrementCombo();
                        sound.play('perfect');
                    } else {
                        this.state.resetCombo();
                        sound.play('pass');
                    }

                    this.state.addScore(1);
                    this.ui.updateMultiplier(this.state.multiplier, this.state.multiplier > 1);

                    // Trigger satisfaction pulse
                    if (this.state.combo > 0 && this.state.combo % 5 === 0) {
                        this.ui.showComboPopup(`🔥 ${this.state.combo} COMBO!`);
                        sound.play('combo');
                        haptic.medium();
                        this.state.triggerPulse(2); // Combo pulse (biggest)
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

        this.renderer.clear(colors.background, 0);
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

        // Player with integrated powerup progress ring
        this.renderer.drawPlayer(
            this.state.playerSize,
            colors,
            this.state.hasShield,
            this.state.ghostActive,
            this.state.tinyModeActive,
            this.state.magnetizeActive,
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

        // Slow time effect
        this.renderer.drawSlowTimeEffect(this.state.slowTimeActive);
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
