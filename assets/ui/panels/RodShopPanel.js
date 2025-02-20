class RodShopPanel {
    constructor() {
        this.container = null;
        this.isShopOpen = false;
    }

    initialize(containerId) {
        this.container = document.getElementById(containerId);
        
        // Create only the rod list panel
        const shopUI = document.createElement('div');
        shopUI.innerHTML = `
            <div id="rod-list-panel">
                <!-- Rod list will be populated here -->
            </div>
        `;
        
        this.container.appendChild(shopUI);
        this.setupEventListeners();
    }

    setupEventListeners() {
        hytopia.onData((data) => {
            if (data.type === 'showRodShop' || data.type === 'updateRodShop') {
                this.setupRodShop(data);
            } else if (data.type === 'hideRodStore') {
                const rodList = document.getElementById('rod-list-panel');
                if (rodList) {
                    rodList.style.display = 'none';
                }
                this.isShopOpen = false;
            }
        });
    }

    setupRodShop(data) {
        const rodListPanel = document.getElementById('rod-list-panel');
        
        // Clear existing content and listeners
        rodListPanel.innerHTML = '<h3 style="color: white; margin-bottom: 10px;">Available Rods</h3>';
        
        // Show panel and disable player input
        rodListPanel.style.display = 'block';
        hytopia.sendData({ type: 'disablePlayerInput' });

        if (data.rods.length === 0) {
            rodListPanel.innerHTML = `
                <div class="empty-shop-state">
                    <button class="close-shop-button">×</button>
                    <h3 style="color: white; margin-bottom: 10px;">No Rods Available</h3>
                    <p style="color: #ccc; text-align: center;">
                        Check back after you level up!<br>
                        Higher levels unlock better fishing rods.
                    </p>
                </div>
            `;
        } else {
            // Add close button at the top for non-empty state
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-shop-button';
            closeBtn.textContent = '×';
            rodListPanel.insertBefore(closeBtn, rodListPanel.firstChild);

            // Create rod list
            data.rods.forEach(rod => {
                const rodRow = document.createElement('div');
                rodRow.className = 'rod-row';
                rodRow.innerHTML = `
                    <div class="rod-info">
                        <div class="rod-name">${rod.name}</div>
                        <div class="rod-stats">
                            Speed: ${rod.metadata.rodStats.catchSpeed} | 
                            Luck: ${rod.metadata.rodStats.luck} | 
                            Range: ${rod.metadata.rodStats.maxDistance}m
                        </div>
                        <div class="rod-price">${rod.value} coins</div>
                    </div>
                    <button 
                        class="purchase-button" 
                        data-rod-id="${rod.id}"
                        ${data.playerCoins < rod.value ? 'disabled' : ''}>
                        ${data.playerCoins < rod.value ? 'Not enough coins' : 'Purchase'}
                    </button>
                `;
                rodListPanel.appendChild(rodRow);
            });
        }

        this.attachShopListeners();
    }

    attachShopListeners() {
        const rodListPanel = document.getElementById('rod-list-panel');
        
        // Close button listeners
        rodListPanel.querySelectorAll('.close-shop-button').forEach(button => {
            button.addEventListener('click', () => {
                console.log('Closing shop');
                rodListPanel.style.display = 'none';
                hytopia.sendData({ type: 'enablePlayerInput' });
            });
        });

        // Purchase button listeners
        rodListPanel.querySelectorAll('.purchase-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const rodId = e.target.getAttribute('data-rod-id');
                if (rodId) {
                    console.log('Attempting to purchase rod:', rodId);
                    hytopia.sendData({
                        type: 'purchaseRod',
                        rodId: rodId
                    });
                }
            });
        });
    }
}

window.RodShopPanel = new RodShopPanel();