class CastingPanel {
    constructor() {
        console.log('CastingPanel constructor called');
        this.container = null;
    }

    initialize(containerId) {
        console.log('CastingPanel initializing...');
        this.container = document.getElementById(containerId);
        
        // Create panel HTML
        const panel = document.createElement('div');
        panel.id = 'casting-ui';
        panel.innerHTML = `
            <div id="casting-power-container">
                <div id="casting-power-bar"></div>
            </div>

            <div id="cast-marker"></div>
        `;
        
        this.container.appendChild(panel);

        // Set up message handling
        this.setupEventListeners();

        console.log('CastingPanel initialized');
    }

    setupEventListeners() {
        hytopia.onData((data) => {
            if (data.type === 'castingPowerUpdate') {
                this.updateCastingPower(data.power);
            }
            else if (data.type === 'showCastMarker') {
                this.updateCastMarker(data.position);
            }
        });
    }

    updateCastingPower(power) {
        const powerBar = document.getElementById('casting-power-container');
        if (power === null) {
            powerBar.style.display = 'none';
        } else {
            powerBar.style.display = 'block';
            document.getElementById('casting-power-bar').style.height = `${power}%`;
        }
    }

    updateCastMarker(position) {
        console.log("Updating cast marker position:", position);
        const marker = document.getElementById('cast-marker');
        const screenPos = hytopia.worldToScreen(position);

        if (screenPos) {
            marker.style.display = 'block';
            marker.style.left = `${screenPos.x - 20}px`;
            marker.style.top = `${screenPos.y - 20}px`;
        } else {
            marker.style.display = 'none';
        }
    }

}

// Make it globally available
window.CastingPanel = new CastingPanel();
console.log('CastingPanel global object created');

