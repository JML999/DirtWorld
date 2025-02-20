class GameUpdatesPanel {
    constructor() {
        console.log('GameUpdatesPanel constructor called');
        this.container = null;
        this.panel = null;
        this.updatesContainer = null;
        this.recentMessages = new Map();
    }

    initialize(containerId) {
        console.log('GameUpdatesPanel initializing...');
        this.container = document.getElementById(containerId);
        
        // Create panel HTML
        this.panel = document.createElement('div');
        this.panel.id = 'game-updates-panel';
        this.panel.style.display = 'none'; // Start hidden
        this.panel.innerHTML = `
            <h3>Fishing Log</h3>
            <div class="updates-container"></div>
        `;
        
        this.container.appendChild(this.panel);
        this.updatesContainer = this.panel.querySelector('.updates-container');

        // Set up message handling
        hytopia.onData(data => {
            console.log("Received data:", data);
            if (data.type === 'gameUpdate' || data.type === 'welcomeReady') {
                console.log("Received game update:", data.message);
                
                // Check if we've shown this message recently (within 5 seconds)
                const now = Date.now();
                const lastShown = this.recentMessages.get(data.message);
                if (lastShown && (now - lastShown) < 5000) {
                    console.log("Duplicate message ignored:", data.message);
                    return;
                }
                
                // Update timestamp for this message
                this.recentMessages.set(data.message, now);
                
                // Show panel
                this.panel.style.display = 'block';
                
                // Create and show message
                const messageDiv = document.createElement('div');
                messageDiv.className = 'update-message';
                messageDiv.id = `message-${data.messageId}`; 
                messageDiv.textContent = data.message;
                
                messageDiv.style.animation = 'fadeIn 0.3s ease-in';
                this.updatesContainer.insertBefore(messageDiv, this.updatesContainer.firstChild);
                
                // Auto-hide message after 5 seconds
                setTimeout(() => {
                    messageDiv.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        messageDiv.remove();
                        if (!this.updatesContainer.hasChildNodes()) {
                            this.panel.style.display = 'none';
                        }
                    }, 300);
                }, 5000);
                
                // Clean up old messages from tracking Map
                for (const [msg, timestamp] of this.recentMessages.entries()) {
                    if (now - timestamp > 5000) {
                        this.recentMessages.delete(msg);
                    }
                }
            }
            else if (data.type === 'removeGameMessage') {
                console.log("Attempting to remove message:", data.messageId);
                const messageToRemove = document.getElementById(`message-${data.messageId}`);
                if (messageToRemove) {
                    console.log("Found message to remove:", messageToRemove);
                    messageToRemove.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        messageToRemove.remove();
                        if (!this.updatesContainer.hasChildNodes()) {
                            this.panel.style.display = 'none';
                        }
                        console.log("Message removed. Remaining messages:", this.updatesContainer.innerHTML);
                    }, 300);
                } else {
                    console.log("Message to remove not found:", data.messageId);
                }
            }
        });

        console.log('GameUpdatesPanel initialized');
    }

    // This method can still be used for direct message adding if needed
    addUpdate(message, messageId) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'update-message';
        if (messageId) {
            messageDiv.id = `message-${messageId}`;
        }
        messageDiv.textContent = message;
        messageDiv.style.animation = 'fadeIn 0.3s ease-in';
        this.updatesContainer.insertBefore(messageDiv, this.updatesContainer.firstChild);
        document.getElementById('game-updates-panel').style.display = 'block';
    }
}

// Make it globally available
window.GameUpdatesPanel = new GameUpdatesPanel();
console.log('GameUpdatesPanel global object created');
