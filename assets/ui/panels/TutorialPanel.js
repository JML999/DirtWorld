class TutorialPanel {
    constructor() {
        this.container = null;
        this.tutorialOpen = false;
        this.currentStep = 0;
        this.tutorialSteps = [];
        this.isActive = false;
        this.styleElement = null;
        this.panel = document.getElementById('tutorial-panel');
    }

    initialize(containerId) {
        this.container = document.getElementById(containerId);
        
        // Create panel HTML
        const panel = document.createElement('div');
        panel.id = 'tutorial-ui';
        panel.innerHTML = `
            <div id="tutorial-overlay">
                <div class="tutorial-container">
                    <div class="tutorial-header">
                        <h2 id="tutorial-title">Welcome to Fishing Adventure!</h2>
                        <div class="close-button" id="tutorial-close-button">×</div>
                    </div>
                    <div class="tutorial-content">
                        <div class="tutorial-image-container">
                            <img id="tutorial-image" class="tutorial-image" src="" alt="Tutorial Image">
                        </div>
                        <p id="tutorial-text"></p>
                        <div class="tutorial-navigation">
                            <button id="tutorial-prev">Previous</button>
                            <button id="tutorial-next">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.appendChild(panel);

        // Add CSS for the tutorial
        const style = document.createElement('style');
        style.textContent = `
            #tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 2000;
                display: none;
                justify-content: center;
                align-items: center;
            }
            
            .tutorial-container {
                width: 600px;
                background-color: #1a2633;
                border: 2px solid #4a90e2;
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .tutorial-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: #0a1622;
                border-bottom: 1px solid #4a90e2;
            }
            
            .tutorial-header h2 {
                margin: 0;
                color: #ffffff;
                font-size: 22px;
            }
            
            .close-button {
                font-size: 24px;
                color: #ffffff;
                cursor: pointer;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .close-button:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            .tutorial-content {
                padding: 20px;
                overflow-y: auto;
            }
            
            .tutorial-image-container {
                width: 100%;
                height: 220px;
                display: flex;
                justify-content: center;
                margin-bottom: 20px;
                background-color: #0d1a26;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .tutorial-image {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            
            #tutorial-text {
                color: #d0d0d0;
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 20px;
            }
            
            .tutorial-navigation {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            #tutorial-prev, #tutorial-next {
                background-color: #4a90e2;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            }

            
            #tutorial-prev:hover, #tutorial-next:hover {
                background-color: #3a7bc8;
            }
            
            #tutorial-prev:disabled {
                background-color: #2a3b4d;
                cursor: not-allowed;
            }
        `;
        
        this.container.appendChild(style);

        // Set up event handlers
        this.setupEventListeners();
        
        // Set up message handling from server
        hytopia.onData((data) => {
            if (data.type === 'showTutorial') {
                console.log('Received tutorial data:', data);
                this.tutorialSteps = data.steps;
                this.currentStep = 0;
                this.showTutorial();
            } else if (data.type === 'showHelp') {
                console.log('Received help data:', data);
                this.tutorialSteps = data.steps;
                this.currentStep = 0;
                this.showTutorial();
            }
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'h') {
                console.log("[TUTORIAL] H key pressed");
                this.showTutorial();
            } else if (event.key === 'Escape' && this.tutorialOpen) {
                this.closeTutorial();
            }
        });
    }

    setupEventListeners() {
        const tutorialContainer = document.querySelector('.tutorial-container');
        if (tutorialContainer) {
            tutorialContainer.addEventListener('click', (e) => {
                const target = e.target;
                
                if (target.id === 'tutorial-next') {
                    e.stopPropagation();
                    this.nextStep();
                }
                
                if (target.id === 'tutorial-prev') {
                    e.stopPropagation();
                    this.previousStep();
                }
                
                if (target.id === 'tutorial-close-button' || 
                    target.classList.contains('close-button') || 
                    (target.closest('.close-button') !== null)) {
                    e.stopPropagation();
                    this.closeTutorial();
                    hytopia.sendData({
                        type: 'tutorialCompleted'
                    });
                }
            });
        }
    }

    showTutorial() {
        this.isActive = true;
        const overlay = document.getElementById('tutorial-overlay');
        overlay.style.display = 'flex';
        this.tutorialOpen = true;
        
        // Disable player controls while tutorial is open
        hytopia.sendData({
            type: 'disablePlayerInput'
        });
        
        this.updateTutorialContent();
        
        // Add style to hide chat window when tutorial is active
        this.addHideChatStyle();
    }

    closeTutorial() {
        this.isActive = false;
        const overlay = document.getElementById('tutorial-overlay');
        overlay.style.display = 'none';
        this.tutorialOpen = false;
        
        // Re-enable player controls
        hytopia.sendData({
            type: 'enablePlayerInput'
        });
        
        // Remove style to show chat window when tutorial is inactive
        this.removeHideChatStyle();
    }

    updateTutorialContent() {
        if (this.currentStep >= this.tutorialSteps.length) {
            this.closeTutorial();
            return;
        }

        const step = this.tutorialSteps[this.currentStep];
        
        if (this.currentStep === 0) {
            document.getElementById('tutorial-title').textContent = step.title || 'Tutorial';
            document.getElementById('tutorial-text').textContent = step.text || '';
            
            const imageContainer = document.querySelector('.tutorial-image-container');
            imageContainer.innerHTML = `
                <div class="ascii-container">
                    <pre class="ascii-art">
~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~
╔═══════════════════════════════════════════╗
║  ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ║
║      ██████  ██   ██ ███████ ██   ██      ║
║      ██   ██ ██   ██ ██      ██   ██      ║
║      ██████  ███████ ███████ ███████      ║
║      ██      ██   ██      ██ ██   ██      ║
║      ██      ██   ██ ███████ ██   ██      ║
║  ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ║
║     Your Fishing Adventure Begins         ║
║  ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ║
║     > Press NEXT to learn to fish <       ║
║  ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ║
╚═══════════════════════════════════════════╝
~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~   ~
                    </pre>
                </div>
            `;

            const style = document.createElement('style');
            style.textContent = `
                .ascii-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    width: 100%;
                    font-family: monospace;
                    background: #0a1622;
                    border-radius: 4px;
                }

                .ascii-art {
                    color: #4a90e2;
                    text-shadow: 0 0 5px #4a90e2;
                    font-size: 14px;
                    line-height: 1.2;
                    white-space: pre;
                    animation: glow 2s infinite alternate;
                    margin: 0;
                    text-align: center;
                    position: relative;
                }

                .ascii-art::before {
                    content: '><(((º>';
                    position: absolute;
                    top: 20%;
                    left: -10%;
                    animation: swimAcross 8s linear infinite;
                }

                .ascii-art::after {
                    content: '<º)))><';
                    position: absolute;
                    bottom: 20%;
                    right: -10%;
                    animation: swimBack 8s linear infinite;
                }

                @keyframes glow {
                    from {
                        text-shadow: 0 0 5px #4a90e2, 0 0 10px #4a90e2;
                    }
                    to {
                        text-shadow: 0 0 10px #4a90e2, 0 0 20px #4a90e2;
                    }
                }

                @keyframes swimAcross {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(400%); }
                }

                @keyframes swimBack {
                    from { transform: translateX(100%); }
                    to { transform: translateX(-400%); }
                }
            `;
            document.head.appendChild(style);
        }
        // Special handling for fourth panel (reeling animation)
        else if (this.currentStep === 3) {
            document.getElementById('tutorial-title').textContent = step.title || 'Tutorial';
            document.getElementById('tutorial-text').textContent = step.text || '';
            this.createAnimatedReelingExample();
        }
        // Special handling for fifth panel (bait block)
        else if (this.currentStep === 4) {
            document.getElementById('tutorial-title').textContent = step.title || 'Tutorial';
            document.getElementById('tutorial-text').textContent = step.text || '';
            this.createBaitBlock();
        }
        // Special handling for last panel (ASCII fish)
        else if (this.currentStep === this.tutorialSteps.length - 1) {
            document.getElementById('tutorial-title').textContent = step.title || 'Tutorial';
            document.getElementById('tutorial-text').textContent = step.text || '';
            
            const imageContainer = document.querySelector('.tutorial-image-container');
            imageContainer.innerHTML = `
                <div class="ascii-container">
                    <pre class="ascii-fish">
