// Pulse - The Impossible Size Game
// Hold to grow, release to shrink, fit through the rings

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const multiplierEl = document.getElementById('multiplier');
const messageEl = document.getElementById('message');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const newHighScoreEl = document.getElementById('newHighScore');
const powerupIndicatorEl = document.getElementById('powerupIndicator');
const themeUnlockEl = document.getElementById('themeUnlock');
const unlockedThemeNameEl = document.getElementById('unlockedThemeName');
const comboPopupEl = document.getElementById('comboPopup');

// ============================================
// SOUND SYSTEM
// ============================================
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.log('Audio not supported');
            this.enabled = false;
        }
    }
    
    play(type) {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        switch(type) {
            case 'pass':
                this.playTone(440, 0.1, 'sine', 0.3);
                this.playTone(554, 0.1, 'sine', 0.3, 0.05);
                break;
            case 'perfect':
                this.playTone(523, 0.15, 'sine', 0.4);
                this.playTone(659, 0.15, 'sine', 0.4, 0.08);
                this.playTone(784, 0.15, 'sine', 0.4, 0.16);
                break;
            case 'combo':
                this.playTone(698, 0.2, 'sine', 0.5);
                this.playTone(880, 0.2, 'sine', 0.5, 0.1);
                break;
            case 'powerup':
                this.playTone(392, 0.15, 'square', 0.2);
                this.playTone(523, 0.15, 'square', 0.2, 0.1);
                this.playTone(659, 0.15, 'square', 0.2, 0.2);
                this.playTone(784, 0.2, 'square', 0.3, 0.3);
                break;
            case 'death':
                this.playTone(200, 0.3, 'sawtooth', 0.4);
                this.playTone(150, 0.3, 'sawtooth', 0.3, 0.1);
                this.playTone(100, 0.4, 'sawtooth', 0.2, 0.2);
                break;
            case 'whoosh':
                this.playNoise(0.1, 0.15);
                break;
            case 'unlock':
                this.playTone(523, 0.2, 'sine', 0.4);
                this.playTone(659, 0.2, 'sine', 0.4, 0.15);
                this.playTone(784, 0.2, 'sine', 0.4, 0.3);
                this.playTone(1047, 0.3, 'sine', 0.5, 0.45);
                break;
            case 'shield':
                this.playTone(300, 0.2, 'triangle', 0.3);
                break;
        }
    }
    
    playTone(frequency, duration, type = 'sine', volume = 0.3, delay = 0) {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        
        oscillator.start(ctx.currentTime + delay);
        oscillator.stop(ctx.currentTime + delay + duration);
    }
    
    playNoise(duration, volume = 0.2) {
        const ctx = this.audioContext;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        noise.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        noise.start();
        noise.stop(ctx.currentTime + duration);
    }
}

const sound = new SoundSystem();

// ============================================
// HAPTIC FEEDBACK
// ============================================
class HapticSystem {
    constructor() {
        this.enabled = 'vibrate' in navigator;
    }
    
    light() {
        if (this.enabled) navigator.vibrate(10);
    }
    
    medium() {
        if (this.enabled) navigator.vibrate(25);
    }
    
    heavy() {
        if (this.enabled) navigator.vibrate([50, 30, 50]);
    }
    
    success() {
        if (this.enabled) navigator.vibrate([10, 50, 20]);
    }
    
    death() {
        if (this.enabled) navigator.vibrate([100, 50, 100, 50, 150]);
    }
}

const haptic = new HapticSystem();

