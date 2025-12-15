// Particle System - Manages visual particle effects
export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /**
     * Create particles in a burst pattern with sparkles
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {string} color - Particle color
     * @param {number} count - Number of particles
     * @param {object} options - Additional options
     */
    burst(x, y, color, count = 20, options = {}) {
        const { minSpeed = 2, maxSpeed = 5, minSize = 2, maxSize = 6, spread = Math.PI * 2, startAngle = 0 } = options;

        for (let i = 0; i < count; i++) {
            const angle = startAngle + (spread * i) / count + (Math.random() - 0.5) * 0.3;
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: minSize + Math.random() * (maxSize - minSize),
                life: 1,
                color,
                sparkle: Math.random() > 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
            });
        }

        // Add some extra tiny sparkles
        for (let i = 0; i < count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = maxSpeed + Math.random() * 3;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                life: 0.7,
                color: '#ffffff',
                sparkle: true,
            });
        }
    }

    /**
     * Create particles around a radius with trail effect
     * @param {number} centerX - Center X position
     * @param {number} centerY - Center Y position
     * @param {number} radius - Radius to spawn particles at
     * @param {string} color - Particle color
     * @param {number} count - Number of particles
     */
    ring(centerX, centerY, radius, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 3 + Math.random() * 5;

            this.particles.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                life: 1,
                color,
                sparkle: i % 3 === 0,
            });
        }

        // Inner sparkle ring
        for (let i = 0; i < count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: centerX + Math.cos(angle) * (radius * 0.8),
                y: centerY + Math.sin(angle) * (radius * 0.8),
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                size: 2 + Math.random() * 3,
                life: 0.8,
                color: '#ffffff',
                sparkle: true,
            });
        }
    }

    /**
     * Update all particles
     */
    update() {
        this.particles = this.particles.filter((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.life -= 0.022;
            p.size *= 0.96;
            if (p.rotation !== undefined) {
                p.rotation += p.rotationSpeed || 0;
            }
            return p.life > 0 && p.size > 0.5;
        });
    }

    /**
     * Draw all particles with glow effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        for (const p of this.particles) {
            ctx.save();

            if (p.sparkle) {
                // Draw sparkle as a 4-point star
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || Date.now() * 0.01);

                ctx.shadowColor = p.color;
                ctx.shadowBlur = 15 * p.life;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;

                // Star shape
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    const outerX = Math.cos(angle) * p.size * 2;
                    const outerY = Math.sin(angle) * p.size * 2;
                    const innerAngle = angle + Math.PI / 4;
                    const innerX = Math.cos(innerAngle) * p.size * 0.5;
                    const innerY = Math.sin(innerAngle) * p.size * 0.5;

                    if (i === 0) {
                        ctx.moveTo(outerX, outerY);
                    } else {
                        ctx.lineTo(outerX, outerY);
                    }
                    ctx.lineTo(innerX, innerY);
                }
                ctx.closePath();
                ctx.fill();

                // Bright center
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = p.life * 0.9;
                ctx.fill();
            } else {
                // Regular particle with outer glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size + 5, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life * 0.25;
                ctx.fill();

                // Main particle with gradient
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, p.color);
                gradient.addColorStop(1, p.color);

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 12 * p.life;
                ctx.globalAlpha = p.life;
                ctx.fill();
            }

            ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }
}
