class ReelPanel {
    constructor() {
        this.container = null;
        this.isActive = false;
    }

    initialize(containerId) {
        this.container = document.getElementById(containerId);
        
        const panel = document.createElement('div');
        panel.id = 'reeling-minigame';
        panel.style.display = 'none';
        panel.innerHTML = `
            <!-- Top bar with target zone and fish -->
            <div id="reel-tension-bar" class="tension-bar">
                <!-- Target zone (white box) that moves with space -->
                <div id="reel-target-zone" class="target-zone"></div>
                <!-- Fish marker (yellow line) that oscillates -->
                <div id="reel-fish-marker" class="marker"></div>
            </div>
            
            <!-- Bottom progress bar -->
            <div id="reel-progress" class="progress-bar">
                <div id="reel-progress-fill"></div>
            </div>
            <div class="reeling-instructions">
                Press Q to move the catch bar<br>
                Trap the fish to fill the progress meter!
            </div>
        `;
        
        this.container.appendChild(panel);
        this.setupEventListeners();
    }

    setupEventListeners() {
        hytopia.onData((data) => {
            if (data.type === 'startReeling') {
                const reelingGame = document.getElementById('reeling-minigame');
                if (reelingGame) {
                    reelingGame.style.display = 'block';
                    console.log("Reeling game display set to block");
                }
            } else if (data.type === 'updateReeling') {
                console.log("Updating reeling UI:", data);
                const fishMarker = document.getElementById('reel-fish-marker');
                const targetZone = document.getElementById('reel-target-zone');
                const progressFill = document.getElementById('reel-progress-fill');
                
                if (fishMarker) {
                    fishMarker.style.left = `${data.fishPosition * 100}%`;
                }
                if (targetZone) {
                    targetZone.style.left = `${data.barPosition * 100}%`;
                }
                if (progressFill) {
                    progressFill.style.width = `${data.progress}%`;
                }
            } else if (data.type === 'hideReeling') {
                const reelingGame = document.getElementById('reeling-minigame');
                if (reelingGame) {
                    reelingGame.style.display = 'none';
                }
            }
        });
    }
}

window.ReelPanel = new ReelPanel();