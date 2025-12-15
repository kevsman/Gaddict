// Powerup Definitions
export const POWERUP_TYPES = {
    // DEFENSIVE POWERUPS (5)
    slowTime: {
        name: 'SLOW TIME',
        color: '#4ecdc4',
        duration: 5000,
        icon: '⏱️',
        description: 'Everything slows down',
    },
    shield: {
        name: 'SHIELD',
        color: '#ffd700',
        duration: 0,
        icon: '🛡️',
        description: 'Survive one hit',
    },
    ghost: {
        name: 'GHOST',
        color: '#88ccff',
        duration: 4000,
        icon: '👻',
        description: 'Phase through rings',
    },
    freeze: {
        name: 'FREEZE',
        color: '#00ffff',
        duration: 3000,
        icon: '❄️',
        description: 'Stop all rings',
    },
    invincible: {
        name: 'INVINCIBLE',
        color: '#ffd700',
        duration: 3000,
        icon: '⚡',
        description: 'Immune to everything',
    },
    
    // SIZE POWERUPS (4)
    tinyMode: {
        name: 'TINY MODE',
        color: '#ff6b6b',
        duration: 6000,
        icon: '🔬',
        description: 'Shrink to minimum',
    },
    giantMode: {
        name: 'GIANT MODE',
        color: '#ff8c00',
        duration: 5000,
        icon: '🦖',
        description: 'Grow to maximum',
    },
    pulse: {
        name: 'AUTO PULSE',
        color: '#ff77aa',
        duration: 5000,
        icon: '💓',
        description: 'Auto-size to fit rings',
    },
    elastic: {
        name: 'ELASTIC',
        color: '#77ddaa',
        duration: 6000,
        icon: '🎈',
        description: 'Faster size changes',
    },
    
    // SCORING POWERUPS (6)
    doublePoints: {
        name: '2X POINTS',
        color: '#a855f7',
        duration: 8000,
        icon: '⭐',
        description: 'Double all points',
    },
    triplePoints: {
        name: '3X POINTS',
        color: '#ff00ff',
        duration: 5000,
        icon: '💎',
        description: 'Triple all points',
    },
    perfectStreak: {
        name: 'PERFECT',
        color: '#ffff00',
        duration: 6000,
        icon: '✨',
        description: 'All passes are perfect',
    },
    comboKeeper: {
        name: 'COMBO LOCK',
        color: '#00ff88',
        duration: 8000,
        icon: '🔒',
        description: 'Combo never resets',
    },
    comboBoost: {
        name: 'COMBO BOOST',
        color: '#ff5500',
        duration: 0,
        icon: '🚀',
        description: 'Instantly add +10 combo',
    },
    jackpot: {
        name: 'JACKPOT',
        color: '#ffcc00',
        duration: 0,
        icon: '🎰',
        description: 'Random bonus points',
    },
    
    // ASSIST POWERUPS (6)
    magnetize: {
        name: 'MAGNET',
        color: '#ff69b4',
        duration: 5000,
        icon: '🧲',
        description: 'Easier ring passes',
    },
    wideGap: {
        name: 'WIDE GAP',
        color: '#98fb98',
        duration: 7000,
        icon: '🚪',
        description: 'Rings have bigger gaps',
    },
    slowRings: {
        name: 'SLOW RINGS',
        color: '#aaddff',
        duration: 6000,
        icon: '🐢',
        description: 'Rings move slower',
    },
    noDoubles: {
        name: 'NO DOUBLES',
        color: '#bbff99',
        duration: 8000,
        icon: '1️⃣',
        description: 'No double rings spawn',
    },
    autoPass: {
        name: 'AUTO PASS',
        color: '#ffaa55',
        duration: 3000,
        icon: '🤖',
        description: 'Rings pass automatically',
    },
    xray: {
        name: 'X-RAY',
        color: '#aaffaa',
        duration: 5000,
        icon: '👁️',
        description: 'See ring safe zones',
    },
    
    // RING MANIPULATION (5)
    clearRings: {
        name: 'CLEAR ALL',
        color: '#ff4444',
        duration: 0,
        icon: '💥',
        description: 'Destroy all rings',
    },
    reverseRings: {
        name: 'REVERSE',
        color: '#9966ff',
        duration: 4000,
        icon: '🔄',
        description: 'Rings move outward',
    },
    shrinkRings: {
        name: 'SHRINK RINGS',
        color: '#ff99cc',
        duration: 0,
        icon: '📉',
        description: 'All rings become smaller',
    },
    expandRings: {
        name: 'EXPAND RINGS',
        color: '#99ccff',
        duration: 0,
        icon: '📈',
        description: 'All rings become bigger',
    },
    convertRings: {
        name: 'CONVERT',
        color: '#66ff66',
        duration: 0,
        icon: '💚',
        description: 'All rings count as passed',
    },
    
    // SPECIAL / FUN POWERUPS (4)
    extraLife: {
        name: 'EXTRA LIFE',
        color: '#ff6699',
        duration: 0,
        icon: '❤️',
        description: 'Bank an extra shield',
    },
    rainbow: {
        name: 'RAINBOW',
        color: '#ff0000',
        duration: 6000,
        icon: '🌈',
        description: 'Disco party mode!',
    },
    gravity: {
        name: 'GRAVITY',
        color: '#8855ff',
        duration: 5000,
        icon: '🌀',
        description: 'Rings spiral inward',
    },
    mirror: {
        name: 'MIRROR',
        color: '#ccccff',
        duration: 4000,
        icon: '🪞',
        description: 'Controls are reversed',
    },
};