// ============================================
// THEME SYSTEM
// ============================================
const THEMES = {
    default: {
        name: 'Neon',
        unlockScore: 0,
        background: '#0a0a0f',
        player: '#00ffaa',
        playerGlow: 'rgba(0, 255, 170, 0.3)',
        ring: '#ffffff',
        ringPassed: '#00ffaa',
        ringFail: '#ff4466',
        accent: '#00ffaa'
    },
    sunset: {
        name: 'Sunset',
        unlockScore: 10,
        background: '#1a0a1f',
        player: '#ff6b6b',
        playerGlow: 'rgba(255, 107, 107, 0.3)',
        ring: '#ffd93d',
        ringPassed: '#ff6b6b',
        ringFail: '#c44569',
        accent: '#ff6b6b'
    },
    ocean: {
        name: 'Ocean',
        unlockScore: 25,
        background: '#0a1628',
        player: '#4ecdc4',
        playerGlow: 'rgba(78, 205, 196, 0.3)',
        ring: '#a8e6cf',
        ringPassed: '#4ecdc4',
        ringFail: '#ff6b6b',
        accent: '#4ecdc4'
    },
    synthwave: {
        name: 'Synthwave',
        unlockScore: 50,
        background: '#0f0728',
        player: '#f706cf',
        playerGlow: 'rgba(247, 6, 207, 0.3)',
        ring: '#00fff9',
        ringPassed: '#f706cf',
        ringFail: '#ff2a6d',
        accent: '#f706cf'
    },
    monochrome: {
        name: 'Monochrome',
        unlockScore: 75,
        background: '#0a0a0a',
        player: '#ffffff',
        playerGlow: 'rgba(255, 255, 255, 0.2)',
        ring: '#666666',
        ringPassed: '#ffffff',
        ringFail: '#333333',
        accent: '#ffffff'
    },
    gold: {
        name: 'Golden',
        unlockScore: 100,
        background: '#1a1408',
        player: '#ffd700',
        playerGlow: 'rgba(255, 215, 0, 0.3)',
        ring: '#fff8dc',
        ringPassed: '#ffd700',
        ringFail: '#ff4500',
        accent: '#ffd700'
    }
};

// ============================================
// POWERUP SYSTEM
// ============================================
const POWERUP_TYPES = {
    slowTime: {
        name: 'SLOW TIME',
        color: '#4ecdc4',
        duration: 5000,
        icon: '⏱️'
    },
    shield: {
        name: 'SHIELD',
        color: '#ffd700',
        duration: 0, // One-time use
        icon: '🛡️'
    },
    autoSize: {
        name: 'AUTO SIZE',
        color: '#ff6b6b',
        duration: 4000,
        icon: '🎯'
    },
    doublePoints: {
        name: '2X POINTS',
        color: '#a855f7',
        duration: 8000,
        icon: '⭐'
    }
};

// ============================================
// GAME CONSTANTS
// ============================================
const BASE_RING_SPEED = 2;
const RING_SPAWN_INTERVAL_BASE = 1500;
const PLAYER_GROW_SPEED = 3;
const PLAYER_SHRINK_SPEED = 2.5;
const MIN_PLAYER_SIZE = 15;
const MAX_PLAYER_SIZE = 150;
const RING_THICKNESS = 8;
const GAP_BASE = 50;
const GAP_MIN = 22;
const POWERUP_SPAWN_CHANCE = 0.15;

// ============================================
// GAME STATE
// ============================================
let gameState = {
    isPlaying: false,
    isHolding: false,
    score: 0,
    displayScore: 0,
    highScore: parseInt(localStorage.getItem('pulseHighScore')) || 0,
    playerSize: 40,
    targetSize: 40,
    rings: [],
    powerups: [],
    lastRingSpawn: 0,
    ringSpeed: BASE_RING_SPEED,
    ringSpawnInterval: RING_SPAWN_INTERVAL_BASE,
    difficulty: 1,
    screenShake: 0,
    particles: [],
    combo: 0,
    perfectStreak: 0,
    maxCombo: 0,
    multiplier: 1,
    
    // Powerup states
    activePowerups: {},
    hasShield: false,
    slowTimeActive: false,
    autoSizeActive: false,
    doublePointsActive: false,
    
    // Theme
    currentTheme: 'default',
    unlockedThemes: JSON.parse(localStorage.getItem('pulseUnlockedThemes')) || ['default'],
    
    // Ring patterns
    patternMode: 'normal', // 'normal', 'double', 'moving'
    nextPatternChange: 15,
    
    // Visual effects
    pulseEffect: 0,
    backgroundPulse: 0
};

// Get current theme colors
function getColors() {
    return THEMES[gameState.currentTheme] || THEMES.default;
}

// Screen dimensions
let width, height, centerX, centerY;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    centerX = width / 2;
    centerY = height / 2;
}

resize();
window.addEventListener('resize', resize);

// ============================================
// INPUT HANDLING
// ============================================
function startHold() {
    sound.init();
    gameState.isHolding = true;
    if (!gameState.isPlaying) {
        startGame();
    }
}

function endHold() {
    gameState.isHolding = false;
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startHold();
});

