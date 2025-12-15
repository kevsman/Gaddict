// Game Constants
export const GAME_CONFIG = {
    BASE_RING_SPEED: 3, // Starting speed
    RING_SPAWN_INTERVAL_BASE: 2000, // More time between rings (was 1500)
    PLAYER_GROW_SPEED: 3,
    PLAYER_SHRINK_SPEED: 2.5,
    MIN_PLAYER_SIZE: 15,
    MAX_PLAYER_SIZE: 150,
    RING_THICKNESS: 8,
    GAP_BASE: 65, // Bigger starting gap (was 50)
    GAP_MIN: 25, // Slightly bigger minimum gap (was 22)
    POWERUP_SPAWN_CHANCE: 0.15,

    // Psychological Hooks
    PHANTOM_HITBOX_FORGIVENESS: 0.12, // 12% smaller collision hitbox than visual
    HIT_STOP_DURATION: 50, // ms to freeze on death/major events
    PITCH_RAMP_SEMITONE: 1.059463, // Multiplier for one semitone up
    MAX_PITCH_MULTIPLIER: 2.0, // Cap pitch ramping
    ENDOWED_PROGRESS_PERCENT: 0.25, // Start next run with 25% powerup progress after high score

    // Sawtooth Difficulty Curve
    DIFFICULTY_WAVE_DURATION: 30000, // 30 seconds per wave
    DIFFICULTY_RECOVERY_PERCENT: 0.15, // Drop speed by 15% during recovery
    DIFFICULTY_RECOVERY_DURATION: 8000, // 8 seconds of recovery

    // Powerup progress (spiraling orbs) settings
    RINGS_FOR_POWERUP: 8, // Rings to pass before powerup spawns
    POWERUP_ORB_ORBIT_RADIUS: 70, // Starting orbit radius around icon
    POWERUP_ORB_SPEED: 0.03, // Base orbit rotation speed
    POWERUP_ORB_SIZE: 6, // Orb radius
};

// Storage Keys
export const STORAGE_KEYS = {
    HIGH_SCORE: 'pulseHighScore',
    UNLOCKED_THEMES: 'pulseUnlockedThemes',
    CURRENT_THEME: 'pulseCurrentTheme',
};
