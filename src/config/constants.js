// Game Constants
export const GAME_CONFIG = {
    BASE_RING_SPEED: 2,
    RING_SPAWN_INTERVAL_BASE: 1500,
    PLAYER_GROW_SPEED: 3,
    PLAYER_SHRINK_SPEED: 2.5,
    MIN_PLAYER_SIZE: 15,
    MAX_PLAYER_SIZE: 150,
    RING_THICKNESS: 8,
    GAP_BASE: 50,
    GAP_MIN: 22,
    POWERUP_SPAWN_CHANCE: 0.15,

    // Powerup progress (spiraling orbs) settings
    RINGS_FOR_POWERUP: 8,          // Rings to pass before powerup spawns
    POWERUP_ORB_ORBIT_RADIUS: 70,  // Starting orbit radius around icon
    POWERUP_ORB_SPEED: 0.03,       // Base orbit rotation speed
    POWERUP_ORB_SIZE: 6,           // Orb radius
};

// Storage Keys
export const STORAGE_KEYS = {
    HIGH_SCORE: 'pulseHighScore',
    UNLOCKED_THEMES: 'pulseUnlockedThemes',
    CURRENT_THEME: 'pulseCurrentTheme',
};