canvas.addEventListener('mouseup', (e) => {
    e.preventDefault();
    endHold();
});

canvas.addEventListener('mouseleave', () => {
    endHold();
});

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startHold();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    endHold();
}, { passive: false });

canvas.addEventListener('touchcancel', () => {
    endHold();
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !gameState.isHolding) {
        e.preventDefault();
        startHold();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        endHold();
    }
});

// ============================================
// GAME FUNCTIONS
// ============================================
function startGame() {
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.displayScore = 0;
    gameState.playerSize = 40;
    gameState.targetSize = 40;
    gameState.rings = [];
    gameState.powerups = [];
    gameState.lastRingSpawn = Date.now();
    gameState.ringSpeed = BASE_RING_SPEED;
    gameState.ringSpawnInterval = RING_SPAWN_INTERVAL_BASE;
    gameState.difficulty = 1;
    gameState.particles = [];
    gameState.combo = 0;
    gameState.perfectStreak = 0;
    gameState.maxCombo = 0;
    gameState.multiplier = 1;
    gameState.patternMode = 'normal';
    gameState.nextPatternChange = 15;
    
    // Reset powerups
    gameState.activePowerups = {};
    gameState.hasShield = false;
    gameState.slowTimeActive = false;
    gameState.autoSizeActive = false;
    gameState.doublePointsActive = false;
    
    updatePowerupIndicator();
    
    messageEl.style.display = 'none';
    gameOverEl.style.display = 'none';
    newHighScoreEl.style.display = 'none';
    multiplierEl.classList.remove('active');
    
    // Spawn first ring
    spawnRing();
}

function gameOver() {
    gameState.isPlaying = false;
    gameState.screenShake = 20;
    
    sound.play('death');
    haptic.death();
    
    const isNewHighScore = gameState.score > gameState.highScore;
    
    if (isNewHighScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('pulseHighScore', gameState.highScore);
    }
    
    finalScoreEl.textContent = gameState.score;
    bestScoreEl.textContent = gameState.highScore;
    highScoreEl.textContent = `BEST: ${gameState.highScore}`;
    
    // Delay showing game over screen
    setTimeout(() => {
        if (!gameState.isPlaying) {
            gameOverEl.style.display = 'block';
            if (isNewHighScore) {
                newHighScoreEl.style.display = 'block';
            }
        }
    }, 500);
    
    // Create explosion particles
    const colors = getColors();
    for (let i = 0; i < 40; i++) {
        const angle = (Math.PI * 2 * i) / 40;
        gameState.particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * (3 + Math.random() * 6),
            vy: Math.sin(angle) * (3 + Math.random() * 6),
            size: 3 + Math.random() * 6,
            life: 1,
            color: colors.ringFail
        });
    }
}

function spawnRing() {
    const colors = getColors();
    
    // Calculate gap size based on difficulty
    const difficultyFactor = Math.min(gameState.difficulty / 40, 1);
    const gap = GAP_BASE - (GAP_BASE - GAP_MIN) * difficultyFactor;
    
    // Random inner radius that ensures the ring is passable
    const minInner = MIN_PLAYER_SIZE + 5;
    const maxInner = MAX_PLAYER_SIZE - gap - 10;
    const innerRadius = minInner + Math.random() * (maxInner - minInner);
    const outerRadius = innerRadius + gap;
    
    // Calculate required player size for this ring (middle of the gap)
    const requiredSize = innerRadius + gap / 2;
    
    const ring = {
        radius: Math.max(width, height),
        innerRadius: innerRadius,
        outerRadius: outerRadius,
        requiredSize: requiredSize,
        gap: gap,
        passed: false,
        color: colors.ring,
        alpha: 1,
        isDouble: false,
        movingGap: false,
        gapAngle: 0,
        gapSpeed: 0
    };
    
    // Pattern variations based on score
    if (gameState.patternMode === 'double' && Math.random() < 0.4) {
        ring.isDouble = true;
    }
    
    if (gameState.patternMode === 'moving' && Math.random() < 0.3) {
        ring.movingGap = true;
        ring.gapAngle = Math.random() * Math.PI * 2;
        ring.gapSpeed = (Math.random() - 0.5) * 0.05;
    }
    
    gameState.rings.push(ring);
    
    // Maybe spawn a powerup
    if (Math.random() < POWERUP_SPAWN_CHANCE && gameState.score > 5) {
        spawnPowerup();
    }
}

