class ProgressPanel {
    constructor() {
        console.log('ProgressPanel constructor called');
        this.container = null;
        this.levelNumber = null;
        this.xpFill = null;
        this.coinAmount = null;
    }

    initialize(containerId) {
        console.log('ProgressPanel initializing...');
        this.container = document.getElementById(containerId);
        
        // Create panel HTML
        const panel = document.createElement('div');
        panel.innerHTML = `
            <div id="currency-display" class="currency-display">
                <span id="coin-amount">0</span>
                <span class="coin-icon">🪙</span>
            </div>

            <div id="level-panel">
                <div id="level-number">Level 1</div>
                <div id="xp-bar">
                    <div id="xp-fill"></div>
                </div>
            </div>
        `;
        
        this.container.appendChild(panel);
        
        // Store references to elements we'll need to update
        this.levelNumber = document.getElementById('level-number');
        this.xpFill = document.getElementById('xp-fill');
        this.coinAmount = document.getElementById('coin-amount');

        // Set up message handling
        hytopia.onData(data => {
            console.log("Progress data received:", data);
            if (data.type === 'levelUpdate') {
                this.updateLevelDisplay(data);
            }
            else if (data.type === 'currencyUpdate') {
                document.getElementById('coin-amount').textContent = data.currency.coins.toLocaleString();
            }
        });
        console.log('ProgressPanel initialized');
    }

    updateLevelDisplay(data) {
        // Update level number
        this.levelNumber.textContent = `Level ${data.level}`;
        // Calculate XP progress percentage
        const progress = (data.currentXP / data.requiredXP) * 100;
        this.xpFill.style.width = `${progress}%`;
    }
}

// Make it globally available
window.ProgressPanel = new ProgressPanel();
console.log('ProgressPanel global object created');