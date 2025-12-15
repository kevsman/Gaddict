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
import { createRandomPowerup } from '../entities/Powerup.js';

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
        this.state.screenShake = 20;

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

        // Maybe spawn powerup
        if (Math.random() < GAME_CONFIG.POWERUP_SPAWN_CHANCE && this.state.score > 5) {
            const powerup = createRandomPowerup(this.renderer.getScreenSize());
            this.state.powerups.push(powerup);
        }
    }

    activatePowerup(type) {
        const powerupInfo = POWERUP_TYPES[type];

        sound.play('powerup');
        haptic.success();
        this.ui.showComboPopup(powerupInfo.icon + ' ' + powerupInfo.name);

        switch (type) {
            case 'slowTime':
                this.state.slowTimeActive = true;
                this.state.activePowerups.slowTime = Date.now() + powerupInfo.duration;
                break;
            case 'shield':
                this.state.hasShield = true;
                sound.play('shield');
                break;
            case 'autoSize':
                this.state.autoSizeActive = true;
                this.state.activePowerups.autoSize = Date.now() + powerupInfo.duration;
                break;
            case 'doublePoints':
                this.state.doublePointsActive = true;
                this.state.activePowerups.doublePoints = Date.now() + powerupInfo.duration;
                break;
        }

        this.ui.updatePowerupIndicator(this.state.activePowerups, this.state.hasShield, POWERUP_TYPES);

        // Collection particles
        this.particles.burst(this.renderer.centerX, this.renderer.centerY, powerupInfo.color, 20, {
            minSpeed: 2,
            maxSpeed: 5,
            minSize: 4,
            maxSize: 8,
        });
    }

    updatePowerups() {
        const now = Date.now();

        if (this.state.activePowerups.slowTime && now > this.state.activePowerups.slowTime) {
            this.state.slowTimeActive = false;
            delete this.state.activePowerups.slowTime;
        }

        if (this.state.activePowerups.autoSize && now > this.state.activePowerups.autoSize) {
            this.state.autoSizeActive = false;
            delete this.state.activePowerups.autoSize;
        }

        if (this.state.activePowerups.doublePoints && now > this.state.activePowerups.doublePoints) {
            this.state.doublePointsActive = false;
            delete this.state.activePowerups.doublePoints;
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

        // Screen shake decay
        if (this.state.screenShake > 0) {
            this.state.screenShake *= 0.9;
            if (this.state.screenShake < 0.1) this.state.screenShake = 0;
        }

        // Visual effects
        this.state.pulseEffect += 0.05;
        this.state.backgroundPulse = Math.sin(this.state.pulseEffect) * 0.5 + 0.5;

        // Particles
        this.particles.update();

        // Smooth score display
        if (this.state.displayScore < this.state.score) {
            this.state.displayScore += Math.ceil((this.state.score - this.state.displayScore) * 0.2);
            if (this.state.displayScore > this.state.score) this.state.displayScore = this.state.score;
            this.ui.updateScore(this.state.displayScore);
        }

        if (!this.state.isPlaying) return;

        this.updatePowerups();

        const effectiveSpeed = this.state.slowTimeActive ? this.state.ringSpeed * 0.4 : this.state.ringSpeed;

        // Player size control
        if (this.state.autoSizeActive && this.state.rings.length > 0) {
            const nearestRing = this.state.rings.find((r) => !r.passed && r.radius > 0);
            if (nearestRing && nearestRing.radius < 300) {
                this.state.targetSize = nearestRing.requiredSize;
            }
        } else {
            if (this.state.isHolding) {
                this.state.targetSize = Math.min(GAME_CONFIG.MAX_PLAYER_SIZE, this.state.targetSize + GAME_CONFIG.PLAYER_GROW_SPEED);
            } else {
                this.state.targetSize = Math.max(GAME_CONFIG.MIN_PLAYER_SIZE, this.state.targetSize - GAME_CONFIG.PLAYER_SHRINK_SPEED);
            }
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
                if (ring.playerFitsGap(this.state.playerSize)) {
                    // Success
                    const isPerfect = ring.isPerfectPass(this.state.playerSize);
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

                    if (this.state.combo > 0 && this.state.combo % 5 === 0) {
                        this.ui.showComboPopup(`🔥 ${this.state.combo} COMBO!`);
                        sound.play('combo');
                        haptic.medium();
                    } else {
                        haptic.light();
                    }

                    this.state.updateDifficulty();
                    this.checkThemeUnlocks();

                    this.particles.ring(
                        this.renderer.centerX,
                        this.renderer.centerY,
                        this.state.playerSize,
                        isPerfect ? '#ffff00' : colors.playerGlow,
                        isPerfect ? 25 : 12
                    );
                } else {
                    // Fail
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
                if (this.state.hasShield) {
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

        this.renderer.clear(colors.background, this.state.screenShake);
        this.renderer.drawBackgroundGrid(this.state.backgroundPulse);

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

        // Player
        this.renderer.drawPlayer(
            this.state.playerSize,
            colors,
            this.state.hasShield,
            this.state.autoSizeActive,
            this.state.targetSize,
            this.state.isHolding,
            this.state.isPlaying
        );

        // Slow time effect
        this.renderer.drawSlowTimeEffect(this.state.slowTimeActive);

        this.renderer.restore();
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}
