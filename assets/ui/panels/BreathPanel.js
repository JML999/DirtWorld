class BreathPanel {
    constructor() {
        this.container = null;
        this.breathMeter = null;
    }

    initialize(containerId) {
        this.container = document.getElementById(containerId);
        
        // Create panel HTML
        const panel = document.createElement('div');
        panel.id = 'breath-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 70px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            display: flex;
            gap: 8px;
        `;
        
        // Create 3 bubble circles with smaller size (10px instead of 20px)
        for (let i = 0; i < 3; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'breath-bubble';
            bubble.style.cssText = `
                width: 10px;
                height: 10px;
                background: #4a90e2;
                border-radius: 50%;
                border: 1px solid #87ceeb;
                box-shadow: 0 0 3px rgba(74, 144, 226, 0.5);
                transition: opacity 0.3s ease-out;
            `;
            panel.appendChild(bubble);
        }
        
        this.container.appendChild(panel);
        
        // Set up message handling
        hytopia.onData(data => {
            if (data.type === 'breathUpdate') {
                this.updateBreathBubbles(data.percentage);
            }
        });
    }

    updateBreathBubbles(percentage) {
        const bubbles = document.querySelectorAll('.breath-bubble');
        const bubblesVisible = Math.ceil((percentage / 100) * 3);
        
        bubbles.forEach((bubble, index) => {
            if (index < bubblesVisible) {
                bubble.style.opacity = '1';
            } else {
                bubble.style.opacity = '0.2';
            }
        });
    }

    addBubbles() {
        const container = document.querySelector('.bubble-container');
        if (!container) return;

        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.width = `${Math.random() * 6 + 4}px`;
        bubble.style.height = bubble.style.width;
        
        container.appendChild(bubble);
        
        // Remove bubble after animation
        bubble.addEventListener('animationend', () => {
            bubble.remove();
        });
    }
}

// Make it globally available
window.BreathPanel = new BreathPanel();