class JigPanel {
    constructor() {
        console.log('JigPanel constructor called');
        this.container = null;
        this.isActive = false;
    }

    initialize(containerId) {
        console.log('JigPanel initializing...');
        this.container = document.getElementById(containerId);
        
        // Create panel HTML
        const panel = document.createElement('div');
        panel.id = 'jig-ui';
        panel.innerHTML = `
            <div id="jigging-meter">
                <div class="meter-section top"></div>
                <div class="meter-section middle"></div>
                <div class="meter-section bottom"></div>
                <div id="jig-indicator"></div>
            </div>
            <div id="jig-instructions" class="fishing-instructions">Tap Q to bob for Depth!</div>
        `;
        
        this.container.appendChild(panel);
        this.meter = document.getElementById('jigging-meter');
        this.instructions = document.getElementById('jig-instructions');
        this.meter.style.display = 'none';
        this.instructions.style.display = 'none';
        this.setupEventListeners();
    }

    setupEventListeners() {
        hytopia.onData((data) => {
            if (data.type === 'startFishing') {
                this.isActive = true;
                this.meter.style.display = 'block';
                this.instructions.style.display = 'block';
                this.updateJigging(data);
            } else if (data.type === 'fishingComplete') {
                this.isActive = false;
                this.meter.style.display = 'none';
                this.instructions.style.display = 'none';
            }
        });
    }

    updateJigging(data) {
        if (!this.isActive) return;
        
        const indicator = document.getElementById('jig-indicator');
        if (data.fishDepth !== undefined) {
            // Adjust the calculation to allow the ball to go deeper
            // Now using 0-2.5 range instead of 3.5 to make it settle lower
            const depthPercentage = (data.fishDepth / 2.5) * 100;
            
            // Allow the ball to go almost to the bottom (98%)
            const adjustedPercentage = Math.min(Math.max(depthPercentage, 0), 98);
            indicator.style.top = `${adjustedPercentage}%`;
        }
    }
}

// Make it globally available
window.JigPanel = new JigPanel();
console.log('JigPanel global object created');