~     ~     ~     ~     [O]          ~     ~     ~     ~
     ~     ~     ~                  ~     ~     ~     ~
~     ~     ~     ~                ~     ~     ~     ~
     ~     ~     ~                  ~     ~     ~     ~
~     ~     ~     ~                 ~     ~     ~     ~
     ~     ~     ~                  ~     ~     ~     ~

~     ~     ~     ~     ~     ~     ~     ~     ~     ~

     ~     ~     ~     ~     ~     ~     ~     ~     ~

~     ~     ~     ~     ~     ~     ~     ~     ~     ~
                </pre>
                <div class="fishing-line">
                    <span class="line-segment">|</span>
                    <span class="line-segment">|</span>
                    <span class="line-segment">|</span>
                    <span class="line-segment">|</span>
                    <span class="line-segment">|</span>
                    <span class="hook">□</span>
                </div>
            </div>
        `;

            const style = document.createElement('style');
            style.textContent = `
                .ascii-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    width: 100%;
                    font-family: monospace;
                    background: #0a1622;
                    border-radius: 4px;
                    overflow: hidden;
                    position: relative;
                }

                .ascii-fish {
                    color: #4a90e2;
                    text-shadow: 0 0 5px #4a90e2;
                    font-size: 16px;
                    line-height: 1.5;
                    white-space: pre;
                    position: relative;
                }

                .fishing-line {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    color: #4a90e2;
                    text-shadow: 0 0 5px #4a90e2;
                    animation: dropLine 2s ease-out forwards;
                    transform: translateY(-100%);
                }

                .line-segment {
                    animation: fadeIn 0.4s forwards;
                    opacity: 0;
                }

                .line-segment:nth-child(1) { animation-delay: 0s; }
                .line-segment:nth-child(2) { animation-delay: 0.4s; }
                .line-segment:nth-child(3) { animation-delay: 0.8s; }
                .line-segment:nth-child(4) { animation-delay: 1.2s; }
                .line-segment:nth-child(5) { animation-delay: 1.6s; }

                .hook {
                    opacity: 0;
                    animation: fadeIn 0.4s forwards;
                    animation-delay: 2s;
                }

                @keyframes dropLine {
                    to { transform: translateY(5%); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .ascii-fish::before {
                    content: '><(((º>';
                    position: absolute;
                    top: 35%;
                    left: -10%;
                    animation: swimAcross 8s linear infinite;
                }

                .ascii-fish::after {
                    content: '<º)))><';
                    position: absolute;
                    bottom: 45%;
                    right: -10%;
                    animation: swimBack 10s linear infinite;
                }

                @keyframes swimAcross {
                    from { 
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    to { 
                        transform: translateX(400%);
                        opacity: 0;
                    }
                }

                @keyframes swimBack {
                    from { 
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    to { 
                        transform: translateX(-400%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
            
            // Add water ripple animation
            setTimeout(() => {
                const waves = imageContainer.querySelectorAll('pre');
                waves.forEach(wave => {
                    wave.style.position = 'relative';
                    const ripple = document.createElement('div');
                    ripple.className = 'ripple';
                    ripple.style.cssText = `
                        position: absolute;
                        bottom: 30px;
                        left: 50%;
                        width: 60px;
                        height: 10px;
                        background: rgba(74, 144, 226, 0.3);
                        border-radius: 50%;
                        transform: translateX(-50%);
                        animation: ripple 2s infinite;
                    `;
                    wave.appendChild(ripple);
                });
            }, 500);
        }
        else {
            // Regular panel handling
            document.getElementById('tutorial-title').textContent = step.title || 'Tutorial';
            document.getElementById('tutorial-text').textContent = step.text || '';
            
            if (step.type && ['casting', 'jigging', 'reeling'].includes(step.type)) {
                this.addTutorialExample(step.type);
                document.getElementById('tutorial-image').style.display = 'none';
            } else if (step.image) {
                const tutorialImage = document.getElementById('tutorial-image');
                tutorialImage.src = step.image;
                tutorialImage.style.display = 'block';
            } else {
                document.getElementById('tutorial-image').style.display = 'none';
            }
        }
        
        // Update next button text
        const nextButton = document.getElementById('tutorial-next');
        nextButton.textContent = this.currentStep === this.tutorialSteps.length - 1 ? 'Finish' : 'Next';
    }
    
    clearTutorialExample() {
        // Remove any existing example
        const existingExample = document.getElementById('tutorial-example');
        if (existingExample) {
            existingExample.remove();
        }
    }
    
    addTutorialExample(type) {
        // Create container for the example
        const exampleContainer = document.createElement('div');
        exampleContainer.id = 'tutorial-example';
        exampleContainer.style.marginTop = '15px';
        exampleContainer.style.marginBottom = '15px';
        exampleContainer.style.padding = '15px';
        exampleContainer.style.backgroundColor = 'rgba(10, 20, 30, 0.5)';
        exampleContainer.style.borderRadius = '8px';
        exampleContainer.style.border = '1px solid rgba(74, 144, 226, 0.3)';
        
        // Add the appropriate example based on type
        switch (type) {
            case 'casting':
                this.createCastingExample(exampleContainer);
                break;
            case 'jigging':
                this.createJiggingExample(exampleContainer);
                break;
            case 'reeling':
                this.createReelingExample(exampleContainer);
                break;
        }
        
        // Insert the example in the image container
        const imageContainer = document.querySelector('.tutorial-image-container');
        imageContainer.innerHTML = ''; // Clear the image container
        imageContainer.appendChild(exampleContainer);
    }
    
    createCastingExample(container) {
        container.innerHTML = `
            <div class="casting-example">
                <div class="casting-instructions">
                    <div class="instruction left">Right click to begin cast</div>
                    <div class="power-bar">
                        <div class="power-fill"></div>
                    </div>
                    <div class="instruction right">Right click to end cast</div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .casting-example {
                display: flex;
                justify-content: center;
                margin: 10px 0;
            }

            .casting-instructions {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .instruction {
                color: #4a90e2;
                font-size: 14px;
                text-shadow: 0 0 5px #4a90e2;
                white-space: nowrap;
            }

            .instruction.left {
                text-align: right;
                width: 150px;
                opacity: 0;
                animation: fadeIn 0.5s forwards;
            }

            .instruction.right {
                text-align: left;
                width: 150px;
                opacity: 0;
                animation: fadeIn 0.5s forwards;
                animation-delay: 1.5s;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .power-bar {
                width: 30px;
                height: 150px;
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid #666;
                border-radius: 15px;
                position: relative;
                overflow: hidden;
            }

            .power-fill {
                position: absolute;
                bottom: 0;
                width: 100%;
                background: linear-gradient(to bottom, #ff4444, #ffff44);
                border-radius: 15px;
                animation: fillMeter 3s infinite;
            }

            @keyframes fillMeter {
                0% { height: 0%; }
                50%, 100% { height: 100%; }
            }
        `;
        document.head.appendChild(style);
    }
    
    createJiggingExample(container) {
        container.innerHTML = `
            <div class="jigging-example">
                <div class="jig-meter">
                    <div class="jig-section top"></div>
                    <div class="jig-section middle"></div>
                    <div class="jig-section bottom"></div>
                    <div class="jig-ball"></div>
                </div>
                <div class="checkmark"></div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .jigging-example {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 20px;
                margin: 10px 0;
            }

            .jig-meter {
                width: 40px;
                height: 150px;
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid #666;
                border-radius: 20px;
                position: relative;
                overflow: hidden;
            }

            .jig-section {
                height: 33.33%;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .jig-ball {
                width: 24px;
                height: 24px;
                background: linear-gradient(to bottom, #ff4444 50%, #fff 50%);
                border-radius: 50%;
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                animation: jigMove 3s forwards;
            }

            .checkmark {
                color: #4CAF50;
                font-size: 32px;
                opacity: 0;
                animation: showCheck 3s forwards;
            }

            .checkmark::after {
                content: "✓";
            }

            @keyframes jigMove {
                0% { top: 10px; }
                99%, 100% { top: 50%; transform: translate(-50%, -50%); }
            }

            @keyframes showCheck {
                0%, 60% { opacity: 0; }
                66%, 80% { opacity: 1; }
                81%, 100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    createReelingExample(container) {
        // Create reeling minigame example
        const reelingExample = document.createElement('div');
        reelingExample.style.width = '100%';
        reelingExample.style.maxWidth = '400px';
        reelingExample.style.margin = '10px auto';
        
        // Tension bar
        const tensionBar = document.createElement('div');
        tensionBar.style.height = '30px';
        tensionBar.style.background = 'rgba(0, 0, 0, 0.8)';
        tensionBar.style.border = '2px solid white';
        tensionBar.style.position = 'relative';
        tensionBar.style.marginBottom = '15px';
        
        // Target zone
        const targetZone = document.createElement('div');
        targetZone.style.position = 'absolute';
        targetZone.style.width = '20%';
        targetZone.style.height = '100%';
        targetZone.style.left = '40%'; // Position in the middle
        targetZone.style.background = 'rgba(255, 255, 255, 0.3)';
        targetZone.style.borderLeft = '2px solid white';
        targetZone.style.borderRight = '2px solid white';
        
        // Fish marker (inside the target zone)
        const fishMarker = document.createElement('div');
        fishMarker.style.position = 'absolute';
        fishMarker.style.width = '4px';
        fishMarker.style.height = '100%';
        fishMarker.style.left = '50%'; // Position in the middle of target zone
        fishMarker.style.background = '#ffeb3b';
        
        tensionBar.appendChild(targetZone);
        tensionBar.appendChild(fishMarker);
        reelingExample.appendChild(tensionBar);
        
        // Progress bar
        const progressBar = document.createElement('div');
        progressBar.style.height = '15px';
        progressBar.style.background = 'rgba(0, 0, 0, 0.8)';
        progressBar.style.border = '2px solid white';
        progressBar.style.marginBottom = '10px';
        progressBar.style.position = 'relative';
        progressBar.style.overflow = 'hidden';
        
        const progressFill = document.createElement('div');
        progressFill.style.height = '100%';
        progressFill.style.background = 'white';
        progressFill.style.width = '60%'; // Example progress
        
        progressBar.appendChild(progressFill);
        reelingExample.appendChild(progressBar);
        
        // Add instructions
        const instructions = document.createElement('div');
        instructions.textContent = 'Keep the fish in the target zone to fill the progress meter!';
        instructions.style.textAlign = 'center';
        instructions.style.marginTop = '10px';
        instructions.style.color = '#d0d0d0';
        instructions.style.fontSize = '14px';
        
        container.appendChild(reelingExample);
        container.appendChild(instructions);
    }

    createAnimatedReelingExample() {
        const container = document.querySelector('.tutorial-image-container');
        container.innerHTML = `
            <div class="tutorial-reeling-animation">
                <div class="tutorial-tension-bar">
                    <div class="tutorial-fish-marker"></div>
                    <div class="tutorial-target-zone"></div>
                </div>
                <div class="tutorial-progress-container">
                    <div class="tutorial-progress-fill"></div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .tutorial-reeling-animation {
                width: 100%;
                max-width: 400px;
                margin: 20px auto;
                padding: 20px;
            }

            .tutorial-tension-bar {
                height: 40px;
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid white;
                position: relative;
                margin-bottom: 20px;
            }

            .tutorial-target-zone {
                position: absolute;
                width: 20%;
                height: 100%;
                background: rgba(255, 255, 255, 0.3);
                border-left: 2px solid white;
                border-right: 2px solid white;
                animation: tutorialTargetMove 4s forwards;
            }

            .tutorial-fish-marker {
                position: absolute;
                width: 4px;
                height: 100%;
                background: #ffeb3b;
                left: 75%;
            }

            .tutorial-progress-container {
                height: 20px;
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid white;
                overflow: hidden;
            }

            .tutorial-progress-fill {
                height: 100%;
                width: 0%;
                background: white;
                animation: tutorialFillProgress 4s forwards;
            }

            @keyframes tutorialTargetMove {
                0% { left: 20%; }
                40% { left: 65%; }
                70%, 100% { left: 65%; }
            }
            @keyframes tutorialFillProgress {
                0% { width: 0%; }
                40% { width: 0%; }
                70%, 100% { width: 100%; }
            }
        `;
        document.head.appendChild(style);
    }

    createBaitBlock() {
        const container = document.querySelector('.tutorial-image-container');
        container.innerHTML = `
            <div class="bait-block"></div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .bait-block {
                width: 128px;
                height: 128px;
                margin: 40px auto;
                background-color:rgb(128, 55, 3);
                background-image: 
                    linear-gradient(45deg, transparent 45%, #C68642 45%, #C68642 55%, transparent 55%),
                    linear-gradient(-45deg, transparent 45%, #C68642 45%, #C68642 55%, transparent 55%);
                background-size: 100% 100%;
                border: 16px solid #C68642;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);
    }

    nextStep() {
        if (this.currentStep < this.tutorialSteps.length - 1) {
            this.currentStep++;
            this.updateTutorialContent();
        } else {
            this.closeTutorial();
            hytopia.sendData({
                type: 'tutorialCompleted'
            });
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateTutorialContent();
        }
    }

    // Method to show tutorial for new players
    showForNewPlayer() {
        hytopia.sendData({
            type: 'checkNewPlayer'
        });
    }

    // Add style to hide chat window
    addHideChatStyle() {
        // Create style element if it doesn't exist
        if (!this.styleElement) {
            this.styleElement = document.createElement('style');
            this.styleElement.id = 'tutorial-chat-style';
            this.styleElement.textContent = `
                #chat-window {
                    display: none !important;
                }
            `;
            document.head.appendChild(this.styleElement);
        }
    }

    // Remove style to show chat window
    removeHideChatStyle() {
        // Remove style element if it exists
        if (this.styleElement) {
            document.head.removeChild(this.styleElement);
            this.styleElement = null;
        }
    }

    // Toggle tutorial panel
    toggle() {
        if (this.isActive) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Make it globally available
window.TutorialPanel = new TutorialPanel();
console.log('TutorialPanel global object created');