function spawnPowerup() {
    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const powerupInfo = POWERUP_TYPES[type];
    
    // Random size for the powerup ring
    const size = MIN_PLAYER_SIZE + Math.random() * (MAX_PLAYER_SIZE - MIN_PLAYER_SIZE);
    
    gameState.powerups.push({
        radius: Math.max(width, height) * 0.7,
        size: size,
        type: type,
        color: powerupInfo.color,
        collected: false,
        pulsePhase: 0
    });
}

function activatePowerup(type) {
    const powerupInfo = POWERUP_TYPES[type];
    
    sound.play('powerup');
    haptic.success();
    
    // Show combo popup with powerup name
    showComboPopup(powerupInfo.icon + ' ' + powerupInfo.name);
    
    switch(type) {
        case 'slowTime':
            gameState.slowTimeActive = true;
            gameState.activePowerups.slowTime = Date.now() + powerupInfo.duration;
            break;
        case 'shield':
            gameState.hasShield = true;
            sound.play('shield');
            break;
        case 'autoSize':
            gameState.autoSizeActive = true;
            gameState.activePowerups.autoSize = Date.now() + powerupInfo.duration;
            break;
        case 'doublePoints':
            gameState.doublePointsActive = true;
            gameState.activePowerups.doublePoints = Date.now() + powerupInfo.duration;
            break;
    }
    
    updatePowerupIndicator();
    
    // Create collection particles
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        gameState.particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * (2 + Math.random() * 3),
            vy: Math.sin(angle) * (2 + Math.random() * 3),
            size: 4 + Math.random() * 4,
            life: 1,
            color: powerupInfo.color
        });
    }
}

function updatePowerupIndicator() {
    let html = '';
    const now = Date.now();
    
    for (const [type, endTime] of Object.entries(gameState.activePowerups)) {
        if (endTime > now) {
            const info = POWERUP_TYPES[type];
            const remaining = Math.ceil((endTime - now) / 1000);
            html += `<span class="powerup-active" style="background: ${info.color}22; border: 1px solid ${info.color}; color: ${info.color}">${info.icon} ${remaining}s</span>`;
        }
    }
    
    if (gameState.hasShield) {
        const info = POWERUP_TYPES.shield;
        html += `<span class="powerup-active" style="background: ${info.color}22; border: 1px solid ${info.color}; color: ${info.color}">${info.icon} READY</span>`;
    }
    
    powerupIndicatorEl.innerHTML = html;
}

function updatePowerups() {
    const now = Date.now();
    
    // Check expired powerups
    if (gameState.activePowerups.slowTime && now > gameState.activePowerups.slowTime) {
        gameState.slowTimeActive = false;
        delete gameState.activePowerups.slowTime;
    }
    
    if (gameState.activePowerups.autoSize && now > gameState.activePowerups.autoSize) {
        gameState.autoSizeActive = false;
        delete gameState.activePowerups.autoSize;
    }
    
    if (gameState.activePowerups.doublePoints && now > gameState.activePowerups.doublePoints) {
        gameState.doublePointsActive = false;
        delete gameState.activePowerups.doublePoints;
    }
    
    updatePowerupIndicator();
}

function updateDifficulty() {
    gameState.difficulty = 1 + gameState.score * 0.12;
    gameState.ringSpeed = BASE_RING_SPEED + gameState.score * 0.06;
    gameState.ringSpawnInterval = Math.max(700, RING_SPAWN_INTERVAL_BASE - gameState.score * 25);
    
    // Pattern mode changes
    if (gameState.score >= gameState.nextPatternChange) {
        if (gameState.patternMode === 'normal') {
            gameState.patternMode = 'double';
            gameState.nextPatternChange = gameState.score + 15;
        } else if (gameState.patternMode === 'double') {
            gameState.patternMode = 'moving';
            gameState.nextPatternChange = gameState.score + 20;
        } else {
            // Cycle back but with harder parameters
            gameState.patternMode = 'normal';
            gameState.nextPatternChange = gameState.score + 10;
        }
    }
}

