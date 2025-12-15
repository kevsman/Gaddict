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

    clear(backgroundColor, screenShake = 0) {
        if (screenShake > 0) {
            this.ctx.save();
            const shakeX = (Math.random() - 0.5) * screenShake;
            const shakeY = (Math.random() - 0.5) * screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        // Create gradient background instead of flat color
        const gradient = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, this.height);
        gradient.addColorStop(0, this.lightenColor(backgroundColor, 15));
        gradient.addColorStop(0.5, backgroundColor);
        gradient.addColorStop(1, this.darkenColor(backgroundColor, 10));

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (screenShake > 0) {
            this.ctx.restore();
        }
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
        if (powerup.collected || powerup.radius < 0) return;

        const ctx = this.ctx;
        const time = Date.now() * 0.008;
        const pulseSize = Math.sin(powerup.pulsePhase) * 8;
        const spinAngle = time * 2;

        // Outer energy field
        const energyGlow = ctx.createRadialGradient(this.centerX, this.centerY, powerup.radius - 30, this.centerX, this.centerY, powerup.radius + 40);
        energyGlow.addColorStop(0, 'transparent');
        energyGlow.addColorStop(0.5, powerup.color.replace(')', ', 0.15)').replace('rgb', 'rgba'));
        energyGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = energyGlow;
        ctx.fillRect(0, 0, this.width, this.height);

        // Spinning particle trail
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        for (let i = 0; i < 8; i++) {
            const angle = spinAngle + (i * Math.PI * 2) / 8;
            const x = Math.cos(angle) * powerup.radius;
            const y = Math.sin(angle) * powerup.radius;
            const sparkSize = 4 + Math.sin(time * 3 + i) * 2;

            ctx.beginPath();
            ctx.arc(x, y, sparkSize, 0, Math.PI * 2);
            ctx.fillStyle = powerup.color;
            ctx.shadowColor = powerup.color;
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.8;
            ctx.fill();
        }
        ctx.restore();
        ctx.shadowBlur = 0;

        // Powerup ring with glow
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, powerup.radius, 0, Math.PI * 2);
        ctx.strokeStyle = powerup.color;
        ctx.lineWidth = 6 + pulseSize;
        ctx.globalAlpha = 0.7 + Math.sin(powerup.pulsePhase) * 0.3;
        ctx.shadowColor = powerup.color;
        ctx.shadowBlur = 25;
        ctx.setLineDash([15, 8]);
        ctx.lineDashOffset = -Date.now() * 0.05;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // Inner target indicator
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, powerup.size, 0, Math.PI * 2);
        ctx.strokeStyle = powerup.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(time * 4) * 0.2;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;
    }

    drawPlayer(playerSize, colors, hasShield, autoSizeActive, targetSize, isHolding, isPlaying, pulseScale = 1) {
        const ctx = this.ctx;
        const time = Date.now() * 0.003;

        // Apply satisfaction pulse to player size
        const pulsedSize = playerSize * pulseScale;

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

        // Auto-size indicator with glow
        if (autoSizeActive) {
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, targetSize, 0, Math.PI * 2);
            ctx.strokeStyle = POWERUP_TYPES.autoSize.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6 + Math.sin(time * 4) * 0.3;
            ctx.shadowColor = POWERUP_TYPES.autoSize.color;
            ctx.shadowBlur = 15;
            ctx.setLineDash([8, 4]);
            ctx.lineDashOffset = -Date.now() * 0.02;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
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
        ctx.fillStyle = colors.player;
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
        if (isHolding && isPlaying && !autoSizeActive) {
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

    drawSlowTimeEffect(active) {
        if (active) {
            const ctx = this.ctx;
            const time = Date.now() * 0.002;
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

    drawPowerupProgress(orbs, progress, maxProgress) {
        if (progress === 0 && orbs.length === 0) return;

        const ctx = this.ctx;
        const iconX = this.width - 60;
        const iconY = 80;
        const time = Date.now() * 0.003;
        const isReady = progress >= maxProgress;
        const isClose = progress >= maxProgress - 2;

        // Draw target powerup icon (mystery box style)
        const iconPulse = Math.sin(time) * (isReady ? 5 : 3);
        const iconSize = 26 + iconPulse;

        // Dramatic outer glow when close to ready
        if (isClose) {
            const glowIntensity = isReady ? 0.5 : 0.25;
            const glowSize = isReady ? 50 : 35;

            // Multiple glow layers
            for (let i = 3; i >= 0; i--) {
                ctx.beginPath();
                ctx.arc(iconX, iconY, iconSize + glowSize - i * 10, 0, Math.PI * 2);
                const alpha = (glowIntensity - i * 0.1) * (0.7 + Math.sin(time * 3) * 0.3);
                ctx.fillStyle = isReady ? `rgba(255, 215, 0, ${alpha})` : `rgba(255, 200, 100, ${alpha * 0.7})`;
                ctx.fill();
            }

            // Spinning rays when ready
            if (isReady) {
                ctx.save();
                ctx.translate(iconX, iconY);
                ctx.rotate(time * 2);
                for (let i = 0; i < 8; i++) {
                    ctx.rotate(Math.PI / 4);
                    ctx.beginPath();
                    ctx.moveTo(0, iconSize + 5);
                    ctx.lineTo(0, iconSize + 25 + Math.sin(time * 5 + i) * 5);
                    ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 + Math.sin(time * 3 + i) * 0.3})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        // Icon background circle with gradient
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconSize, 0, Math.PI * 2);
        const iconGradient = ctx.createRadialGradient(iconX - 5, iconY - 5, 0, iconX, iconY, iconSize);
        iconGradient.addColorStop(0, isReady ? '#6a5a2a' : '#5a5a7a');
        iconGradient.addColorStop(0.5, isReady ? '#4a4a1a' : '#4a4a6a');
        iconGradient.addColorStop(1, isReady ? '#2a2a0a' : '#2a2a3a');
        ctx.fillStyle = iconGradient;
        ctx.fill();

        // Icon border
        ctx.strokeStyle = progress >= maxProgress ? '#ffd700' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Question mark or star icon
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = progress >= maxProgress ? '#ffd700' : 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(progress >= maxProgress ? '★' : '?', iconX, iconY);

        // Draw orbiting orbs with trails
        for (let i = 0; i < orbs.length; i++) {
            const orb = orbs[i];

            // Calculate position - spiral toward icon
            const x = iconX + Math.cos(orb.angle) * orb.radius;
            const y = iconY + Math.sin(orb.angle) * orb.radius;

            // Motion trail
            for (let t = 1; t <= 4; t++) {
                const trailAngle = orb.angle - t * 0.15;
                const trailX = iconX + Math.cos(trailAngle) * (orb.radius + t * 2);
                const trailY = iconY + Math.sin(trailAngle) * (orb.radius + t * 2);

                ctx.beginPath();
                ctx.arc(trailX, trailY, orb.displaySize * (1 - t * 0.2), 0, Math.PI * 2);
                ctx.fillStyle = orb.color;
                ctx.globalAlpha = 0.15 - t * 0.03;
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Orb glow
            ctx.beginPath();
            ctx.arc(x, y, orb.displaySize + 6, 0, Math.PI * 2);
            ctx.fillStyle = orb.color;
            ctx.shadowColor = orb.color;
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.4;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;

            // Main orb with shine
            ctx.beginPath();
            ctx.arc(x, y, orb.displaySize, 0, Math.PI * 2);
            const orbGradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, orb.displaySize * 1.5);
            orbGradient.addColorStop(0, '#ffffff');
            orbGradient.addColorStop(0.2, '#ffffff');
            orbGradient.addColorStop(0.4, orb.color);
            orbGradient.addColorStop(1, this.darkenColor(orb.color, 40));
            ctx.fillStyle = orbGradient;
            ctx.globalAlpha = orb.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Draw progress indicator dots (empty slots) with glow
        const dotRadius = 5;
        const dotSpacing = 15;
        const startX = iconX - ((maxProgress - 1) * dotSpacing) / 2;

        for (let i = 0; i < maxProgress; i++) {
            const dotX = startX + i * dotSpacing;
            const dotY = iconY + iconSize + 22;

            ctx.beginPath();
            ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);

            if (i < progress) {
                // Filled dot with glow
                const dotGradient = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, dotRadius);
                dotGradient.addColorStop(0, '#ffffff');
                dotGradient.addColorStop(0.5, '#00ffaa');
                dotGradient.addColorStop(1, '#00cc88');
                ctx.fillStyle = dotGradient;
                ctx.shadowColor = '#00ffaa';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                // Empty dot with subtle style
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }
}
