/**
 * ClientReelingController.js
 * 
 * EXPERIMENTAL: Client-side implementation of the fishing reeling minigame
 * This runs alongside the existing server-side implementation and can be
 * enabled/disabled for testing purposes.
 */

class ClientReelingController {
    constructor() {
        // Configuration constants
        this.CONFIG = {
            UPDATE_INTERVAL: 16, // ms (roughly 60fps)
            TARGET_ZONE_WIDTH: 0.2,
            PROGRESS_INCREASE_RATE: 0.5, // % per update when in target zone
            PROGRESS_DECREASE_RATE: 0.3, // % per update when outside target zone
            BAR_MOVE_SPEED: 0.01,
            INITIAL_FISH_VELOCITY: 0.01
        };
        
        // Movement pattern constants
        this.MOVEMENT_PATTERNS = {
            DEFAULT: 'default',
            SINE_WAVE: 'sine_wave',
            ERRATIC: 'erratic',
            SINE_ERRATIC: 'sine_erratic',
            PULSE: 'pulse',
            ACCELERATING: 'accelerating',
            ZIGZAG: 'zigzag',
            BURST: 'burst'
        };
        
        // Pattern-specific constants
        this.SINE_FREQUENCY = 2.0;
        this.SINE_AMPLITUDE = 0.4;
        this.PULSE_DURATION = 3.0;
        this.PULSE_FAST_FREQUENCY = 4.0;
        this.PULSE_SLOW_FREQUENCY = 1.5;
        this.ACCELERATION_RATE = 0.05;
        this.MAX_ACCELERATION = 3.0;
        this.ZIGZAG_INTERVAL = 30;
        this.BURST_DURATION = 1.0;
        this.BURST_SPEED = 3.0;
        
        // Game state
        this.isActive = false;
        this.gameStartTime = 0;
        this.currentTime = 0;
        this.fishPosition = 0.5;
        this.fishVelocity = this.CONFIG.INITIAL_FISH_VELOCITY;
        this.barPosition = 0.5;
        this.barDirection = 1;
        this.progress = 0;
        this.pattern = this.MOVEMENT_PATTERNS.DEFAULT;
        this.updateInterval = null;
        
        // Transition state
        this.bounceCount = 0;
        this.leftBounces = 0;
        this.rightBounces = 0;
        this.hasTransitioned = false;
        this.currentDynamicPattern = this.MOVEMENT_PATTERNS.DEFAULT;
        
        // Bind methods
        this.update = this.update.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        // Initialize
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for game start/end messages from server
        hytopia.onData((data) => {
            if (data.type === 'startReeling') {
                // Only start client-side logic if experimental flag is enabled
                if (window.ENABLE_CLIENT_REELING === true) {
                    console.log("[CLIENT REELING] Starting client-side reeling game");
                    this.startGame(data.fishData || {});
                }
            } else if (data.type === 'hideReeling') {
                if (window.ENABLE_CLIENT_REELING === true) {
                    console.log("[CLIENT REELING] Ending client-side reeling game");
                    this.endGame();
                }
            }
        });
    }
    
    startGame(fishData) {
        // Initialize game state with fish data from server
        this.isActive = true;
        this.gameStartTime = Date.now();
        this.currentTime = 0;
        this.fishPosition = fishData.initialPosition || 0.5;
        this.fishVelocity = fishData.initialVelocity || this.CONFIG.INITIAL_FISH_VELOCITY;
        this.barPosition = 0.5;
        this.barDirection = 1;
        this.progress = 0;
        this.pattern = fishData.pattern || this.MOVEMENT_PATTERNS.DEFAULT;
        
        // Reset transition state
        this.bounceCount = 0;
        this.leftBounces = 0;
        this.rightBounces = 0;
        this.hasTransitioned = false;
        this.currentDynamicPattern = this.pattern;
        
        // Add keyboard event listeners
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        
        // Start update loop
        this.updateInterval = setInterval(this.update, this.CONFIG.UPDATE_INTERVAL);
        
        // Show the UI
        const reelingGame = document.getElementById('reeling-minigame');
        if (reelingGame) {
            reelingGame.style.display = 'block';
        }
    }
    
    endGame(success = false) {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        // Stop update loop
        clearInterval(this.updateInterval);
        
        // Calculate final stats
        const timeElapsed = (Date.now() - this.gameStartTime) / 1000;
        
        // Send result to server
        hytopia.sendData({
            type: 'reelingComplete',
            success: success,
            finalProgress: this.progress,
            timeElapsed: timeElapsed
        });
        
        console.log(`[CLIENT REELING] Game ended. Success: ${success}, Progress: ${this.progress}%, Time: ${timeElapsed.toFixed(2)}s`);
        
        // Hide the UI (server will also send hideReeling, but we do it here too for responsiveness)
        const reelingGame = document.getElementById('reeling-minigame');
        if (reelingGame) {
            reelingGame.style.display = 'none';
        }
    }
    
    update() {
        if (!this.isActive) return;
        
        // Update time
        this.currentTime += this.CONFIG.UPDATE_INTERVAL / 1000;
        
        // Update fish position based on pattern
        const result = this.updateFishPosition(
            this.fishPosition, 
            this.fishVelocity, 
            this.pattern, 
            this.currentTime
        );
        
        this.fishPosition = result.position;
        this.fishVelocity = result.velocity;
        
        // Update bar position (automatic movement)
        this.barPosition += this.barDirection * this.CONFIG.BAR_MOVE_SPEED;
        
        // Reverse direction if bar hits edge
        if (this.barPosition <= 0 || this.barPosition >= 1) {
            this.barDirection *= -1;
        }
        
        // Check if fish is in target zone
        const targetZoneStart = this.barPosition - (this.CONFIG.TARGET_ZONE_WIDTH / 2);
        const targetZoneEnd = this.barPosition + (this.CONFIG.TARGET_ZONE_WIDTH / 2);
        const fishInTargetZone = this.fishPosition >= targetZoneStart && this.fishPosition <= targetZoneEnd;
        
        // Update progress
        if (fishInTargetZone) {
            this.progress += this.CONFIG.PROGRESS_INCREASE_RATE;
        } else {
            this.progress = Math.max(0, this.progress - this.CONFIG.PROGRESS_DECREASE_RATE);
        }
        
        // Check for win condition
        if (this.progress >= 100) {
            this.endGame(true);
            return;
        }
        
        // Update UI
        this.updateUI();
    }
    
