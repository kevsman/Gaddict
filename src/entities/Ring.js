import { GAME_CONFIG } from '../config/constants.js';

// Ring Entity
export class Ring {
    constructor(screenSize, innerRadius, outerRadius, color) {
        this.radius = screenSize;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.gap = outerRadius - innerRadius;
        this.requiredSize = innerRadius + this.gap / 2;
        this.passed = false;
        this.color = color;
        this.isDouble = false;
        this.movingGap = false;
        this.gapAngle = 0;
        this.gapSpeed = 0;
    }

    update(speed) {
        this.radius -= speed;

        if (this.movingGap) {
            this.gapAngle += this.gapSpeed;
        }
    }

    isAtPlayer(playerSize) {
        return !this.passed && this.radius <= playerSize + GAME_CONFIG.RING_THICKNESS && this.radius >= playerSize - GAME_CONFIG.RING_THICKNESS * 2;
    }

    playerFitsGap(playerSize) {
        return playerSize >= this.innerRadius && playerSize <= this.outerRadius;
    }

    isPerfectPass(playerSize) {
        const perfectThreshold = this.gap * 0.25;
        const distFromCenter = Math.abs(playerSize - this.requiredSize);
        return distFromCenter < perfectThreshold;
    }

    markPassed(passedColor) {
        this.passed = true;
        this.color = passedColor;
    }

    shouldRemove() {
        return this.radius < -50;
    }

    hasPassed() {
        return !this.passed && this.radius < -GAME_CONFIG.RING_THICKNESS;
    }
}

// Ring Factory
export function createRing(screenSize, difficulty, patternMode, ringColor) {
    const difficultyFactor = Math.min(difficulty / 40, 1);
    const gap = GAME_CONFIG.GAP_BASE - (GAME_CONFIG.GAP_BASE - GAME_CONFIG.GAP_MIN) * difficultyFactor;

    const minInner = GAME_CONFIG.MIN_PLAYER_SIZE + 5;
    const maxInner = GAME_CONFIG.MAX_PLAYER_SIZE - gap - 10;
    const innerRadius = minInner + Math.random() * (maxInner - minInner);
    const outerRadius = innerRadius + gap;

    const ring = new Ring(screenSize, innerRadius, outerRadius, ringColor);

    // Pattern variations
    if (patternMode === 'double' && Math.random() < 0.4) {
        ring.isDouble = true;
    }

    if (patternMode === 'moving' && Math.random() < 0.3) {
        ring.movingGap = true;
        ring.gapAngle = Math.random() * Math.PI * 2;
        ring.gapSpeed = (Math.random() - 0.5) * 0.05;
    }

    return ring;
}