function checkThemeUnlocks() {
    for (const [themeId, theme] of Object.entries(THEMES)) {
        if (!gameState.unlockedThemes.includes(themeId) && gameState.score >= theme.unlockScore) {
            gameState.unlockedThemes.push(themeId);
            localStorage.setItem('pulseUnlockedThemes', JSON.stringify(gameState.unlockedThemes));
            
            // Show unlock notification
            sound.play('unlock');
            haptic.heavy();
            
            unlockedThemeNameEl.textContent = theme.name;
            themeUnlockEl.style.display = 'block';
            
            // Auto-switch to new theme
            gameState.currentTheme = themeId;
            document.body.style.background = theme.background;
            
            setTimeout(() => {
                themeUnlockEl.style.display = 'none';
            }, 2000);
            
            break; // Only unlock one at a time
        }
    }
}

function showComboPopup(text) {
    comboPopupEl.textContent = text;
    comboPopupEl.style.opacity = '1';
    comboPopupEl.style.transform = 'translate(-50%, -50%) scale(1.2)';
    
    setTimeout(() => {
        comboPopupEl.style.opacity = '0';
        comboPopupEl.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 800);
}

function createPassParticles(ring, isPerfect) {
    const colors = getColors();
    const particleCount = isPerfect ? 25 : 12;
    const color = isPerfect ? '#ffff00' : colors.playerGlow;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        gameState.particles.push({
            x: centerX + Math.cos(angle) * gameState.playerSize,
            y: centerY + Math.sin(angle) * gameState.playerSize,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 4,
            life: 1,
            color: color
        });
    }
}

