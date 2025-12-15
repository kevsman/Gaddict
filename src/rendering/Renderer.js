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
        this.ctx.save();

        if (screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * screenShake;
            const shakeY = (Math.random() - 0.5) * screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    restore() {
        this.ctx.restore();
    }

    drawBackgroundGrid(pulse) {
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.02 + pulse * 0.02})`;
        this.ctx.lineWidth = 1;

        for (let r = 50; r < this.getScreenSize(); r += 100) {
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawTargetZone(ring, isPlaying) {
        if (!ring || !isPlaying) return;

        const ctx = this.ctx;

        // Draw filled zone (safe zone)
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ring.outerRadius, 0, Math.PI * 2);
        ctx.arc(this.centerX, this.centerY, ring.innerRadius, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(0, 255, 170, 0.15)';
        ctx.fill();

        // Boundary lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ring.innerRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ring.outerRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Perfect line
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ring.requiredSize, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawRing(ring) {
        if (ring.radius < 0) return;

        const ctx = this.ctx;

        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = GAME_CONFIG.RING_THICKNESS;
        ctx.globalAlpha = Math.min(1, ring.radius / 200);
        ctx.stroke();

        // Double ring indicator
        if (ring.isDouble && !ring.passed) {
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, ring.radius - 15, 0, Math.PI * 2);
            ctx.lineWidth = 3;
            ctx.globalAlpha = Math.min(0.5, ring.radius / 200);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }

    drawPowerup(powerup) {
        if (powerup.collected || powerup.radius < 0) return;

        const ctx = this.ctx;
        const pulseSize = Math.sin(powerup.pulsePhase) * 5;

        // Powerup ring
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, powerup.radius, 0, Math.PI * 2);
        ctx.strokeStyle = powerup.color;
        ctx.lineWidth = 4 + pulseSize;
        ctx.globalAlpha = 0.6 + Math.sin(powerup.pulsePhase) * 0.3;
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target size indicator
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, powerup.size, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.stroke();

        ctx.globalAlpha = 1;
    }

    drawPlayer(playerSize, colors, hasShield, autoSizeActive, targetSize, isHolding, isPlaying) {
        const ctx = this.ctx;

        // Shield glow
        if (hasShield) {
            const shieldGlow = ctx.createRadialGradient(this.centerX, this.centerY, playerSize, this.centerX, this.centerY, playerSize + 30);
            shieldGlow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            shieldGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = shieldGlow;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, playerSize + 30, 0, Math.PI * 2);
            ctx.fill();

            // Shield ring
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, playerSize + 5, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 8]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Auto-size indicator
        if (autoSizeActive) {
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, targetSize, 0, Math.PI * 2);
            ctx.strokeStyle = POWERUP_TYPES.autoSize.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        }

        // Glow effect
        const glowSize = playerSize + 20;
        const gradient = ctx.createRadialGradient(this.centerX, this.centerY, playerSize * 0.5, this.centerX, this.centerY, glowSize);
        gradient.addColorStop(0, colors.playerGlow);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Main player circle
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, playerSize, 0, Math.PI * 2);
        ctx.fillStyle = colors.player;
        ctx.fill();

        // Inner highlight
        const innerGradient = ctx.createRadialGradient(
            this.centerX - playerSize * 0.3,
            this.centerY - playerSize * 0.3,
            0,
            this.centerX,
            this.centerY,
            playerSize
        );
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        innerGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGradient;
        ctx.fill();

        // Holding indicator
        if (isHolding && isPlaying && !autoSizeActive) {
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, playerSize, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    drawSlowTimeEffect(active) {
        if (active) {
            this.ctx.fillStyle = `rgba(78, 205, 196, ${0.05 + Math.sin(Date.now() * 0.005) * 0.03})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}
