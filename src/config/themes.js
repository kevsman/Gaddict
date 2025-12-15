// Theme Definitions - Vibrant, fun, mobile-game style colors
export const THEMES = {
    default: {
        name: 'Candy',
        unlockScore: 0,
        background: '#1a0a2e',           // Deep purple (not black!)
        backgroundGradient: ['#1a0a2e', '#2d1b4e', '#1a0a2e'], // Gradient colors
        player: '#ff6b9d',               // Bright pink
        playerGlow: 'rgba(255, 107, 157, 0.4)',
        ring: '#ffd93d',                 // Bright yellow
        ringPassed: '#7dff7d',           // Bright green
        ringFail: '#ff4757',             // Bright red
        accent: '#ff6b9d',
        particles: ['#ff6b9d', '#ffd93d', '#7dff7d', '#70a1ff', '#ff9ff3'], // Confetti colors
    },
    sunset: {
        name: 'Sunset',
        unlockScore: 10,
        background: '#2d1f3d',
        backgroundGradient: ['#2d1f3d', '#4a2c5a', '#2d1f3d'],
        player: '#ff9f43',               // Orange
        playerGlow: 'rgba(255, 159, 67, 0.4)',
        ring: '#ff6b81',                 // Coral
        ringPassed: '#ffc048',
        ringFail: '#ee5a52',
        accent: '#ff9f43',
        particles: ['#ff9f43', '#ff6b81', '#ffc048', '#ff85a2', '#ffd32a'],
    },
    ocean: {
        name: 'Ocean',
        unlockScore: 25,
        background: '#0c2461',
        backgroundGradient: ['#0c2461', '#1e3c72', '#0c2461'],
        player: '#00d2d3',               // Cyan
        playerGlow: 'rgba(0, 210, 211, 0.4)',
        ring: '#54a0ff',                 // Bright blue
        ringPassed: '#5ff3c0',           // Mint
        ringFail: '#ff6b6b',
        accent: '#00d2d3',
        particles: ['#00d2d3', '#54a0ff', '#5ff3c0', '#48dbfb', '#a29bfe'],
    },
    arcade: {
        name: 'Arcade',
        unlockScore: 50,
        background: '#2c003e',
        backgroundGradient: ['#2c003e', '#512b58', '#2c003e'],
        player: '#f706cf',               // Hot pink
        playerGlow: 'rgba(247, 6, 207, 0.4)',
        ring: '#00fff9',                 // Cyan
        ringPassed: '#f706cf',
        ringFail: '#ff2a6d',
        accent: '#f706cf',
        particles: ['#f706cf', '#00fff9', '#ff2a6d', '#a29bfe', '#ffeaa7'],
    },
    tropical: {
        name: 'Tropical',
        unlockScore: 75,
        background: '#1e3d59',
        backgroundGradient: ['#1e3d59', '#2a5470', '#1e3d59'],
        player: '#f5cd79',               // Golden yellow
        playerGlow: 'rgba(245, 205, 121, 0.4)',
        ring: '#ff7979',                 // Coral
        ringPassed: '#7bed9f',           // Mint green
        ringFail: '#ff4757',
        accent: '#f5cd79',
        particles: ['#f5cd79', '#ff7979', '#7bed9f', '#70a1ff', '#ff6b81'],
    },
    neon: {
        name: 'Neon',
        unlockScore: 100,
        background: '#0a0a1a',
        backgroundGradient: ['#0a0a1a', '#1a1a2e', '#0a0a1a'],
        player: '#00ff88',               // Neon green
        playerGlow: 'rgba(0, 255, 136, 0.4)',
        ring: '#ffffff',
        ringPassed: '#00ff88',
        ringFail: '#ff0055',
        accent: '#00ff88',
        particles: ['#00ff88', '#ff0055', '#00d4ff', '#ffff00', '#ff00ff'],
    },
};
