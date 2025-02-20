class MerchantPanel {
    constructor() {
        this.container = null;
        this.isMerchantDialogOpen = false;
    }

    initialize(containerId) {
        this.container = document.getElementById(containerId);
        
        // Create template first
        const template = document.createElement('template');
        template.id = 'merchant-dialog-template';
        template.innerHTML = `
            <div class="merchant-dialog">
                <h3>Merchant</h3>
                <div class="options"></div>
            </div>
        `;
        this.container.appendChild(template);

        // Register the scene UI template
        hytopia.registerSceneUITemplate('merchant-dialog', (id, onState) => {
            const template = document.getElementById('merchant-dialog-template');
            const clone = template.content.cloneNode(true);
            const optionsContainer = clone.querySelector('.options');
        
            onState(state => {
                optionsContainer.innerHTML = '';
                state.options.forEach((option, index) => {
                    const div = document.createElement('div');
                    div.textContent = `[${index + 1}] ${option}`; // Show 1-5 instead of a-e
                    optionsContainer.appendChild(div);
                });
            });
            
            return clone;
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        hytopia.onData((data) => {
            if (data.type === 'showMerchantDialog') {
                this.isMerchantDialogOpen = true;
            } else if (data.type === 'hideMerchantDialog') {
                console.log("Hiding merchant dialog");
                const menu = document.getElementById('merchant-dialog');
                if (menu) {
                    menu.style.display = 'none';
                    menu.style.pointerEvents = 'none';
                }
                this.isMerchantDialogOpen = false;
                document.querySelector('.merchant-dialog')?.remove();
            } else if (data.type === 'merchantSpeak') {
                const dialog = document.querySelector('.merchant-dialog');
                const options = dialog.querySelector('.options');
                
                // Clear existing options
                options.innerHTML = '';
                
                // Add merchant's message
                options.innerHTML = `<div class="merchant-message">${data.message}</div>`;
            }
        });
    }
}

window.MerchantPanel = new MerchantPanel();