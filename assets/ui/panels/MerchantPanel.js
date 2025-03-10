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
                <div class="merchant-prompt"></div>
                <div class="options"></div>
            </div>
        `;
        this.container.appendChild(template);

        // Register the scene UI template
        hytopia.registerSceneUITemplate('merchant-dialog', (id, onState) => {
            const template = document.getElementById('merchant-dialog-template');
            const clone = template.content.cloneNode(true);
            const optionsContainer = clone.querySelector('.options');
            const promptContainer = clone.querySelector('.merchant-prompt');
        
            onState(state => {
                // Update prompt
                if (state.message) {
                    promptContainer.textContent = state.message;
                    promptContainer.style.display = 'block';
                } else {
                    promptContainer.style.display = 'none';
                }
                
                // Update options
                optionsContainer.innerHTML = '';
                state.options.forEach((option, index) => {
                    const div = document.createElement('div');
                    div.textContent = `[${index + 1}] ${option}`;
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
                if (dialog) {
                    const prompt = dialog.querySelector('.merchant-prompt');
                    if (prompt) {
                        prompt.textContent = data.message;
                        prompt.style.display = 'block';
                    }
                }
            }
        });
    }

    updateMerchantDialog(data) {
        const dialog = document.querySelector('.merchant-dialog');
        if (!dialog) return;
        
        // Update merchant prompt if provided
        const promptElement = dialog.querySelector('.merchant-prompt');
        if (promptElement && data.message) {
            promptElement.textContent = data.message;
            promptElement.style.display = 'block';
        } else if (promptElement) {
            promptElement.style.display = 'none';
        }
        
        // Update options
        const optionsContainer = dialog.querySelector('.options');
        if (!optionsContainer) return;
        
        optionsContainer.innerHTML = '';
        
        if (data.options && data.options.length > 0) {
            data.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.textContent = option;
                button.classList.add('merchant-option');
                button.dataset.index = index;
                button.addEventListener('click', () => {
                    window.parent.postMessage({
                        type: 'merchantOption',
                        merchantId: data.merchantId,
                        option: index
                    }, '*');
                });
                optionsContainer.appendChild(button);
            });
        }
    }
}

window.MerchantPanel = new MerchantPanel();

const style = document.createElement('style');
style.textContent = `
.merchant-prompt {
    margin-bottom: 15px;
    font-size: 16px;
    line-height: 1.4;
    color: #f0f0f0;
    text-align: center;
}
`;
document.head.appendChild(style);