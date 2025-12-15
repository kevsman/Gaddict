import { GAME_CONFIG } from '../config/constants.js';
import { POWERUP_TYPES } from '../config/powerups.js';

// Canvas Renderer
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.centerX = 0;
        this.centerY = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    getScreenSize() {
        return Math.max(this.width, this.height);
    }

    beginFrame(backgroundColor, zoom = 1, shake = 0) {
        // Reset transform to ensure we cover the whole screen with background
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Draw background
        const gradient = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, this.height);
        gradient.addColorStop(0, this.lightenColor(backgroundColor, 15));
        gradient.addColorStop(0.5, backgroundColor);
        gradient.addColorStop(1, this.darkenColor(backgroundColor, 10));

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Save state for the camera transform
        this.ctx.save();

        // Apply Shake
        let shakeX = 0;
        let shakeY = 0;
        if (shake > 0) {
            shakeX = (Math.random() - 0.5) * shake;
            shakeY = (Math.random() - 0.5) * shake;
        }

        // Apply Zoom and Shake
        // We want to zoom around the center
        this.ctx.translate(this.centerX + shakeX, this.centerY + shakeY);
        this.ctx.scale(zoom, zoom);
        this.ctx.translate(-this.centerX, -this.centerY);
    }

    endFrame() {
        this.ctx.restore();
    }

    lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min((num >> 16) + amt, 255);
        const G = Math.min(((num >> 8) & 0x00ff) + amt, 255);
        const B = Math.min((num & 0x0000ff) + amt, 255);
        return `rgb(${R}, ${G}, ${B})`;
    }

    drawBackgroundEffects(pulse, accentColor = '#ff6b9d', colors = null) {
        const ctx = this.ctx;
        const time = Date.now() * 0.001;

        // Floating particles in background
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 20; i++) {
            const x = (Math.sin(time * 0.3 + i * 1.5) * 0.4 + 0.5) * this.width;
            const y = ((time * 0.05 + i * 0.1) % 1) * this.height;
            const size = 2 + Math.sin(time + i) * 1;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Soft animated rings in background
        for (let r = 100; r < this.getScreenSize(); r += 120) {
            const ringPulse = Math.sin(time * 0.5 + r * 0.005) * 0.5 + 0.5;
            const alpha = (0.04 + pulse * 0.02) * (1 - r / this.getScreenSize());

            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, r + Math.sin(time + r * 0.01) * 5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Warm radial glow from center
        const centerGlow = ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, 250);
        centerGlow.addColorStop(0, `rgba(${this.hexToRgb(accentColor)}, ${0.12 + pulse * 0.05})`);
        centerGlow.addColorStop(0.5, `rgba(${this.hexToRgb(accentColor)}, ${0.04})`);
        centerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = centerGlow;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
    }

    drawTargetZone(ring, isPlaying) {
        if (!ring || !isPlaying) return;

        const ctx = this.ctx;
        const time = Date.now() * 0.003;

        // Draw filled zone (safe zone) - simple and clear
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ring.outerRadius, 0, Math.PI * 2);
        ctx.arc(this.centerX, this.centerY, ring.innerRadius, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(0, 255, 170, 0.12)';
        ctx.fill();

        // Clear inner boundary line
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ring.innerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Clear outer boundary line
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ring.outerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Perfect zone - subtle golden line
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ring.requiredSize, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 220, 100, ${0.5 + Math.sin(time * 2) * 0.15})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawRing(ring) {
        if (ring.radius < 0) return;

        const ctx = this.ctx;
        const baseAlpha = Math.min(1, ring.radius / 150);
        const time = Date.now() * 0.005;
        const pulse = ring.passed ? 0 : Math.sin(time + ring.radius * 0.01) * 0.15;

        // Outer glow for incoming rings
        if (!ring.passed && ring.radius > 100) {
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, ring.radius, 0, Math.PI * 2);
            ctx.strokeStyle = ring.color;
            ctx.lineWidth = GAME_CONFIG.RING_THICKNESS + 12;
            ctx.globalAlpha = baseAlpha * 0.15;
            ctx.stroke();
        }

        // Main ring with enhanced thickness
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = GAME_CONFIG.RING_THICKNESS + (ring.passed ? 0 : pulse * 4);
        ctx.globalAlpha = baseAlpha * (0.85 + pulse);

        // Add shadow glow
        if (!ring.passed) {
            ctx.shadowColor = ring.color;
            ctx.shadowBlur = 15 + pulse * 10;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Double ring indicator with enhanced effect
        if (ring.isDouble && !ring.passed) {
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, ring.radius - 18, 0, Math.PI * 2);
            ctx.lineWidth = 4;
            ctx.globalAlpha = baseAlpha * 0.7;
            ctx.shadowColor = ring.color;
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;
    }

    drawPowerup(powerup) {
        if (powerup.collected || powerup.radius < 30) return;

        const ctx = this.ctx;
        const time = Date.now() * 0.008;
        const pulseSize = Math.sin(powerup.pulsePhase) * 6;

        // Outer energy glow - ensure inner radius is never negative
        const innerRadius = Math.max(0, powerup.radius - 25);
        const outerRadius = powerup.radius + 30;
        const energyGlow = ctx.createRadialGradient(this.centerX, this.centerY, innerRadius, this.centerX, this.centerY, outerRadius);
        energyGlow.addColorStop(0, 'transparent');
        energyGlow.addColorStop(0.5, powerup.color.replace(')', ', 0.2)').replace('rgb', 'rgba'));
        energyGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = energyGlow;
        ctx.fillRect(0, 0, this.width, this.height);

        // Spinning sparkles on the ring
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        for (let i = 0; i < 6; i++) {
            const angle = time * 2 + (i * Math.PI * 2) / 6;
            const x = Math.cos(angle) * powerup.radius;
            const y = Math.sin(angle) * powerup.radius;
            const sparkSize = 5 + Math.sin(time * 3 + i) * 2;

            ctx.beginPath();
            ctx.arc(x, y, sparkSize, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.shadowColor = powerup.color;
            ctx.shadowBlur = 15;
            ctx.fill();
        }
        ctx.restore();
        ctx.shadowBlur = 0;

        // Main powerup ring - thick, solid, and glowy (no dashed line)
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, powerup.radius, 0, Math.PI * 2);
        ctx.strokeStyle = powerup.color;
        ctx.lineWidth = 10 + pulseSize;
        ctx.globalAlpha = 0.9;
        ctx.shadowColor = powerup.color;
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;
    }

    drawPlayer(
        playerSize,
        colors,
        hasShield,
        ghostActive,
        tinyModeActive,
        giantModeActive,
        magnetizeActive,
        freezeActive,
        rainbowActive,
        isHolding,
        isPlaying,
        pulseScale = 1
    ) {
        const ctx = this.ctx;
        const time = Date.now() * 0.003;

        // Apply satisfaction pulse to player size
        const pulsedSize = playerSize * pulseScale;

        // Rainbow mode - cycle through colors
        let playerColor = colors.player;
        if (rainbowActive) {
            const hue = (Date.now() * 0.3) % 360;
            playerColor = `hsl(${hue}, 80%, 60%)`;
        }

        // Freeze effect - ice crystals around player
        if (freezeActive) {
            ctx.save();
            ctx.translate(this.centerX, this.centerY);
            for (let i = 0; i < 12; i++) {
                const angle = (i * Math.PI * 2) / 12 + time * 0.2;
                const dist = pulsedSize + 20 + Math.sin(time * 2 + i) * 5;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;

                // Ice crystal shape
                ctx.beginPath();
                ctx.moveTo(x, y - 6);
                ctx.lineTo(x + 4, y);
                ctx.lineTo(x, y + 6);
                ctx.lineTo(x - 4, y);
                ctx.closePath();
                ctx.fillStyle = `rgba(0, 255, 255, ${0.6 + Math.sin(time + i) * 0.2})`;
                ctx.fill();
            }
            ctx.restore();

            // Frozen aura
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, pulsedSize + 15, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + Math.sin(time * 2) * 0.1})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Giant mode effect - powerful aura
        if (giantModeActive) {
            // Expanding power rings
            for (let i = 0; i < 3; i++) {
                const ringPulse = ((Date.now() + i * 300) % 1000) / 1000;
                const ringRadius = pulsedSize + ringPulse * 40;
                ctx.beginPath();
                ctx.arc(this.centerX, this.centerY, ringRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 140, 0, ${0.4 * (1 - ringPulse)})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }

        // Ghost mode effect - ethereal appearance
        if (ghostActive) {
            // Ghostly trail rings
            for (let i = 3; i >= 0; i--) {
                const trailSize = pulsedSize + i * 8;
                ctx.beginPath();
                ctx.arc(this.centerX, this.centerY, trailSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(136, 204, 255, ${0.1 - i * 0.02})`;
                ctx.fill();
            }

            // Floating ghost particles
            ctx.save();
            ctx.translate(this.centerX, this.centerY);
            for (let i = 0; i < 8; i++) {
                const angle = time * 0.8 + (i * Math.PI * 2) / 8;
                const dist = pulsedSize + 15 + Math.sin(time * 2 + i) * 8;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist - Math.sin(time * 3 + i) * 5;

                ctx.beginPath();
                ctx.arc(x, y, 3 + Math.sin(time * 2 + i), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(136, 204, 255, ${0.5 + Math.sin(time + i) * 0.2})`;
                ctx.fill();
            }
            ctx.restore();
        }

        // Magnetize effect - attraction waves
        if (magnetizeActive) {
            const wavePulse = (Date.now() % 1000) / 1000;
            for (let i = 0; i < 3; i++) {
                const waveOffset = (wavePulse + i * 0.33) % 1;
                const waveRadius = pulsedSize + 20 + waveOffset * 60;
                ctx.beginPath();
                ctx.arc(this.centerX, this.centerY, waveRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 105, 180, ${0.4 * (1 - waveOffset)})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Tiny mode effect - sparkly shrink aura
        if (tinyModeActive) {
            // Shrinking particles converging to center
            ctx.save();
            ctx.translate(this.centerX, this.centerY);
            for (let i = 0; i < 6; i++) {
                const angle = time * 1.5 + (i * Math.PI * 2) / 6;
                const dist = pulsedSize + 10 + Math.sin(time * 4 + i) * 5;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;

                ctx.beginPath();
                ctx.arc(x, y, 2 + Math.sin(time * 3 + i), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 107, 107, ${0.7 + Math.sin(time + i) * 0.2})`;
                ctx.shadowColor = '#ff6b6b';
                ctx.shadowBlur = 8;
                ctx.fill();
            }
            ctx.restore();
            ctx.shadowBlur = 0;
        }

        // Shield effect - dramatic golden aura
        if (hasShield) {
            // Outer shield particles
            ctx.save();
            ctx.translate(this.centerX, this.centerY);
            for (let i = 0; i < 12; i++) {
                const angle = time * 1.5 + (i * Math.PI * 2) / 12;
                const dist = playerSize + 20 + Math.sin(time * 3 + i) * 5;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;

                ctx.beginPath();
                ctx.arc(x, y, 3 + Math.sin(time * 4 + i) * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;
                ctx.globalAlpha = 0.8;
                ctx.fill();
            }
            ctx.restore();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;

            // Shield glow layers
            const shieldPulse = Math.sin(time * 2) * 0.3 + 0.7;
            for (let i = 3; i >= 0; i--) {
                const radius = playerSize + 15 + i * 10;
                const alpha = 0.15 - i * 0.03;
                ctx.beginPath();
                ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 215, 0, ${alpha * shieldPulse})`;
                ctx.fill();
            }

            // Shield ring
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, playerSize + 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
            ctx.setLineDash([10, 5]);
            ctx.lineDashOffset = -Date.now() * 0.03;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
        }

        // Soft glow around player - uses pulsed size
        const glowSize = pulsedSize + 25 + (pulseScale - 1) * 30; // Extra glow on pulse
        const glowGradient = ctx.createRadialGradient(this.centerX, this.centerY, pulsedSize * 0.5, this.centerX, this.centerY, glowSize);
        glowGradient.addColorStop(0, colors.playerGlow);
        glowGradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Pulse flash effect - bright ring on pulse
        if (pulseScale > 1.01) {
            const flashAlpha = (pulseScale - 1) * 4; // Brighter when pulsing more
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, pulsedSize + 5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(flashAlpha, 0.6)})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Main player circle - clean solid color with subtle edge
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, pulsedSize, 0, Math.PI * 2);
        ctx.fillStyle = playerColor;
        ctx.fill();

        // Subtle lighter edge highlight
        const edgeGradient = ctx.createRadialGradient(this.centerX, this.centerY, pulsedSize * 0.7, this.centerX, this.centerY, pulsedSize);
        edgeGradient.addColorStop(0, 'transparent');
        edgeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, pulsedSize, 0, Math.PI * 2);
        ctx.fillStyle = edgeGradient;
        ctx.fill();

        // Holding indicator - pulsing expansion ring
        if (isHolding && isPlaying && !tinyModeActive && !giantModeActive) {
            const expandPulse = (Date.now() % 500) / 500;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, pulsedSize + expandPulse * 15, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 - expandPulse * 0.6})`;
            ctx.lineWidth = 3 - expandPulse * 2;
            ctx.stroke();
        }
    }

    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
        const B = Math.max((num & 0x0000ff) - amt, 0);
        return `rgb(${R}, ${G}, ${B})`;
    }

    drawSlowTimeEffect(slowActive, freezeActive) {
        const ctx = this.ctx;
        const time = Date.now() * 0.002;

        if (freezeActive) {
            // Freeze effect - blue/white frozen overlay
            const pulse = Math.sin(time) * 0.03 + 0.12;

            // Ice vignette
            const vignette = ctx.createRadialGradient(this.centerX, this.centerY, this.height * 0.2, this.centerX, this.centerY, this.height * 0.9);
            vignette.addColorStop(0, 'transparent');
            vignette.addColorStop(1, `rgba(0, 255, 255, ${pulse})`);
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, this.width, this.height);

            // Frost particles (stationary, sparkling)
            for (let i = 0; i < 30; i++) {
                const x = (Math.sin(i * 1.7) * 0.5 + 0.5) * this.width;
                const y = (Math.cos(i * 2.3) * 0.5 + 0.5) * this.height;
                const sparkle = Math.sin(time * 5 + i * 0.5) * 0.5 + 0.5;

                ctx.beginPath();
                ctx.arc(x, y, 2 + sparkle * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * 0.6})`;
                ctx.fill();
            }
        } else if (slowActive) {
            const pulse = Math.sin(time) * 0.02 + 0.08;

            // Vignette effect
            const vignette = ctx.createRadialGradient(this.centerX, this.centerY, this.height * 0.3, this.centerX, this.centerY, this.height * 0.8);
            vignette.addColorStop(0, 'transparent');
            vignette.addColorStop(1, `rgba(78, 205, 196, ${pulse})`);
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, this.width, this.height);

            // Scan lines effect
            ctx.fillStyle = `rgba(78, 205, 196, 0.03)`;
            for (let y = 0; y < this.height; y += 4) {
                if ((y + Math.floor(time * 50)) % 8 < 4) {
                    ctx.fillRect(0, y, this.width, 2);
                }
            }

            // Time particles floating
            ctx.save();
            for (let i = 0; i < 15; i++) {
                const x = (Math.sin(time + i * 0.7) * 0.5 + 0.5) * this.width;
                const y = ((time * 0.1 + i * 0.15) % 1) * this.height;
                const size = 2 + Math.sin(time * 2 + i) * 1;

                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(78, 205, 196, ${0.4 + Math.sin(time + i) * 0.2})`;
                ctx.fill();
            }
            ctx.restore();
        }
    }

    drawRainbowEffect() {
        const ctx = this.ctx;
        const time = Date.now() * 0.003;

        // Rainbow border around screen
        const hue = (Date.now() * 0.2) % 360;
        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.3)`;
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, this.width - 8, this.height - 8);

        // Floating rainbow particles
        for (let i = 0; i < 20; i++) {
            const particleHue = (hue + i * 18) % 360;
            const x = (Math.sin(time * 0.5 + i * 0.8) * 0.4 + 0.5) * this.width;
            const y = ((time * 0.15 + i * 0.1) % 1) * this.height;
            const size = 3 + Math.sin(time * 2 + i) * 2;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${particleHue}, 100%, 60%, 0.6)`;
            ctx.fill();
        }
    }

    // New integrated powerup progress ring around the player
    drawPowerupProgressRing(playerSize, progressPercent, nextPowerupType, iconAngle, isReady) {
        if (progressPercent <= 0) return;

        const ctx = this.ctx;
        const time = Date.now() * 0.003;
        const powerupInfo = POWERUP_TYPES[nextPowerupType];
        const powerupColor = powerupInfo ? powerupInfo.color : '#ffd700';
        const powerupIcon = powerupInfo ? powerupInfo.icon : '?';

        // Progress ring radius - further out, thinner, more subtle
        const ringRadius = playerSize + 35;
        const ringWidth = 3;

        // Very subtle background ring (unfilled portion)
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = ringWidth;
        ctx.stroke();

        // Progress arc - fills clockwise from top
        const startAngle = -Math.PI / 2; // Start at top
        const endAngle = startAngle + progressPercent * Math.PI * 2;

        // Subtle glow effect for the progress (only when getting close)
        if (progressPercent > 0.5) {
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, ringRadius, startAngle, endAngle);
            ctx.strokeStyle = powerupColor;
            ctx.lineWidth = ringWidth + 3;
            ctx.globalAlpha = 0.15;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Main progress arc - subtle opacity
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ringRadius, startAngle, endAngle);
        ctx.strokeStyle = powerupColor;
        ctx.lineWidth = ringWidth;
        ctx.globalAlpha = isReady ? 0.9 : 0.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.lineCap = 'butt';
        ctx.globalAlpha = 1;

        // Only show icon when progress > 50% or ready
        if (progressPercent < 0.5 && !isReady) return;

        // Small icon at the end of the progress arc (not orbiting)
        const iconX = this.centerX + Math.cos(endAngle) * ringRadius;
        const iconY = this.centerY + Math.sin(endAngle) * ringRadius;
        const iconSize = isReady ? 14 + Math.sin(time * 4) * 2 : 10;

        // Icon glow only when ready
        if (isReady) {
            ctx.beginPath();
            ctx.arc(iconX, iconY, iconSize + 8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(time * 3) * 0.1})`;
            ctx.fill();
        }

        // Icon background circle
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconSize, 0, Math.PI * 2);
        ctx.fillStyle = isReady ? powerupColor : this.darkenColor(powerupColor, 20);
        ctx.globalAlpha = isReady ? 1 : 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Icon border
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconSize, 0, Math.PI * 2);
        ctx.strokeStyle = isReady ? '#fff' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Icon emoji (smaller)
        ctx.font = `${isReady ? 12 : 10}px Arial`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerupIcon, iconX, iconY + 1);
    }
}
