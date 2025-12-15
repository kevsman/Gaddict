import { GAME_CONFIG } from '../config/constants.js';
import { POWERUP_TYPES } from '../config/powerups.js';

// Powerup Entity
export class Powerup {
    constructor(screenSize, type) {
        const powerupInfo = POWERUP_TYPES[type];

        this.radius = screenSize * 0.7;
        this.size = GAME_CONFIG.MIN_PLAYER_SIZE + Math.random() * (GAME_CONFIG.MAX_PLAYER_SIZE - GAME_CONFIG.MIN_PLAYER_SIZE);
        this.type = type;
        this.color = powerupInfo.color;
        this.collected = false;
        this.pulsePhase = 0;
    }

    update(speed) {
        this.radius -= speed * 0.8;
        this.pulsePhase += 0.1;
    }

    checkCollection(playerSize) {
        if (this.collected) return false;

        // Auto-collect when powerup ring reaches the player
        // Much simpler - just touch it to collect!
        if (this.radius <= playerSize + 15 && this.radius >= playerSize - 30) {
            this.collected = true;
            return true;
        }
        return false;
    }

    shouldRemove() {
        return this.collected || this.radius < -50;
    }
}

// Powerup Factory
export function createRandomPowerup(screenSize) {
    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    return new Powerup(screenSize, type);
}
