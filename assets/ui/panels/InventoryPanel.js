class InventoryPanel {
    constructor() {
        console.log('InventoryPanel constructor called');
        this.container = null;
        this.currentTab = 'rods';
        this.currentRod = null;
        this.lastEquippedRod = null;
        this.selectedBait = null;
        this.equipmentMenuOpen = false;
        this.currentFish = null;
        this.lastEquippedFish = null;
    }

    initialize(containerId) {
        this.container = document.getElementById(containerId);
        
        // Create panel HTML
        const panel = document.createElement('div');
        panel.id = 'inventory-ui';
        panel.innerHTML = `
            <!-- Toolbar - Quick access slots -->
            <div id="toolbar">
                <div class="slot" id="slot-1">
                    <span class="slot-number">1</span>
                    <span class="slot-name" id="current-rod">No Rod</span>
                </div>
                <div class="slot" id="slot-2">
                    <span class="slot-number">2</span>
                    <span class="slot-name">Equipment</span>
                </div>
            </div>

            <!-- Equipment Menu -->
            <div id="equipment-menu">
                <div class="menu-header">
                    <h2>Equipment</h2>
                    <span class="close-button">×</span>
                </div>
                <div class="tabs">
                    <button class="tab-button" data-tab="rods">Fishing Rods</button>
                    <button class="tab-button" data-tab="bait">Bait</button>
                    <button class="tab-button" data-tab="fish">Fish Collection</button>
                </div>
                <div id="rods-tab" class="tab-content"></div>
                <div id="bait-tab" class="tab-content"></div>
                <div id="fish-tab" class="tab-content">
                    <div class="fish-grid" id="fish-grid"></div>
                </div>
            </div>
        `;
        
        this.container.appendChild(panel);

        // Set up event listeners
        this.setupEventListeners();
        
        // Hide equipment menu initially
        document.getElementById('equipment-menu').style.display = 'none';

        // Show rods tab by default
        this.showTab('rods');

        // Set up message handling
        hytopia.onData((data) => {
            if (data.type === 'inventoryUpdate') {
                this.updateInventory(data.inventory);
                this.updateFishCollection(data.inventory);
                this.updateBaitUI(data.inventory);
            } 
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '1') {
                this.toggleRod();
            } else if (e.key === '2' && !window.MerchantPanel.isMerchantDialogOpen) {
                this.toggleEquipmentMenu();
            } else if (e.key === 'Escape' && this.equipmentMenuOpen) {
                this.toggleEquipmentMenu(false);
            }
        });
    }

    setupEventListeners() {
        // Slot click handlers
        document.getElementById('slot-1').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleRod();
        });
        
        document.getElementById('slot-2').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleEquipmentMenu();
        });

        // Close button
        document.querySelector('.close-button').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleEquipmentMenu(false);
        });

        // Tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showTab(e.target.dataset.tab);
            });
        });

        // When equip button is clicked
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('equip-bait-button')) {
                const baitId = e.target.getAttribute('data-bait-id');
                hytopia.sendData({
                    type: 'equipBait',
                    baitId: baitId
                });
            }
        });
    }

    toggleRod() {
        if (this.currentRod) {
            hytopia.sendData({
                type: 'unequipItem',
                itemType: 'rod'
            });
            // Update UI state
            document.getElementById('current-rod').textContent = 'No Rod';
            this.currentRod = null;
            
            // Update equip button states
            document.querySelectorAll('.equip-button').forEach(button => {
                button.textContent = 'Equip';
                const rodItem = button.closest('.rod-item');
                if (rodItem) {
                    rodItem.classList.remove('equipped');
                }
            });
        } else if (this.lastEquippedRod) {
            hytopia.sendData({
                type: 'equipItem',
                itemId: this.lastEquippedRod
            });
        }
    }

    toggleEquipmentMenu(force) {
        const menu = document.getElementById('equipment-menu');
        this.equipmentMenuOpen = force !== undefined ? force : !this.equipmentMenuOpen;
        
        if (this.equipmentMenuOpen) {
            menu.style.display = 'block';
            menu.style.pointerEvents = 'all';
            hytopia.sendData({ type: 'disablePlayerInput' });
        } else {
            menu.style.display = 'none';
            menu.style.pointerEvents = 'none';
            hytopia.sendData({ type: 'enablePlayerInput' });
        }
    }

    showTab(tabName) {
        // Prevent default behavior and maintain UI control
        event.preventDefault();
        event.stopPropagation();

        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`).style.display = 'block';

        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            }
        });

        this.currentTab = tabName;
    }

    updateInventory(inventory) {        
        const rodsTab = document.getElementById('rods-tab');
        if (!rodsTab) {
            console.error("Could not find rods-tab element");
            return;
        }
        rodsTab.innerHTML = '';

        // Update equipment slots
        const currentRodElement = document.getElementById('current-rod');
        if (!currentRodElement) {
            console.error("Could not find current-rod element");
            return;
        }

        const equippedRod = inventory.items.find(item => item.type === 'rod' && item.equipped);
        currentRodElement.textContent = equippedRod ? equippedRod.name : 'No Rod';

        // Sort rods to show newest first
        console.log("Filtering and sorting rods");
        const sortedRods = inventory.items
            .filter(item => item.type === 'rod')
            .reverse();
        
        console.log("Sorted rods:", sortedRods);

        // Update rod list
        sortedRods.forEach(rod => {
            console.log("Creating element for rod:", rod);
            const rodElement = document.createElement('div');
            rodElement.className = 'rod-item' + (rod.equipped ? ' equipped' : '');
            rodElement.innerHTML = `
                <div class="rod-info">
                    <div class="rod-name">${rod.name}</div>
                    <div class="rod-stats">
                        <span>Max Weight: ${rod.metadata.rodStats.maxCatchWeight}lb</span>
                        <span>Luck: ${rod.metadata.rodStats.luck}</span>
                        <span>Range: ${rod.metadata.rodStats.maxDistance} Blocks</span>
                    </div>
                </div>
                <button class="equip-button" data-rod-id="${rod.id}">
                    ${rod.equipped ? 'Equipped' : 'Equip'}
                </button>
            `;
            rodsTab.appendChild(rodElement);

            if (rod.equipped) {
                this.currentRod = rod.id;
                this.lastEquippedRod = rod.id;
            }
        });

        // Update bait tab
        const baitTab = document.getElementById('bait-tab');
        baitTab.innerHTML = '';

        const sortedBait = inventory.items
            .filter(item => item.type === 'bait')
            .sort((a, b) => {
                if (a.rarity !== b.rarity) return a.rarity === 'uncommon' ? -1 : 1;
                return -1;
            });

        console.log("Sorted bait:", sortedBait);

        sortedBait.forEach(bait => {
            const baitElement = document.createElement('div');
            baitElement.className = 'bait-item' + (this.selectedBait?.id === bait.id ? ' selected' : '');
            baitElement.innerHTML = `
                <div class="bait-info">
                    <div class="bait-header">
                        <div class="bait-name-row">
                            <span class="bait-name ${bait.rarity}">${bait.name}</span>
                            <span class="bait-quantity">x${bait.quantity}</span>
                        </div>
                    </div>
                    <div class="bait-stats">
                        <span>Luck Boost: ${Math.round((bait.metadata.baitStats.baseLuck - 1) * 100)}%</span>
                        ${bait.metadata.baitStats.targetSpecies ? 
                            `<div class="target-species">Best for: ${bait.metadata.baitStats.targetSpecies
                                .map(species => species.split('_')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' '))
                                .join(', ')}</div>` 
                            : ''}
                    </div>
                </div>
                <button class="select-bait-button" data-bait-id="${bait.id}">
                    ${bait.equipped ? 'Equipped' : 'Equip'}
                </button>
            `;
            baitTab.appendChild(baitElement);
        });

        // Set up click handlers for the new elements
        this.setupInventoryClickHandlers();
    }

    setupInventoryClickHandlers() {
        // Rod equip buttons
        document.querySelectorAll('.equip-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const rodId = e.target.dataset.rodId;
                if (rodId) {
                    console.log('Attempting to equip rod:', rodId);
                    // Use consistent message type
                    hytopia.sendData({
                        type: 'equipItem',
                        itemId: rodId
                    });
                    
                    // Update UI immediately for better responsiveness
                    document.querySelectorAll('.equip-button').forEach(btn => {
                        btn.textContent = 'Equip';
                        const rodItem = btn.closest('.rod-item');
                        if (rodItem) {
                            rodItem.classList.remove('equipped');
                        }
                    });
                    
                    button.textContent = 'Equipped';
                    const rodItem = button.closest('.rod-item');
                    if (rodItem) {
                        rodItem.classList.add('equipped');
                    }
                    
                    this.currentRod = rodId;
                    this.lastEquippedRod = rodId;
                    
                    // Update toolbar display
                    const rodName = rodItem.querySelector('.rod-name').textContent;
                    document.getElementById('current-rod').textContent = rodName;
                }
            });
        });

        // Bait select buttons
        document.querySelectorAll('.select-bait-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const baitId = e.target.dataset.baitId;
                if (baitId) {
                    console.log('Attempting to select bait:', baitId);
                    this.selectBait(baitId);
                }
            });
        });

                // Make bait items clickable
        document.querySelectorAll('.bait-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

                // Make bait info clickable
        document.querySelectorAll('.bait-info').forEach(info => {
            info.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

    }

    equipRod(rodId) {
        hytopia.sendData({
            type: 'equipRod',
            rodId: rodId
        });
    }

    selectBait(baitId) {
        console.log('Selecting bait:', baitId);
        hytopia.sendData({
            type: 'equipItem',
            itemId: baitId
        });
        
        // Update selected state locally
        this.selectedBait = { id: baitId };
        
        // Update UI to reflect selection
        document.querySelectorAll('.bait-item').forEach(item => {
            const button = item.querySelector('.select-bait-button');
            if (button && button.dataset.baitId === baitId) {
                item.classList.add('selected');
                button.textContent = 'Equipped';
            } else {
                item.classList.remove('selected');
                button.textContent = 'Equip';
            }
        });
    }

    updateFishCollection(inventory) {
        const fishGrid = document.getElementById('fish-grid');
        if (!fishGrid) return;

        fishGrid.innerHTML = '';
        
        const fishItems = inventory.items.filter(item => item.type === 'fish');
        
        fishItems.forEach(fish => {
            const card = document.createElement('div');
            card.className = `fish-card ${fish.rarity} ${fish.equipped ? 'equipped' : ''}`;
            card.innerHTML = `
                <div class="fish-info">
                    <div class="fish-name">${fish.name}</div>
                    <div class="fish-stats">
                        Rarity: ${fish.rarity}<br>
                        Weight: ${fish.metadata.fishStats.weight}lb<br>
                    </div>
                    <div class="fish-value">${fish.value} coins</div>
                </div>
                <button class="equip-fish-button" data-fish-id="${fish.id}">
                    ${fish.equipped ? 'Equipped' : 'Equip'}
                </button>
            `;

            // Add click handler for equip button
            const equipButton = card.querySelector('.equip-fish-button');
            equipButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Update all buttons first
                document.querySelectorAll('.equip-fish-button').forEach(btn => {
                    btn.textContent = 'Equip';
                    btn.disabled = false;
                });
                
                // Update clicked button
                equipButton.textContent = 'Equipped';
                equipButton.disabled = true;
                
                // Send the update
                hytopia.sendData({ type: 'equipItem', itemId: fish.id });
            });

            fishGrid.appendChild(card);

            if (fish.equipped) {
                this.currentFish = fish.id;
                this.lastEquippedFish = fish.id;
            }
        });

        if (fishItems.length === 0) {
            fishGrid.innerHTML = '<div class="empty-message">No fish caught yet!</div>';
        }
    }

    updateBaitUI(inventory) {
        const baitContainer = document.getElementById('bait-container');
        if (!baitContainer) return;

        // Clear all existing highlights first
        const existingBaitItems = baitTab.querySelectorAll('.bait-item');
        existingBaitItems.forEach(item => {
            item.classList.remove('selected', 'equipped');
        });

        // Update buttons to default state
        const existingButtons = baitTab.querySelectorAll('.select-bait-button');
        existingButtons.forEach(button => {
            button.textContent = 'Equip';
        });

        // Clear existing bait items and reset any lingering selected states
        baitContainer.innerHTML = '';

        // Group bait items by type
        const baitItems = inventory.filter(item => item.type === 'bait');
        
        baitItems.forEach(bait => {
            const baitElement = document.createElement('div');
            baitElement.className = 'bait-item';
            baitElement.setAttribute('data-bait-id', bait.id);
            
            // Only add 'selected' class if bait is actually equipped
            if (bait.equipped) {
                baitElement.classList.add('selected');
            }

            baitElement.innerHTML = `
                <div class="bait-info">
                    <div class="bait-name">${bait.name}</div>
                    <div class="bait-quantity">Quantity: ${bait.quantity}</div>
                    ${bait.metadata.baitStats.targetSpecies ? 
                        `<div class="target-species">Best for: ${bait.metadata.baitStats.targetSpecies
                            .map(species => species.split('_')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' '))
                            .join(', ')}</div>` 
                        : ''}
                </div>
                <button class="equip-bait-button" data-bait-id="${bait.id}">
                    ${bait.equipped ? 'Equipped' : 'Equip'}
                </button>
            `;
            
            baitContainer.appendChild(baitElement);
        });

        // If no bait items exist, show empty state
        if (baitItems.length === 0) {
            baitContainer.innerHTML = `
                <div class="empty-bait-message">
                    No bait available
                </div>
            `;
        }
    }
}

// Make it globally available
window.InventoryPanel = new InventoryPanel();
console.log('InventoryPanel global object created');