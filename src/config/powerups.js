// Powerup Definitions
export const POWERUP_TYPES = {
    // DEFENSIVE POWERUPS
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
    
    // SIZE POWERUPS
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
    
    // SCORING POWERUPS
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
    
    // ASSIST POWERUPS
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
    
    // SPECIAL POWERUPS
    clearRings: {
        name: 'CLEAR ALL',
        color: '#ff4444',
        duration: 0,
        icon: '💥',
        description: 'Destroy all rings',
    },
    extraLife: {
        name: 'EXTRA LIFE',
        color: '#ff6699',
        duration: 0,
        icon: '❤️',
        description: 'Bank an extra shield',
    },
    reverseRings: {
        name: 'REVERSE',
        color: '#9966ff',
        duration: 4000,
        icon: '🔄',
        description: 'Rings move outward',
    },
    rainbow: {
        name: 'RAINBOW',
        color: '#ff0000',
        duration: 6000,
        icon: '🌈',
        description: 'Disco party mode!',
    },
};