// ============================================
// UPDATE LOOP
// ============================================
function update(deltaTime) {
    const colors = getColors();
    
    // Update screen shake
    if (gameState.screenShake > 0) {
        gameState.screenShake *= 0.9;
        if (gameState.screenShake < 0.1) gameState.screenShake = 0;
    }
    
    // Update visual effects
    gameState.pulseEffect += 0.05;
    gameState.backgroundPulse = Math.sin(gameState.pulseEffect) * 0.5 + 0.5;
    
    // Update particles
    gameState.particles = gameState.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life -= 0.025;
        p.size *= 0.97;
        return p.life > 0;
    });
    
    // Smooth score display
    if (gameState.displayScore < gameState.score) {
        gameState.displayScore += Math.ceil((gameState.score - gameState.displayScore) * 0.2);
        if (gameState.displayScore > gameState.score) gameState.displayScore = gameState.score;
        scoreEl.textContent = gameState.displayScore;
    }
    
    if (!gameState.isPlaying) return;
    
    // Update powerups
    updatePowerups();
    
    // Calculate effective ring speed (affected by slow time)
    const effectiveRingSpeed = gameState.slowTimeActive ? gameState.ringSpeed * 0.4 : gameState.ringSpeed;
    
    // Auto-size powerup: automatically adjust to fit upcoming ring
    if (gameState.autoSizeActive && gameState.rings.length > 0) {
        const nearestRing = gameState.rings.find(r => !r.passed && r.radius > 0);
        if (nearestRing && nearestRing.radius < 300) {
            gameState.targetSize = nearestRing.requiredSize;
        }
    } else {
        // Normal size control
        if (gameState.isHolding) {
            gameState.targetSize = Math.min(MAX_PLAYER_SIZE, gameState.targetSize + PLAYER_GROW_SPEED);
        } else {
            gameState.targetSize = Math.max(MIN_PLAYER_SIZE, gameState.targetSize - PLAYER_SHRINK_SPEED);
        }
    }
    
    // Smooth size interpolation
    gameState.playerSize += (gameState.targetSize - gameState.playerSize) * 0.15;
    
    // Spawn rings
    const now = Date.now();
    const effectiveSpawnInterval = gameState.slowTimeActive ? gameState.ringSpawnInterval * 1.5 : gameState.ringSpawnInterval;
    if (now - gameState.lastRingSpawn > effectiveSpawnInterval) {
        spawnRing();
        gameState.lastRingSpawn = now;
        sound.play('whoosh');
    }
    
    // Update powerup collectibles
    for (let powerup of gameState.powerups) {
        if (powerup.collected) continue;
        
        powerup.radius -= effectiveRingSpeed * 0.8;
        powerup.pulsePhase += 0.1;
        
        // Check collection
        const playerRadius = gameState.playerSize;
        const diff = Math.abs(powerup.radius - playerRadius);
        
        if (diff < 20 && Math.abs(playerRadius - powerup.size) < 15) {
            powerup.collected = true;
            activatePowerup(powerup.type);
        }
    }
    
    // Remove collected/passed powerups
    gameState.powerups = gameState.powerups.filter(p => !p.collected && p.radius > -50);
    
    // Update rings
    for (let ring of gameState.rings) {
        ring.radius -= effectiveRingSpeed;
        
        // Update moving gap
        if (ring.movingGap) {
            ring.gapAngle += ring.gapSpeed;
        }
        
        // Check collision when ring passes through center
        const playerRadius = gameState.playerSize;
        const ringCenter = ring.radius;
        
        // Ring is at player position
        if (!ring.passed && ringCenter <= playerRadius + RING_THICKNESS && ringCenter >= playerRadius - RING_THICKNESS * 2) {
            // Check if player fits through the gap
            if (playerRadius >= ring.innerRadius && playerRadius <= ring.outerRadius) {
                // Success!
                ring.passed = true;
                ring.color = colors.ringPassed;
                
                // Check for perfect pass
                const perfectThreshold = ring.gap * 0.25;
                const distFromCenter = Math.abs(playerRadius - ring.requiredSize);
                const isPerfect = distFromCenter < perfectThreshold;
                
                if (isPerfect) {
                    gameState.perfectStreak++;
                    gameState.combo++;
                    if (gameState.combo > gameState.maxCombo) {
                        gameState.maxCombo = gameState.combo;
                    }
                    sound.play('perfect');
                } else {
                    gameState.perfectStreak = 0;
                    gameState.combo = 0;
                    sound.play('pass');
                }
                
                // Calculate multiplier based on combo
                gameState.multiplier = 1 + Math.floor(gameState.combo / 3) * 0.5;
                if (gameState.doublePointsActive) gameState.multiplier *= 2;
                
                // Add score
                const points = Math.floor(1 * gameState.multiplier);
                gameState.score += points;
                
                // Update multiplier display
                if (gameState.multiplier > 1) {
                    multiplierEl.textContent = `x${gameState.multiplier.toFixed(1)}`;
                    multiplierEl.classList.add('active');
                } else {
                    multiplierEl.classList.remove('active');
                }
                
                // Show combo popup
                if (gameState.combo > 0 && gameState.combo % 5 === 0) {
                    showComboPopup(`🔥 ${gameState.combo} COMBO!`);
                    sound.play('combo');
                    haptic.medium();
                } else {
                    haptic.light();
                }
                
                updateDifficulty();
                checkThemeUnlocks();
                
                createPassParticles(ring, isPerfect);
            } else {
                // Fail! Check for shield
                if (gameState.hasShield) {
                    gameState.hasShield = false;
                    ring.passed = true;
                    ring.color = '#ffd700';
                    sound.play('shield');
                    haptic.medium();
                    showComboPopup('🛡️ SHIELD USED!');
                    updatePowerupIndicator();
                    
                    // Reset combo
                    gameState.combo = 0;
                    gameState.multiplier = 1;
                    multiplierEl.classList.remove('active');
                } else {
                    ring.color = colors.ringFail;
                    gameOver();
                    return;
                }
            }
        }
        
        // Check if ring passed without being handled
        if (!ring.passed && ringCenter < -RING_THICKNESS) {
            if (gameState.hasShield) {
                gameState.hasShield = false;
                ring.passed = true;
                updatePowerupIndicator();
            } else {
                ring.color = colors.ringFail;
                gameOver();
                return;
            }
        }
    }
    
    // Remove rings that are too small
    gameState.rings = gameState.rings.filter(r => r.radius > -50);
}

