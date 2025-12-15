// Input Handler - Manages all user input
export class InputHandler {
    constructor(canvas, onHoldStart, onHoldEnd, onThemeKey) {
        this.canvas = canvas;
        this.onHoldStart = onHoldStart;
        this.onHoldEnd = onHoldEnd;
        this.onThemeKey = onThemeKey;
        this.isHolding = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startHold();
        });

        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.endHold();
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.endHold();
        });

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startHold();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endHold();
        }, { passive: false });

        this.canvas.addEventListener('touchcancel', () => {
            this.endHold();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isHolding) {
                e.preventDefault();
                this.startHold();
            }
            if (e.code === 'KeyT') {
                this.onThemeKey?.();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.endHold();
            }
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.endHold();
            }
        });

        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    startHold() {
        this.isHolding = true;
        this.onHoldStart?.();
    }

    endHold() {
        this.isHolding = false;
        this.onHoldEnd?.();
    }
}