    updateFishPosition(currentPosition, velocity, pattern, time) {
        // This replicates the server-side logic for fish movement patterns
        switch (pattern) {
            case this.MOVEMENT_PATTERNS.SINE_WAVE:
                const newPosition = 0.5 + Math.sin(time * this.SINE_FREQUENCY) * this.SINE_AMPLITUDE;
                // Bounce detection
                if (Math.abs(Math.sin(time * this.SINE_FREQUENCY)) > 0.9) {
                    if (newPosition > 0.8) this.rightBounces++;
                    if (newPosition < 0.2) this.leftBounces++;
                }
                return {
                    position: newPosition,
                    velocity: velocity
                };
                
            case this.MOVEMENT_PATTERNS.ERRATIC:
                if (Math.random() < 0.05) velocity *= -1;
                return {
                    position: Math.max(0.1, Math.min(0.9, currentPosition + velocity)),
                    velocity: velocity
                };
                
            case this.MOVEMENT_PATTERNS.SINE_ERRATIC:
                const basePos = 0.5 + Math.sin(time * this.SINE_FREQUENCY) * this.SINE_AMPLITUDE;
                
                if (Math.random() < 0.15) {
                    velocity *= (Math.random() < 0.5) ? -1 : (0.5 + Math.random());
                }
                
                const combinedPos = basePos + (velocity * 0.5);
                
                return {
                    position: Math.max(0.1, Math.min(0.9, combinedPos)),
                    velocity: velocity
                };
                
            case this.MOVEMENT_PATTERNS.PULSE:
                // Switch frequency based on time
                const isPulseFast = Math.floor(time / this.PULSE_DURATION) % 2 === 0;
                const currentFrequency = isPulseFast ? this.PULSE_FAST_FREQUENCY : this.PULSE_SLOW_FREQUENCY;
                
                const pulsePosition = 0.5 + Math.sin(time * currentFrequency) * this.SINE_AMPLITUDE;
                
                // Bounce detection
                if (Math.abs(Math.sin(time * currentFrequency)) > 0.9) {
                    if (pulsePosition > 0.8) this.rightBounces++;
                    if (pulsePosition < 0.2) this.leftBounces++;
                }
                
                return {
                    position: pulsePosition,
                    velocity: velocity
                };
                
            case this.MOVEMENT_PATTERNS.ACCELERATING:
                const accelerationMultiplier = Math.min(1 + (time * this.ACCELERATION_RATE), this.MAX_ACCELERATION);
                if (currentPosition <= 0.05 || currentPosition >= 0.95) {
                    velocity *= -1;
                }
                return {
                    position: Math.max(0.05, Math.min(0.95, currentPosition + (velocity * accelerationMultiplier))),
                    velocity: velocity
                };

            case this.MOVEMENT_PATTERNS.ZIGZAG:
                if (Math.floor(time * 1000) % this.ZIGZAG_INTERVAL === 0) {
                    velocity *= -1;
                }
                return {
                    position: Math.max(0.05, Math.min(0.95, currentPosition + velocity)),
                    velocity: velocity
                };

            case this.MOVEMENT_PATTERNS.BURST:
                const isBursting = Math.floor(time / this.BURST_DURATION) % 3 === 0;
                const burstMultiplier = isBursting ? this.BURST_SPEED : 1.0;
                if (currentPosition <= 0.05 || currentPosition >= 0.95) {
                    velocity *= -1;
                }
                return {
                    position: Math.max(0.05, Math.min(0.95, currentPosition + (velocity * burstMultiplier))),
                    velocity: velocity
                };
                
            default:
                if (currentPosition <= 0.05 || currentPosition >= 0.95) {
                    velocity *= -1;
                }
                return {
                    position: Math.max(0.05, Math.min(0.95, currentPosition + velocity)),
                    velocity: velocity
                };
        }
    }
    
    updateUI() {
        // Update UI elements with current game state
        const fishMarker = document.getElementById('reel-fish-marker');
        const targetZone = document.getElementById('reel-target-zone');
        const progressFill = document.getElementById('reel-progress-fill');
        
        if (fishMarker) {
            fishMarker.style.left = `${this.fishPosition * 100}%`;
        }
        if (targetZone) {
            targetZone.style.left = `${this.barPosition * 100}%`;
        }
        if (progressFill) {
            progressFill.style.width = `${this.progress}%`;
        }
    }
    
    handleKeyDown(event) {
        // Handle player input (space bar to move the target zone)
        if (event.code === 'Space' || event.key === ' ') {
            this.barDirection = -1;
        }
    }
    
    handleKeyUp(event) {
        // Reset bar direction when key is released
        if (event.code === 'Space' || event.key === ' ') {
            this.barDirection = 1;
        }
    }
}

// Create a global flag to enable/disable client-side reeling
window.ENABLE_CLIENT_REELING = false;

// Initialize the controller
window.ClientReelingController = new ClientReelingController();
console.log("[CLIENT REELING] Client-side reeling controller initialized");