// ============================================
// DRAW LOOP
// ============================================
function draw() {
    const colors = getColors();
    
    // Apply screen shake
    ctx.save();
    if (gameState.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * gameState.screenShake;
        const shakeY = (Math.random() - 0.5) * gameState.screenShake;
        ctx.translate(shakeX, shakeY);
    }
    
    // Clear canvas with theme background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Draw subtle grid/pulse effect
    const pulse = gameState.backgroundPulse;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.02 + pulse * 0.02})`;
    ctx.lineWidth = 1;
    for (let r = 50; r < Math.max(width, height); r += 100) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Draw powerup collectibles
    for (let powerup of gameState.powerups) {
        if (powerup.collected || powerup.radius < 0) continue;
        
        const pulseSize = Math.sin(powerup.pulsePhase) * 5;
        
        // Draw powerup ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, powerup.radius, 0, Math.PI * 2);
        ctx.strokeStyle = powerup.color;
        ctx.lineWidth = 4 + pulseSize;
        ctx.globalAlpha = 0.6 + Math.sin(powerup.pulsePhase) * 0.3;
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw target size indicator
        ctx.beginPath();
        ctx.arc(centerX, centerY, powerup.size, 0, Math.PI * 2);
        ctx.strokeStyle = powerup.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
    
    // Draw rings
    for (let ring of gameState.rings) {
        if (ring.radius < 0) continue;
        
        // Main ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = RING_THICKNESS;
        ctx.globalAlpha = Math.min(1, ring.radius / 200);
        ctx.stroke();
        
        // Draw gap indicators (only for upcoming rings)
        if (!ring.passed && ring.radius > gameState.playerSize) {
            ctx.globalAlpha = Math.min(0.4, ring.radius / 300);
            
            // Inner boundary
            ctx.beginPath();
            ctx.arc(centerX, centerY, ring.innerRadius, 0, Math.PI * 2);
            ctx.strokeStyle = ring.color;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 10]);
            ctx.stroke();
            
            // Outer boundary
            ctx.beginPath();
            ctx.arc(centerX, centerY, ring.outerRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.setLineDash([]);
        }
        
        // Double ring indicator
        if (ring.isDouble && !ring.passed) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, ring.radius - 15, 0, Math.PI * 2);
            ctx.strokeStyle = ring.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = Math.min(0.5, ring.radius / 200);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }
    
    // Draw particles
    for (let p of gameState.particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Draw player
    // Shield glow if active
    if (gameState.hasShield) {
        const shieldGlow = ctx.createRadialGradient(
            centerX, centerY, gameState.playerSize,
            centerX, centerY, gameState.playerSize + 30
        );
        shieldGlow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        shieldGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = shieldGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, gameState.playerSize + 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Shield ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, gameState.playerSize + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Auto-size indicator
    if (gameState.autoSizeActive) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, gameState.targetSize, 0, Math.PI * 2);
        ctx.strokeStyle = POWERUP_TYPES.autoSize.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }
    
    // Glow effect
    const glowSize = gameState.playerSize + 20;
    const gradient = ctx.createRadialGradient(
        centerX, centerY, gameState.playerSize * 0.5,
        centerX, centerY, glowSize
    );
    gradient.addColorStop(0, colors.playerGlow);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Main player circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, gameState.playerSize, 0, Math.PI * 2);
    ctx.fillStyle = colors.player;
    ctx.fill();
    
    // Inner highlight
    const innerGradient = ctx.createRadialGradient(
        centerX - gameState.playerSize * 0.3, 
        centerY - gameState.playerSize * 0.3, 
        0,
        centerX, centerY, gameState.playerSize
    );
    innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    innerGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = innerGradient;
    ctx.fill();
    
    // Draw size indicator when holding
    if (gameState.isHolding && gameState.isPlaying && !gameState.autoSizeActive) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, gameState.playerSize, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Slow time visual effect
    if (gameState.slowTimeActive) {
        ctx.fillStyle = `rgba(78, 205, 196, ${0.05 + Math.sin(Date.now() * 0.005) * 0.03})`;
        ctx.fillRect(0, 0, width, height);
    }
    
    ctx.restore();
}

// ============================================
// GAME LOOP
// ============================================
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    update(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

// ============================================
// INITIALIZE
// ============================================
highScoreEl.textContent = `BEST: ${gameState.highScore}`;

// Set initial theme background
document.body.style.background = getColors().background;

// Apply last used theme if unlocked
const savedTheme = localStorage.getItem('pulseCurrentTheme');
if (savedTheme && gameState.unlockedThemes.includes(savedTheme)) {
    gameState.currentTheme = savedTheme;
    document.body.style.background = getColors().background;
}

requestAnimationFrame(gameLoop);

// Prevent context menu on long press
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        gameState.isHolding = false;
    }
});

// Cycle themes with 'T' key (for testing)
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyT' && !gameState.isPlaying) {
        const themes = gameState.unlockedThemes;
        const currentIndex = themes.indexOf(gameState.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        gameState.currentTheme = themes[nextIndex];
        localStorage.setItem('pulseCurrentTheme', gameState.currentTheme);
        document.body.style.background = getColors().background;
    }
});
