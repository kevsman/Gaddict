// Pulse Game - Entry Point
import { Game } from './core/Game.js';

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Create and start the game
    const game = new Game(canvas);
    
    // Expose game instance for debugging (optional)
    window.game = game;
});
