// UI Manager - Handles all DOM UI updates
export class UIManager {
    constructor() {
        this.elements = {
            score: document.getElementById('score'),
            highScore: document.getElementById('highScore'),
            multiplier: document.getElementById('multiplier'),
            message: document.getElementById('message'),
            gameOver: document.getElementById('gameOver'),
            finalScore: document.getElementById('finalScore'),
            bestScore: document.getElementById('bestScore'),
            newHighScore: document.getElementById('newHighScore'),
            powerupIndicator: document.getElementById('powerupIndicator'),
            themeUnlock: document.getElementById('themeUnlock'),
            unlockedThemeName: document.getElementById('unlockedThemeName'),
            comboPopup: document.getElementById('comboPopup'),
        };
    }

    updateScore(score) {
        this.elements.score.textContent = score;
    }

    updateHighScore(score) {
        this.elements.highScore.textContent = `BEST: ${score}`;
    }

    updateMultiplier(multiplier, active) {
        if (active && multiplier > 1) {
            this.elements.multiplier.textContent = `x${multiplier.toFixed(1)}`;
            this.elements.multiplier.classList.add('active');

            // Dynamic styling
            // Grow font size with multiplier
            const size = Math.min(20 + multiplier * 0.5, 40);
            this.elements.multiplier.style.fontSize = `${size}px`;

            // Fire effect at 50x
            if (multiplier >= 50) {
                this.elements.multiplier.classList.add('on-fire');
            } else {
                this.elements.multiplier.classList.remove('on-fire');
            }

            // Font weight
            if (multiplier >= 20) {
                this.elements.multiplier.style.fontWeight = '900';
            } else {
                this.elements.multiplier.style.fontWeight = '500';
            }
        } else {
            this.elements.multiplier.classList.remove('active');
            this.elements.multiplier.classList.remove('on-fire');
            this.elements.multiplier.style.fontSize = '20px';
        }
    }

    showMessage(show = true) {
        this.elements.message.style.display = show ? 'block' : 'none';
    }

    showGameOver(score, highScore, isNewHighScore) {
        this.elements.finalScore.textContent = score;
        this.elements.bestScore.textContent = highScore;
        this.elements.gameOver.style.display = 'block';
        this.elements.newHighScore.style.display = isNewHighScore ? 'block' : 'none';
    }

    hideGameOver() {
        this.elements.gameOver.style.display = 'none';
        this.elements.newHighScore.style.display = 'none';
    }

    updatePowerupIndicator(activePowerups, hasShield, powerupTypes) {
        let html = '';
        const now = Date.now();

        for (const [type, endTime] of Object.entries(activePowerups)) {
            if (endTime > now) {
                const info = powerupTypes[type];
                const remaining = Math.ceil((endTime - now) / 1000);
                html += `<span class="powerup-active" style="background: ${info.color}22; border: 1px solid ${info.color}; color: ${info.color}">${info.icon} ${remaining}s</span>`;
            }
        }

        if (hasShield) {
            const info = powerupTypes.shield;
            html += `<span class="powerup-active" style="background: ${info.color}22; border: 1px solid ${info.color}; color: ${info.color}">${info.icon} READY</span>`;
        }

        this.elements.powerupIndicator.innerHTML = html;
    }

    showThemeUnlock(themeName) {
        this.elements.unlockedThemeName.textContent = themeName;
        this.elements.themeUnlock.style.display = 'block';

        setTimeout(() => {
            this.elements.themeUnlock.style.display = 'none';
        }, 2000);
    }

    showComboPopup(text) {
        this.elements.comboPopup.textContent = text;
        this.elements.comboPopup.style.opacity = '1';
        this.elements.comboPopup.style.transform = 'translate(-50%, -50%) scale(1.2)';

        setTimeout(() => {
            this.elements.comboPopup.style.opacity = '0';
            this.elements.comboPopup.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 800);
    }
}
