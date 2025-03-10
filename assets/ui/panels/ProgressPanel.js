class ProgressPanel {
    constructor() {
        console.log('ProgressPanel constructor called');
        this.container = null;
        this.levelNumber = null;
        this.xpFill = null;
        this.coinAmount = null;
        this.currentXP = 0;
        this.requiredXP = 100;
        this.initialized = false;
        
        // Add hotkeys UI
        this.createHotkeysUI();
    }

    createHotkeysUI() {
        const hotkeysPanel = document.createElement('div');
        hotkeysPanel.id = 'hotkeys-panel';
        hotkeysPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 200px;
            background-color: rgba(0, 0, 0, 0.3);
            padding: 8px;
            border-radius: 5px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            z-index: 1000;
        `;

        const hotkeys = [
            { key: 'I', action: 'Inventory' },
            { key: 'L', action: 'Leaderboard' },
            { key: 'H', action: 'Help' }
        ];

        const hotkeysList = hotkeys.map(({ key, action }) => 
            `<div class="hotkey-row" style="margin: 3px 0;">
                <span style="background-color: rgba(255, 255, 255, 0.1); padding: 1px 4px; border-radius: 3px; margin-right: 6px;">${key}</span>
                <span>${action}</span>
            </div>`
        ).join('');

        hotkeysPanel.innerHTML = hotkeysList;
        document.body.appendChild(hotkeysPanel);
    }

    initialize(containerId) {
        console.log('ProgressPanel initializing with container:', containerId);
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }
        
        // Create panel HTML
        const panel = document.createElement('div');
        panel.className = 'progress-panel';
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

        console.log('ProgressPanel elements initialized:', {
            levelNumber: this.levelNumber,
            xpFill: this.xpFill,
            coinAmount: this.coinAmount
        });

        // Set up message handling
        if (window.hytopia) {
            console.log('Setting up hytopia message handler in ProgressPanel');
            window.hytopia.onData(data => {
                
                if (data.type === 'levelUpdate') {
                    console.log('Processing levelUpdate message');
                    this.updateLevelDisplay(data);
                }
                else if (data.type === 'currencyUpdate') {
                    console.log('Processing currencyUpdate message');
                    this.updateCurrencyDisplay(data);
                }
            });
            
            // Signal that this component is ready
            console.log('Sending uiReady signal to server');
            window.hytopia.sendData({ type: 'uiReady' });
        } else {
            console.error('hytopia not available for message handling');
        }
        
        this.initialized = true;
    }

    updateLevelDisplay(data) {
        console.log('Updating level display:', data);
        
        // Update level number
        this.levelNumber.textContent = `Level ${data.level}`;
        
        // Store current XP values
        this.currentXP = data.xp || 0;
        this.requiredXP = data.nextLevelXP || 100;
        
        // Calculate XP progress percentage
        const progress = (this.currentXP / this.requiredXP) * 100;
        this.xpFill.style.width = `${progress}%`;
    }
    
    updateCurrencyDisplay(data) {
        console.log('Updating currency display:', data);
        
        // Handle both formats of currency data
        if (data.currency && data.currency.coins !== undefined) {
            this.coinAmount.textContent = data.currency.coins.toLocaleString();
        } else if (data.coins !== undefined) {
            this.coinAmount.textContent = data.coins.toLocaleString();
        }
    }
}

// Make it globally available
window.ProgressPanel = new ProgressPanel();
console.log('ProgressPanel global object created');