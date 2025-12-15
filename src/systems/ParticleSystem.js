// Particle System - Manages visual particle effects
export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /**
     * Create particles in a burst pattern
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {string} color - Particle color
     * @param {number} count - Number of particles
     * @param {object} options - Additional options
     */
    burst(x, y, color, count = 20, options = {}) {
        const {
            minSpeed = 2,
            maxSpeed = 5,
            minSize = 2,
            maxSize = 6,
            spread = Math.PI * 2,
            startAngle = 0,
        } = options;

        for (let i = 0; i < count; i++) {
            const angle = startAngle + (spread * i) / count;
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: minSize + Math.random() * (maxSize - minSize),
                life: 1,
                color,
            });
        }
    }

    /**
     * Create particles around a radius
     * @param {number} centerX - Center X position
     * @param {number} centerY - Center Y position
     * @param {number} radius - Radius to spawn particles at
     * @param {string} color - Particle color
     * @param {number} count - Number of particles
     */
    ring(centerX, centerY, radius, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            
            this.particles.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                life: 1,
                color,
            });
        }
    }

    /**
     * Update all particles
     */
    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= 0.025;
            p.size *= 0.97;
            return p.life > 0;
        });
    }

    /**
     * Draw all particles
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        for (const p of this.particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }
}
