class InventoryPanel {
    constructor() {
        this.container = null;
        this.currentTab = 'rods';
        this.currentRod = null;
        this.lastEquippedRod = null;
        this.selectedBait = null;
        this.equipmentMenuOpen = false;
        this.currentFish = null;
        this.lastEquippedFish = null;
        this.cachedBaitItems = null;
    }

    initialize(containerId) {
        this.container = document.getElementById(containerId);
        
        // Create panel HTML with simplified toolbar design
        const panel = document.createElement('div');
        panel.id = 'inventory-ui';
        panel.innerHTML = `
            <!-- Simplified Toolbar - Single inventory button with status line -->
            <div id="inventory-toolbar">
            
                <div id="equipment-status-line">
                    <span id="rod-status">🎣 No Rod</span> | <span id="bait-status">🪱 No Bait</span>
                </div>
            </div>

            <!-- Quick Bait Selection Popup -->
            <div id="bait-quick-select" class="inventory-quick-select">
            </div>

            <!-- Inventory Panel (Crafting-style) -->
            <div id="inventory-equipment-menu" class="inventory-panel">
                <div class="inventory-panel-header">
                    <h2>Equipment & Items</h2>
                    <span class="inventory-close-button">×</span>
                </div>
                
                <div class="inventory-panel-content">
                    <div class="inventory-panel-sidebar">
                        <button class="inventory-sidebar-button active" data-tab="rods">
                            <div class="rod-icon"></div>
                            <span>Fishing Rods</span>
                        </button>
                        <button class="inventory-sidebar-button" data-tab="bait">
                            <div class="worm-icon"></div>
                            <span>Bait</span>
                        </button>
                        <button class="inventory-sidebar-button" data-tab="items">
                             <div class="crate-icon"></div>
                            <span>Loot</span>
                        </button>
                        <button class="inventory-sidebar-button" data-tab="fish">
                            <div class="fish-icon"></div>
                            <span>Fish Collection</span>
                        </button>
                    </div>
                    
                    <div class="inventory-panel-main">
                        <div id="rods-tab" class="inventory-tab-content active"></div>
                        <div id="bait-tab" class="inventory-tab-content"></div>
                        <div id="items-tab" class="inventory-tab-content"></div>
                        <div id="fish-tab" class="inventory-tab-content"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.appendChild(panel);

        // Add CSS for simplified toolbar design
        this.addStyles();
        
        // Add icon styles
        this.addIconStyles();

        // Set up event listeners
        this.setupEventListeners();
        
        // Hide equipment menu and bait selector initially
        document.getElementById('inventory-equipment-menu').style.display = 'none';

        // Show rods tab by default
        this.showTab('rods');

        // Set up message handling
        hytopia.onData((data) => {
            if (data.type === 'inventoryUpdate') {
                this.updateInventory(data.inventory);
            } 
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (window.MerchantPanel?.isMerchantDialogOpen) {
                return; // Don't handle inventory keys if merchant dialog is open
            }

            if (e.key === 'i') {
                this.toggleEquipmentMenu(true);
            } else if (e.key === 'Escape') {
                if (this.equipmentMenuOpen) {
                    this.toggleEquipmentMenu(false);
                }
            }
            // Number keys for toolbar slots
            /*
            if (e.key >= '1' && e.key <= '3') {
                const slotNum = parseInt(e.key);
                this.activateToolbarSlot(slotNum);
                e.preventDefault();
            } 
            */
        });

        // Load saved bait hotkeys
        this.loadBaitHotkeys();
    }
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Panel Base Styles */
            .inventory-panel {
                background-color: rgba(22, 28, 36, 0.95);
                border: 2px solid #3a4a5c;
                border-radius: 8px;
                color: #e0e0e0;
                width: 90%;
                max-width: 1000px;
                height: 80vh;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                box-shadow: 0 5px 25px rgba(0, 0, 0, 0.5);
                overflow: hidden;
            }
            
            .inventory-panel-header {
                background: linear-gradient(to right, #2c3e50, #4a6491);
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #3a4a5c;
            }
            
            .inventory-panel-header h2 {
                margin: 0;
                color: #ffffff;
                font-size: 22px;
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }
            
            .inventory-close-button {
                font-size: 28px;
                cursor: pointer;
                color: #ffffff;
                transition: color 0.2s;
            }
            
            .inventory-close-button:hover {
                color: #ff9966;
            }
            
            .inventory-panel-content {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            /* Sidebar Styles */
            .inventory-panel-sidebar {
                width: 220px;
                background-color: rgba(30, 38, 50, 0.8);
                border-right: 1px solid #3a4a5c;
                display: flex;
                flex-direction: column;
                padding: 15px 0;
            }
            
            .inventory-sidebar-button {
                background: transparent;
                border: none;
                color: #b0b0b0;
                padding: 12px 15px;
                text-align: left;
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: all 0.2s;
                border-left: 3px solid transparent;
            }
            
            .inventory-sidebar-button img {
                width: 24px;
                height: 24px;
                margin-right: 12px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .inventory-sidebar-button:hover {
                background-color: rgba(74, 100, 145, 0.2);
                color: #ffffff;
            }
            
            .inventory-sidebar-button:hover img {
                opacity: 1;
            }
            
            .inventory-sidebar-button.active {
                background-color: rgba(74, 100, 145, 0.3);
                color: #ffffff;
                border-left: 3px solid #4a90e2;
            }
            
            .inventory-sidebar-button.active img {
                opacity: 1;
            }
            
            /* Main Content Area */
            .inventory-panel-main {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: #4a6491 #1e2632;
            }
            
            .inventory-panel-main::-webkit-scrollbar {
                width: 8px;
            }
            
            .inventory-panel-main::-webkit-scrollbar-track {
                background: #1e2632;
            }
            
            .inventory-panel-main::-webkit-scrollbar-thumb {
                background-color: #4a6491;
                border-radius: 4px;
            }
            
            /* Tab Content */
            .inventory-tab-content {
                display: none;
                animation: fadeIn 0.3s ease;
            }
            
            .inventory-tab-content.active {
                display: block;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            /* Empty Message */
            .inventory-empty-message {
                text-align: center;
                padding: 40px 0;
                color: #8a9cad;
                font-style: italic;
            }
            
            /* Rod Items */
            .inventory-rod-item {
                background-color: rgba(40, 50, 65, 0.7);
                border: 1px solid #3a4a5c;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s;
            }
            
            .inventory-rod-item:hover {
                background-color: rgba(50, 65, 85, 0.8);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .inventory-rod-item.equipped {
                border: 1px solid #4a90e2;
                background-color: rgba(74, 144, 226, 0.15);
            }
            
            .inventory-rod-info {
                flex: 1;
            }
            
            .inventory-rod-name {
                font-size: 18px;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 8px;
            }
            
            .inventory-rod-stats {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                color: #b0b0b0;
                font-size: 14px;
            }
            
            .inventory-equip-button {
                background-color: #4a6491;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 500;
            }
            
            .inventory-equip-button:hover {
                background-color: #5a7cb6;
            }
            
            .inventory-rod-item.equipped .inventory-equip-button {
                background-color: #2c3e50;
            }
            
            /* Bait Items */
            .inventory-bait-section {
                margin-bottom: 25px;
            }
            
            .inventory-section-header {
                color: #4a90e2;
                font-size: 18px;
                margin-bottom: 15px;
                padding-bottom: 5px;
                border-bottom: 2px solid #4a90e2;
            }
            
            .inventory-bait-item {
                background-color: rgba(40, 50, 65, 0.7);
                border: 1px solid #3a4a5c;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s;
            }
            
            .inventory-bait-item:hover {
                background-color: rgba(50, 65, 85, 0.8);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .inventory-bait-item.selected {
                border: 1px solid #4a90e2;
                background-color: rgba(74, 144, 226, 0.15);
            }
            
            .inventory-bait-info {
                flex: 1;
            }
            
            .inventory-bait-header {
                margin-bottom: 8px;
            }
            
            .inventory-bait-name-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .inventory-bait-name {
                font-size: 16px;
                font-weight: 600;
                color: #ffffff;
            }
            
            .inventory-bait-name.common { color: #b0b0b0; }
            .inventory-bait-name.uncommon { color: #4ade80; }
            .inventory-bait-name.rare { color: #60a5fa; }
            .inventory-bait-name.epic { color: #c084fc; }
            .inventory-bait-name.legendary { color: #facc15; }
            
            .inventory-bait-quantity {
                color: #8a9cad;
                font-size: 14px;
            }
            
            .inventory-bait-stats {
                color: #b0b0b0;
                font-size: 14px;
            }
            
            .inventory-target-species {
                margin-top: 5px;
                font-style: italic;
            }
            
            .inventory-select-bait-button {
                background-color: #4a6491;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 500;
            }
            
            .inventory-select-bait-button:hover {
                background-color: #5a7cb6;
            }
            
            .inventory-bait-item.selected .inventory-select-bait-button {
                background-color: #2c3e50;
            }
            
            /* Items Grid */
            .inventory-items-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .inventory-item-card {
                background-color: rgba(40, 50, 65, 0.7);
                border: 1px solid #3a4a5c;
                border-radius: 6px;
                padding: 15px;
                display: flex;
                flex-direction: column;
                transition: all 0.2s;
            }
            
            .inventory-item-card:hover {
                background-color: rgba(50, 65, 85, 0.8);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .inventory-item-card.common { border-color: #b0b0b0; }
            .inventory-item-card.uncommon { border-color: #4ade80; }
            .inventory-item-card.rare { border-color: #60a5fa; }
            .inventory-item-card.epic { border-color: #c084fc; }
            .inventory-item-card.legendary { border-color: #facc15; }
            
            .inventory-item-info {
                flex: 1;
                margin-bottom: 15px;
            }
            
            .inventory-item-name {
                font-size: 16px;
                font-weight: 600;
                color: #ffffff;
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .inventory-item-quantity {
                color: #8a9cad;
                font-size: 14px;
                font-weight: normal;
            }
            
            .inventory-item-description {
                color: #b0b0b0;
                font-size: 14px;
                font-style: italic;
            }
            
            .inventory-use-item-button {
                background-color: #4a6491;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 500;
                align-self: flex-end;
            }
            
            .inventory-use-item-button:hover {
                background-color: #5a7cb6;
            }
            
            /* Fish Grid */
            .inventory-fish-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .inventory-fish-card {
                background-color: rgba(40, 50, 65, 0.7);
                border: 1px solid #3a4a5c;
                border-radius: 6px;
                padding: 15px;
                display: flex;
                flex-direction: column;
                transition: all 0.2s;
            }
            
            .inventory-fish-card:hover {
                background-color: rgba(50, 65, 85, 0.8);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .inventory-fish-card.common { border-color: #b0b0b0; }
            .inventory-fish-card.uncommon { border-color: #4ade80; }
            .inventory-fish-card.rare { border-color: #60a5fa; }
            .inventory-fish-card.epic { border-color: #c084fc; }
            .inventory-fish-card.legendary { border-color: #facc15; }
            
            .inventory-fish-card.equipped {
                background-color: rgba(74, 144, 226, 0.15);
            }
            
            .inventory-fish-info {
                flex: 1;
                margin-bottom: 15px;
            }
            
            .inventory-fish-name {
                font-size: 16px;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 8px;
            }
            
            .inventory-fish-stats {
                color: #b0b0b0;
                font-size: 14px;
                margin-bottom: 8px;
            }
            
            .inventory-fish-value {
                color: #facc15;
                font-size: 14px;
                font-weight: 500;
            }
            
            .inventory-equip-fish-button {
                background-color: #4a6491;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 500;
                align-self: flex-end;
            }
            
            .inventory-equip-fish-button:hover {
                background-color: #5a7cb6;
            }
            
            .inventory-fish-card.equipped .inventory-equip-fish-button {
                background-color: #2c3e50;
            }
            
            /* Updated Toolbar Styles */
            #inventory-toolbar {
                position: fixed;
                bottom: 25px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                z-index: 900;
            }
            
            .inventory-slot {
                background-color: rgba(30, 40, 55, 0.85);
                border: 2px solid #4a6491;
                border-radius: 8px;
                width: 80px;
                height: 80px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
                margin-bottom: 5px;
            }
            
            #equipment-status-line {
                background-color: rgba(30, 40, 55, 0.7);
                border: 1px solid #4a6491;
                border-radius: 4px;
                padding: 5px 10px;
                color: white;
                font-size: 14px;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                white-space: nowrap;
            }
            

            .inventory-quick-select-header {
                background: linear-gradient(to right, #2c3e50, #4a6491) !important;
                padding: 10px 15px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                border-bottom: 1px solid #3a4a5c !important;
            }
            
            .inventory-quick-select-header h3 {
                margin: 0 !important;
                color: #ffffff !important;
                font-size: 16px !important;
                font-weight: 600 !important;
            }
            
            .inventory-quick-close {
                font-size: 20px !important;
                cursor: pointer !important;
                color: #ffffff !important;
            }
            
            .inventory-quick-select-content {
                padding: 10px !important;
                overflow-y: auto !important;
                max-height: 250px !important;
            }
            
            .inventory-quick-bait-option {
                display: flex !important;
                align-items: center !important;
                padding: 8px !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                transition: background-color 0.2s !important;
                margin-bottom: 5px !important;
                position: relative !important;
            }
            
            .inventory-quick-bait-option:hover {
                background-color: rgba(74, 100, 145, 0.3) !important;
            }
            
            .inventory-quick-bait-option.selected {
                background-color: rgba(74, 144, 226, 0.15) !important;
                border: 1px solid #4a90e2 !important;
            }
            
            .inventory-quick-bait-hotkey {
                position: absolute !important;
                right: 8px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                background-color: #2c3e50 !important;
                color: white !important;
                border-radius: 4px !important;
                padding: 2px 6px !important;
                font-size: 11px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            .inventory-quick-bait-icon {
                width: 24px !important;
                height: 24px !important;
                margin-right: 10px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            .inventory-quick-bait-icon img {
                max-width: 100% !important;
                max-height: 100% !important;
            }
            
            .inventory-quick-bait-info {
                flex: 1 !important;
            }
            
            .inventory-quick-bait-name {
                font-weight: 500 !important;
                color: #ffffff !important;
            }
            
            .inventory-quick-bait-name.common { color: #b0b0b0 !important; }
            .inventory-quick-bait-name.uncommon { color: #4ade80 !important; }
            .inventory-quick-bait-name.rare { color: #60a5fa !important; }
            .inventory-quick-bait-name.epic { color: #c084fc !important; }
            .inventory-quick-bait-name.legendary { color: #facc15 !important; }
            
            .inventory-quick-bait-quantity {
                font-size: 12px !important;
                color: #8a9cad !important;
            }
        `;
        document.head.appendChild(style);
    }
    addIconStyles() {
        console.log('Setting up icon styles with dynamic paths');
        
        // Apply background images to tab icons using the same approach as bait items
        setTimeout(() => {
            const baseUrl = this.getAssetBaseUrl();
            console.log('Using base URL for icons:', baseUrl);
            
            // Apply to rod icon
            const rodIcons = document.querySelectorAll('.rod-icon');
            rodIcons.forEach(icon => {
                icon.style.backgroundImage = `url('${baseUrl}/ui/icons/rod-icon.png')`;
                icon.style.backgroundSize = 'contain';
                icon.style.backgroundRepeat = 'no-repeat';
                icon.style.backgroundPosition = 'center';
                icon.style.width = '24px';
                icon.style.height = '24px';
                icon.style.marginRight = '12px';
            });
            
            // Apply to worm icon
            const wormIcons = document.querySelectorAll('.worm-icon');
            wormIcons.forEach(icon => {
                icon.style.backgroundImage = `url('${baseUrl}/ui/icons/worm_sprite.png')`;
                icon.style.backgroundSize = 'contain';
                icon.style.backgroundRepeat = 'no-repeat';
                icon.style.backgroundPosition = 'center';
                icon.style.width = '24px';
                icon.style.height = '24px';
                icon.style.marginRight = '12px';
            });

            const fishIcons = document.querySelectorAll('.fish-icon');
            fishIcons.forEach(icon => {
                icon.style.backgroundImage = `url('${baseUrl}/ui/icons/mackerel_sprite.png')`;
                icon.style.backgroundSize = 'contain';
                icon.style.backgroundRepeat = 'no-repeat';
                icon.style.backgroundPosition = 'center';
                icon.style.width = '24px';
                icon.style.height = '24px';
                icon.style.marginRight = '12px';
            });

            const crateIcons = document.querySelectorAll('.crate-icon');
            crateIcons.forEach(icon => {
                icon.style.backgroundImage = `url('${baseUrl}/ui/icons/seaweed_sprite.png')`;
                icon.style.backgroundSize = 'contain';
                icon.style.backgroundRepeat = 'no-repeat';
                icon.style.backgroundPosition = 'center';
                icon.style.width = '24px';
                icon.style.height = '24px';
                icon.style.marginRight = '12px';
            });
            
            // Apply to backpack icon if needed
            const backpackIcons = document.querySelectorAll('.backpack-icon');
            backpackIcons.forEach(icon => {
                icon.style.backgroundImage = `url('${baseUrl}/ui/icons/backpack.png')`;
                icon.style.backgroundSize = 'contain';
                icon.style.backgroundRepeat = 'no-repeat';
                icon.style.backgroundPosition = 'center';
                icon.style.width = '40px';
                icon.style.height = '40px';
            });
            
            console.log('Applied dynamic background images to icons');
        }, 100); // Small delay to ensure elements are in the DOM
    }
    setupEventListeners() {
        // Close button for main inventory
        document.querySelector('.inventory-close-button').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleEquipmentMenu(false);
        });

        // Sidebar tab buttons
        document.querySelectorAll('.inventory-sidebar-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showTab(button.dataset.tab);
            });
        });

        // Toolbar slots
        document.querySelectorAll('.inventory-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const slotNum = parseInt(slot.dataset.slot);
                this.activateToolbarSlot(slotNum);
            });
        });
    }

    toggleEquipmentMenu(force) {
        const menu = document.getElementById('inventory-equipment-menu');
        this.equipmentMenuOpen = force !== undefined ? force : !this.equipmentOpen;
        
        if (this.equipmentMenuOpen) {
            // Close bait quick select if open
           // this.toggleBaitQuickSelect(false);
            
            menu.style.display = 'flex';
            menu.style.pointerEvents = 'all';
            hytopia.sendData({ type: 'disablePlayerInput' });
        } else {
            menu.style.display = 'none';
            menu.style.pointerEvents = 'none';
            hytopia.sendData({ type: 'enablePlayerInput' });
        }
    }

    showTab(tabName) {
        // Hide all tab content
        document.querySelectorAll('.inventory-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Update active sidebar button
        document.querySelectorAll('.inventory-sidebar-button').forEach(button => {
            button.classList.remove('active');
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            }
        });

        this.currentTab = tabName;
    }

    updateInventory(inventory) {
        // Cache bait items for quick select
        this.cachedBaitItems = inventory.items.filter(item => item.type === 'bait');
        
        // Update all tabs with inventory data
        this.updateRodsTab(inventory);
        this.updateBaitTab(inventory);
        this.updateItemsTab(inventory);
        this.updateFishTab(inventory);
        
        // Update toolbar displays
        this.updateToolbarDisplay(inventory);
    }

    updateRodsTab(inventory) {
        const rodsTab = document.getElementById('rods-tab');
        if (!rodsTab) return;
        
        rodsTab.innerHTML = '';

        // Sort rods to show newest first
        const sortedRods = inventory.items
            .filter(item => item.type === 'rod')
            .reverse();
        
        if (sortedRods.length === 0) {
            rodsTab.innerHTML = '<div class="inventory-empty-message">No fishing rods available</div>';
            return;
        }

        // Update rod list
        sortedRods.forEach(rod => {
            const card = document.createElement('div');
            card.className = `inventory-rod-item ${rod.rarity} ${rod.equipped ? 'equipped' : ''}`;
            card.innerHTML = `
                <div class="inventory-rod-info">
                    <div class="inventory-rod-name">${rod.name}</div>
                    <div class="inventory-rod-stats">
                        <div>Range: ${rod.metadata.rodStats.maxDistance}m</div>
                        <div>Max Weight: ${rod.metadata.rodStats.maxCatchWeight}lb</div>
                        <div>Health: ${rod.metadata.rodStats.health || 100}%</div>
                    </div>
                </div>
                <button class="inventory-equip-button" data-rod-id="${rod.id}">
                    ${rod.equipped ? 'Equipped' : 'Equip'}
                </button>
            `;
            rodsTab.appendChild(card);

            if (rod.equipped) {
                this.currentRod = rod.id;
                this.lastEquippedRod = rod.id;
            }
        });

        // Set up click handlers
        this.setupRodClickHandlers();
    }

    updateBaitTab(inventory) {
        const baitTab = document.getElementById('bait-tab');
        if (!baitTab) {
            console.error('Bait tab element not found');
            return;
        }
        
        console.log('Updating bait tab with inventory:', inventory);
        
        // Clear existing content
        baitTab.innerHTML = '';
        
        // Cache bait items
        this.cachedBaitItems = inventory.items.filter(item => item.type === 'bait');
        console.log('Cached bait items:', this.cachedBaitItems);
        
        // Create the bait tab structure similar to crafting panel
        baitTab.innerHTML = `
            <div class="bait-content">
                <!-- Hotbar section (similar to crafting grid) -->
                
                <!-- Bait inventory section (similar to crafting inventory) -->
                <div class="bait-inventory-section">
                    <h3>Click a Bait to Equip</h3>
                    <div class="bait-inventory-grid" id="bait-inventory-grid"></div>
                </div>
            </div>
        `;
        
        // Initialize bait hotbar if not already done
        if (!this.baitHotbar) {
            this.baitHotbar = [null, null, null, null, null];
            this.loadBaitHotbar();
        }
        
        // Populate the bait inventory grid
        const baitGrid = document.getElementById('bait-inventory-grid');
        if (baitGrid) {
            // Clear existing content
            baitGrid.innerHTML = '';
            
            if (this.cachedBaitItems.length === 0) {
                baitGrid.innerHTML = '<div class="empty-message">No bait available</div>';
            } else {
                // Create a grid of bait items
                this.cachedBaitItems.forEach(bait => {
                    const baitElement = document.createElement('div');
                    baitElement.className = 'bait-item';
                    if (bait.equipped) {
                        baitElement.classList.add('equipped');
                    }
                    baitElement.dataset.baitId = bait.id;
                    
                    // Get sprite path for this bait
                    const baseUrl = this.getAssetBaseUrl();
                    let spritePath = '';
                    if (bait.sprite) {
                        if (!bait.sprite.includes('/')) {
                            spritePath = `${baseUrl}/ui/icons/${bait.sprite}`;
                        } else {
                            spritePath = `${baseUrl}${bait.sprite}`;
                        }
                    } else if (bait.id.includes('worm')) {
                        spritePath = `${baseUrl}/ui/icons/worm_sprite.png`;
                    } else {
                        spritePath = `${baseUrl}/ui/icons/bait/${bait.id}.png`;
                    }
                    
                    baitElement.innerHTML = `
                        <div class="bait-icon" style="background-image: url('${spritePath}');"></div>
                        <div class="bait-name ${bait.rarity}">${bait.name}</div>
                        <div class="bait-quantity">x${bait.quantity}</div>
                    `;
                    
                    // Make draggable
                    /*
                    baitElement.draggable = true;
                    baitElement.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({
                            type: 'bait',
                            id: bait.id,
                            data: bait
                        }));
                        e.dataTransfer.effectAllowed = 'copy';
                    });
                    */
                    
                    // Add tooltip on hover
                    baitElement.addEventListener('mouseenter', (e) => {
                        this.showBaitTooltip(bait, e);
                    });
                    
                    baitElement.addEventListener('mouseleave', () => {
                        const tooltip = document.getElementById('bait-tooltip');
                        if (tooltip) tooltip.style.display = 'none';
                    });
                    
                    // Click to equip
                    baitElement.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.equipBait(bait.id);
                    });
                    
                    baitGrid.appendChild(baitElement);
                });
            }
        }
        
        // Set up drag and drop for hotbar slots
        this.setupBaitHotbarDragAndDrop();
        
        // Update hotbar display - IMPORTANT: Only update the display, don't add items
        this.updateHotbarDisplay();
        
        // Add bait styles if not already added
        if (!document.getElementById('bait-styles')) {
            this.addBaitStyles();
        }
        
        // Create tooltip element if it doesn't exist
        if (!document.getElementById('bait-tooltip')) {
            const tooltip = document.createElement('div');
            tooltip.id = 'bait-tooltip';
            tooltip.className = 'bait-tooltip';
            document.body.appendChild(tooltip);
        }
    }

    updateHotbarDisplay() {
        console.log('updateHotbarDisplay called');
        console.log('Current baitHotbar:', this.baitHotbar);
        
        const hotbarSlots = document.querySelectorAll('.bait-hotbar-slot');
        console.log(`Found ${hotbarSlots.length} hotbar slots`);
        
        if (hotbarSlots.length === 0) {
            console.error('No hotbar slots found in the DOM');
            return;
        }
        
        hotbarSlots.forEach((slot, index) => {
            console.log(`Processing slot ${index}`);
            
            // Clear existing content except slot number
            const slotNumber = slot.querySelector('.hotbar-slot-number');
            if (slotNumber) {
                console.log(`Slot ${index} has slot number element, preserving it`);
                slot.innerHTML = '';
                slot.appendChild(slotNumber);
            } else {
                console.log(`Slot ${index} missing slot number, creating new one`);
                slot.innerHTML = '';
                const newSlotNumber = document.createElement('span');
                newSlotNumber.className = 'hotbar-slot-number';
                newSlotNumber.textContent = index + 1;
                slot.appendChild(newSlotNumber);
            }
            
            const baitData = this.baitHotbar[index];
            console.log(`Slot ${index} bait data:`, baitData);
            
            if (baitData) {
                console.log(`Slot ${index} has bait assigned: ${baitData}`);
                
                // Check if the bait still exists in the inventory
                if (!this.cachedBaitItems) {
                    console.error('cachedBaitItems is null or undefined');
                    return;
                }
                
                console.log(`Checking if bait ${baitData} exists in inventory of ${this.cachedBaitItems.length} items`);
                const baitStillExists = this.cachedBaitItems.some(item => item.id === baitData);
                console.log(`Bait ${baitData} exists in inventory: ${baitStillExists}`);
                
                if (baitStillExists) {
                    // Get the current bait data from the inventory
                    const currentBait = this.cachedBaitItems.find(item => item.id === baitData);
                    console.log(`Found current bait data:`, currentBait);
                    
                    // Get sprite path
                    const baseUrl = this.getAssetBaseUrl();
                    let spritePath = '';
                    
                    if (currentBait.sprite) {
                        if (!currentBait.sprite.includes('/')) {
                            spritePath = `${baseUrl}/ui/icons/${currentBait.sprite}`;
                        } else {
                            spritePath = `${baseUrl}${currentBait.sprite}`;
                        }
                    } else if (currentBait.id.includes('worm')) {
                        spritePath = `${baseUrl}/ui/icons/worm_sprite.png`;
                    } else {
                        spritePath = `${baseUrl}/ui/icons/bait/${currentBait.id}.png`;
                    }
                    console.log(`Using sprite path: ${spritePath}`);
                    
                    // Create bait element
                    const baitElement = document.createElement('div');
                    baitElement.className = 'bait-item in-hotbar';
                    baitElement.dataset.baitId = currentBait.id;
                    
                    baitElement.innerHTML = `
                        <div class="bait-icon" style="background-image: url('${spritePath}');"></div>
                        <div class="bait-quantity">x${currentBait.quantity}</div>
                    `;
                    
                    slot.appendChild(baitElement);
                    console.log(`Added bait element to slot ${index}`);
                    
                    // Highlight if equipped
                    if (currentBait.equipped) {
                        console.log(`Bait ${currentBait.id} is equipped, highlighting slot ${index}`);
                        slot.classList.add('equipped');
                    } else {
                        slot.classList.remove('equipped');
                    }
                } else {
                    console.log(`Bait ${baitData} no longer exists in inventory, removing from slot ${index}`);
                    // Bait no longer exists in inventory, remove from hotbar
                    this.baitHotbar[index] = null;
                    this.saveHotbar();
                }
            } else {
                console.log(`Slot ${index} is empty`);
            }
        });
        
        console.log('updateHotbarDisplay completed');
    }

    setupBaitHotbarDragAndDrop() {
        const hotbarSlots = document.querySelectorAll('.bait-hotbar-slot');
        
        hotbarSlots.forEach((slot, index) => {
            // Make slots droppable
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                slot.classList.add('drag-over');
            });
            
            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-over');
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                
                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (data.type === 'bait') {
                        this.assignBaitToHotbarSlot(index, data.id);
                    }
                } catch (error) {
                    console.error('Error parsing drag data:', error);
                }
            });
            
            // Click to equip if bait is assigned
            slot.addEventListener('click', () => {
                const baitId = this.baitHotbar[index];
                if (baitId) {
                    this.equipBait(baitId);
                }
            });
        });
    }

    getBaitById(baitId) {
        if (!this.cachedBaitItems) return null;
        return this.cachedBaitItems.find(bait => bait.id === baitId);
    }

    assignBaitToHotbarSlot(slotIndex, baitId) {
        console.log(`Assigning bait ${baitId} to hotbar slot ${slotIndex}`);
        if (slotIndex < 0 || slotIndex >= this.baitHotbar.length) return;
        console.log(`Bait hotbar: ${this.baitHotbar}`);
        
        // Check if this bait is already in another slot
        const existingSlotIndex = this.baitHotbar.indexOf(baitId);
        if (existingSlotIndex !== -1 && existingSlotIndex !== slotIndex) {
            console.log(`Bait ${baitId} is already in slot ${existingSlotIndex}`);
            
            // Show notification to user
            this.showNotification(`This bait is already assigned to slot ${existingSlotIndex + 1}`);
            
            // Don't allow the drop
            return;
        }
        
        // Assign bait to slot
        this.baitHotbar[slotIndex] = baitId;
        
        // Save to localStorage
        this.saveHotbar();
        
        // Update display with a small delay to ensure DOM is ready
        setTimeout(() => {
            this.updateHotbarDisplay();
        }, 10); // 10ms delay
        
        console.log(`Assigned bait ${baitId} to hotbar slot ${slotIndex}`);
    }

    saveHotbar() {
        try {
            localStorage.setItem('baitHotbar', JSON.stringify(this.baitHotbar));
        } catch (error) {
            console.error('Error saving bait hotbar:', error);
        }
    }

    loadBaitHotbar() {
        try {
            const saved = localStorage.getItem('baitHotbar');
            if (saved) {
                // Load the saved configuration
                const savedHotbar = JSON.parse(saved);
                
                // Initialize with nulls
                this.baitHotbar = [null, null, null, null, null];
                
                // Only copy valid entries from saved data
                for (let i = 0; i < savedHotbar.length && i < this.baitHotbar.length; i++) {
                    if (savedHotbar[i]) {
                        // We'll validate each saved item when we display it
                        this.baitHotbar[i] = savedHotbar[i];
                    }
                }
            } else {
                // Initialize with empty slots
                this.baitHotbar = [null, null, null, null, null];
            }
        } catch (error) {
            console.error('Error loading bait hotbar:', error);
            this.baitHotbar = [null, null, null, null, null];
        }
    }

    addBaitStyles() {
        const style = document.createElement('style');
        style.id = 'bait-styles';
        style.textContent = `
            /* Bait tab layout similar to crafting panel */
            .bait-content {
                display: flex;
                flex-direction: column;
                gap: 20px;
                padding: 10px;
            }
            
            /* Hotbar section */
            .bait-hotbar-section {
                background: rgba(10, 22, 34, 0.5);
                border-radius: 8px;
                padding: 15px;
            }
            
            .bait-hotbar-section h3 {
                color: #4a90e2;
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 18px;
                border-bottom: 1px solid #4a90e2;
                padding-bottom: 5px;
            }
            
            .bait-hotbar-grid {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-bottom: 10px;
            }
            
            .bait-hotbar-slot {
                width: 70px;
                height: 70px;
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid #4a90e2;
                border-radius: 6px;
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .bait-hotbar-slot:hover {
                background: rgba(74, 144, 226, 0.1);
            }
            
            .bait-hotbar-slot.equipped {
                border-color: #ffeb3b;
                box-shadow: 0 0 10px rgba(255, 235, 59, 0.5);
            }
            
            .bait-hotbar-slot .hotbar-slot-number {
                position: absolute;
                top: 2px;
                left: 5px;
                font-size: 12px;
                color: #aaa;
            }
            
            .bait-hotbar-help {
                text-align: center;
                color: #8a9cad;
                font-style: italic;
                font-size: 12px;
                margin-top: 10px;
            }
            .bait-item.in-hotbar {
                width: 100%;
                height: 100%;
                margin: 0;
                border: none;
                background: transparent;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .bait-item.in-hotbar .bait-icon {
                width: 60%;
                height: 60%;
            }

            .bait-item.in-hotbar .bait-quantity {
                position: absolute;
                bottom: 20%;
                right: 10%;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                font-size: 10px;
                padding: 1px 4px;
                border-radius: 4px;
                z-index: 2;
            }
            
            /* Inventory section */
            .bait-inventory-section {
                background: rgba(10, 22, 34, 0.5);
                border-radius: 8px;
                padding: 15px;
            }
            
            .bait-inventory-section h3 {
                color: #4a90e2;
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 18px;
                border-bottom: 1px solid #4a90e2;
                padding-bottom: 5px;
            }
            
            .bait-inventory-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 1px;
                max-height: 250px;
                overflow-y: auto;
                padding-right: 5px;
            }
            
            .bait-item {
                width: 70px;
                height: 70px;
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid #4a90e2;
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                position: relative;
                cursor: pointer;
                transition: all 0.2s;
                padding: 5px;
            }
            
            .bait-item:hover {
                background: rgba(74, 144, 226, 0.1);

            }
            
            .bait-item.equipped {
                border-color: #ffeb3b;
                box-shadow: 0 0 10px rgba(255, 235, 59, 0.5);
            }
            
            .bait-item .bait-icon {
                width: 32px;
                height: 32px;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            }
            
            .bait-item .bait-name {
                font-size: 10px;
                color: white;
                text-align: center;
                margin-top: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
            }
            
            .bait-item .bait-quantity {
                position: absolute;
                bottom: 2px;
                right: 2px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                font-size: 10px;
                padding: 1px 4px;
                border-radius: 4px;
            }
            
            .item-in-slot {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .empty-message {
                text-align: center;
                padding: 20px;
                color: #8a9cad;
                font-style: italic;
            }
            
            .drag-over {
                background: rgba(74, 144, 226, 0.3);
                border-style: dashed;
            }
            
            .bait-tooltip {
                position: fixed;
                display: none;
                background: rgba(22, 28, 36, 0.95);
                border: 1px solid #4a90e2;
                border-radius: 6px;
                padding: 10px;
                min-width: 200px;
                max-width: 300px;
                z-index: 3000;
                color: white;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            }
            
            .tooltip-title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                padding-bottom: 4px;
            }
            
            .tooltip-stat {
                font-size: 12px;
                margin-bottom: 4px;
            }
            
            .tooltip-stat-label {
                color: #aaa;
            }
            
            .tooltip-description {
                font-size: 12px;
                font-style: italic;
                color: #ccc;
                margin-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                padding-top: 4px;
            }
            
            /* Rarity colors */
            .common { color: #ffffff; }
            .uncommon { color: #4caf50; }
            .rare { color: #2196f3; }
            .epic { color: #9c27b0; }
            .legendary { color: #ff9800; }
        `;
        
        document.head.appendChild(style);
    }

    updateItemsTab(inventory) {
        const itemsTab = document.getElementById('items-tab');
        if (!itemsTab) {
            console.error('Items tab element not found');
            return;
        }
        
        console.log('Updating items tab with inventory:', inventory);
        
        // Clear existing content
        itemsTab.innerHTML = '';
        
        // Cache items
        this.cachedItems = inventory.items.filter(item => 
            item.type === 'item' && 
            !item.isEquipment && 
            !item.isBait
        );
        console.log('Cached items:', this.cachedItems);
        
        // Create the items tab structure similar to bait tab
        itemsTab.innerHTML = `
            <div class="items-content">
                <div class="items-inventory-section">
                    <h3>Your Items</h3>
                    <div class="items-inventory-grid" id="items-inventory-grid"></div>
                </div>
            </div>
        `;
        
        // Populate the items inventory grid
        const itemsGrid = document.getElementById('items-inventory-grid');
        if (itemsGrid) {
            // Clear existing content
            itemsGrid.innerHTML = '';
            
            if (this.cachedItems.length === 0) {
                itemsGrid.innerHTML = '<div class="empty-message">No items available</div>';
            } else {
                // Create a grid of items
                this.cachedItems.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'bait-item'; // Use same class as bait for styling
                    itemElement.dataset.itemId = item.id;
                    
                    // Get sprite path for this item
                    const baseUrl = this.getAssetBaseUrl();
                    let spritePath = '';
                    if (item.sprite) {
                        if (!item.sprite.includes('/')) {
                            spritePath = `${baseUrl}/ui/icons/${item.sprite}`;
                        } else {
                            spritePath = `${baseUrl}${item.sprite}`;
                        }
                    } else {
                        spritePath = `${baseUrl}/ui/icons/items/${item.id}.png`;
                    }
                    
                    itemElement.innerHTML = `
                        <div class="bait-icon" style="background-image: url('${spritePath}');"></div>
                        <div class="bait-name ${item.rarity}">${item.name}</div>
                        <div class="bait-quantity">x${item.quantity}</div>
                        <button class="drop-item-button">Drop</button>
                    `;
                    
                    // Add tooltip on hover
                    itemElement.addEventListener('mouseenter', (e) => {
                        this.showItemTooltip(item, e);
                    });
                    
                    itemElement.addEventListener('mouseleave', () => {
                        const tooltip = document.getElementById('bait-tooltip');
                        if (tooltip) tooltip.style.display = 'none';
                    });
                    
                    // Drop button click
                    const dropButton = itemElement.querySelector('.drop-item-button');
                    dropButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Hide tooltip when dropping an item
                        const tooltip = document.getElementById('bait-tooltip');
                        if (tooltip) tooltip.style.display = 'none';
                        
                        this.dropItem(item.id);
                    });
                    
                    itemsGrid.appendChild(itemElement);
                });
            }
        }
        
        // Add items styles if not already added
        if (!document.getElementById('items-styles')) {
            this.addItemsStyles();
        }
    }

    updateFishTab(inventory) {
        const fishTab = document.getElementById('fish-tab');
        if (!fishTab) return;
        
        fishTab.innerHTML = '';
        
        const fishGrid = document.createElement('div');
        fishGrid.className = 'inventory-fish-grid';
        
        const fishItems = inventory.items.filter(item => item.type === 'fish');
        
        if (fishItems.length === 0) {
            fishTab.innerHTML = '<div class="inventory-empty-message">No fish caught yet!</div>';
            return;
        }
        
        fishItems.forEach(fish => {
            const card = document.createElement('div');
            card.className = `inventory-fish-card ${fish.rarity} ${fish.equipped ? 'equipped' : ''}`;
            card.innerHTML = `
                <div class="inventory-fish-info">
                    <div class="inventory-fish-name">${fish.name}</div>
                    <div class="inventory-fish-stats">
                        Rarity: ${fish.rarity}<br>
                        Weight: ${fish.metadata.fishStats.weight}lb<br>
                    </div>
                    <div class="inventory-fish-value">${fish.value} coins</div>
                </div>
                <button class="inventory-equip-fish-button" data-fish-id="${fish.id}">
                    ${fish.equipped ? 'Equipped' : 'Equip'}
                </button>
            `;
            
            fishGrid.appendChild(card);
            
            if (fish.equipped) {
                this.currentFish = fish.id;
                this.lastEquippedFish = fish.id;
            }
        });
        
        fishTab.appendChild(fishGrid);
        
        // Set up click handlers
        this.setupFishClickHandlers();
    }

    setupRodClickHandlers() {
        document.querySelectorAll('.inventory-equip-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const rodId = button.dataset.rodId;
                if (rodId) {
                    hytopia.sendData({
                        type: 'equipItem',
                        itemId: rodId
                    });
                    
                    // Update UI immediately for better responsiveness
                    document.querySelectorAll('.inventory-equip-button').forEach(btn => {
                        btn.textContent = 'Equip';
                        const rodItem = btn.closest('.inventory-rod-item');
                        if (rodItem) {
                            rodItem.classList.remove('equipped');
                        }
                    });
                    
                    button.textContent = 'Equipped';
                    const rodItem = button.closest('.inventory-rod-item');
                    if (rodItem) {
                        rodItem.classList.add('equipped');
                    }
                    
                    this.currentRod = rodId;
                    this.lastEquippedRod = rodId;
                    
                    // Update toolbar display
                    const rodName = rodItem.querySelector('.inventory-rod-name').textContent;
                    const equippedRodName = document.getElementById('rod-status');
                    if (equippedRodName) {
                        equippedRodName.textContent = `🎣 ${rodName}`;
                    }
                }
            });
        });
    }

    setupBaitClickHandlers() {
        document.querySelectorAll('.inventory-select-bait-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const baitId = button.dataset.baitId;
                if (baitId) {
                    hytopia.sendData({
                        type: 'equipItem',
                        itemId: baitId
                    });
                    
                    // Update UI immediately for better responsiveness
                    document.querySelectorAll('.inventory-select-bait-button').forEach(btn => {
                        btn.textContent = 'Equip';
                        const baitItem = btn.closest('.inventory-bait-item');
                        if (baitItem) {
                            baitItem.classList.remove('selected');
                        }
                    });
                    
                    button.textContent = 'Equipped';
                    const baitItem = button.closest('.inventory-bait-item');
                    if (baitItem) {
                        baitItem.classList.add('selected');
                    }
                    
                    this.selectedBait = { id: baitId };
                }
            });
        });
    }

    setupItemClickHandlers() {
        document.querySelectorAll('.inventory-use-item-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const itemId = button.dataset.itemId;
                if (itemId) {
                    hytopia.sendData({
                        type: 'useItem',
                        itemId: itemId
                    });
                }
            });
        });
    }

    setupFishClickHandlers() {
        document.querySelectorAll('.inventory-equip-fish-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const fishId = button.dataset.fishId;
                if (fishId) {
                    hytopia.sendData({
                        type: 'equipItem',
                        itemId: fishId
                    });
                    
                    // Update UI immediately for better responsiveness
                    document.querySelectorAll('.inventory-equip-fish-button').forEach(btn => {
                        btn.textContent = 'Equip';
                        const fishCard = btn.closest('.inventory-fish-card');
                        if (fishCard) {
                            fishCard.classList.remove('equipped');
                        }
                    });
                    
                    button.textContent = 'Equipped';
                    const fishCard = button.closest('.inventory-fish-card');
                    if (fishCard) {
                        fishCard.classList.add('equipped');
                    }
                    
                    this.currentFish = fishId;
                    this.lastEquippedFish = fishId;
                }
            });
        });
    }

    openInventoryToTab(tabName) {
        if (!this.equipmentMenuOpen) {
            this.toggleEquipmentMenu(true);
        }
        this.showTab(tabName);
    }

    activateToolbarSlot(slotNum) {
        if (slotNum === 1) {
            this.toggleEquipmentMenu();
        }
    }

    toggleBaitQuickSelect(force) {
    }

    populateBaitQuickSelect() {
    }

    setupBaitQuickSelectHotkeys() {
    }

    equipBait(baitId) {
        hytopia.sendData({
            type: 'equipItem',
            itemId: baitId
        });
        
        // Update UI immediately for better responsiveness
        if (this.cachedBaitItems) {
            const baitItem = this.cachedBaitItems.find(bait => bait.id === baitId);
            if (baitItem) {
                // Update toolbar display
                const baitNameElement = document.getElementById('bait-status');
                if (baitNameElement) {
                    baitNameElement.textContent = `🪱 ${baitItem.name}${baitItem.quantity > 1 ? ` (${baitItem.quantity})` : ''}`;
                    
                    // Update cached items equipped status
                    this.cachedBaitItems.forEach(bait => {
                        bait.equipped = bait.id === baitId;
                    });
                }
            }
        }
    }

    updateToolbarDisplay(inventory) {
        // Update rod display in status line
        const equippedRod = inventory.items.find(item => item.type === 'rod' && item.equipped);
        const rodStatus = document.getElementById('rod-status');
        if (rodStatus) {
            rodStatus.textContent = equippedRod ? `🎣 ${equippedRod.name}` : '🎣 No Rod';
        }
        
        // Update bait display in status line
        const equippedBait = inventory.items.find(item => item.type === 'bait' && item.equipped);
        const baitStatus = document.getElementById('bait-status');
        if (baitStatus) {
            baitStatus.textContent = equippedBait ? 
                `🪱 ${equippedBait.name}${equippedBait.quantity > 1 ? ` (${equippedBait.quantity})` : ''}` : 
                '🪱 No Bait';
        }
    }


    showBaitHotkeyNotification(key) {
        const baitItem = this.cachedBaitItems?.find(bait => bait.id === this.hotkeyBaits[key]);
        if (!baitItem) return;
        
        // Create or get notification element
        let notification = document.getElementById('bait-hotkey-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'bait-hotkey-notification';
            document.body.appendChild(notification);
        }
        
        // Set content and show
        notification.innerHTML = `
            <div class="hotkey-icon">${key}</div>
            <div class="hotkey-bait-name ${baitItem.rarity}">${baitItem.name}</div>
            <div class="hotkey-equipped">Equipped</div>
        `;
        
        // Show and animate
        notification.style.display = 'flex';
        notification.style.animation = 'none';
        void notification.offsetWidth; // Trigger reflow
        notification.style.animation = 'fadeInOut 2s forwards';
        
        // Hide after animation
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }

    assignBaitToHotkey(baitId, hotkey) {
        this.hotkeyBaits[hotkey] = baitId;
        
        // Save to localStorage for persistence
        try {
            localStorage.setItem('baitHotkeys', JSON.stringify(this.hotkeyBaits));
        } catch (e) {
            console.error('Failed to save bait hotkeys to localStorage', e);
        }
        
        // Update UI to reflect the assignment
        this.updateBaitHotkeyIndicators();
    }

    loadBaitHotkeys() {
        try {
            const savedHotkeys = localStorage.getItem('baitHotkeys');
            if (savedHotkeys) {
                this.hotkeyBaits = JSON.parse(savedHotkeys);
            }
        } catch (e) {
            console.error('Failed to load bait hotkeys from localStorage', e);
        }
    }

    updateBaitHotkeyIndicators() {
        // This could be implemented later to show which baits are assigned to hotkeys
        // in the main toolbar, if desired
    }

    getAssetBaseUrl() {
        // Check if we're in a Hytopia environment with CDN_ASSETS_URL available in the global scope
        if (typeof window.CDN_ASSETS_URL !== 'undefined' && window.CDN_ASSETS_URL) {
            console.log('Using global CDN_ASSETS_URL:', window.CDN_ASSETS_URL);
            return window.CDN_ASSETS_URL;
        }
        
        // For local development or when CDN_ASSETS_URL isn't available as a global
        // Try to extract it from a script tag's src attribute
        const scriptTags = document.getElementsByTagName('script');
        for (let i = 0; i < scriptTags.length; i++) {
            const src = scriptTags[i].src;
            if (src && src.includes('/ui/panels/')) {
                // Extract the base URL up to /ui/panels/
                const baseUrl = src.substring(0, src.indexOf('/ui/panels/'));
                console.log('Extracted base URL from script tag:', baseUrl);
                return baseUrl;
            }
        }
        
        // If we can't determine it from script tags, use the current origin
        console.log('Using current origin as fallback:', window.location.origin);
        return window.location.origin;
    }

    clearHotbarSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.baitHotbar.length) return;
        
        // Clear the slot in the data structure
        this.baitHotbar[slotIndex] = null;
        
        // Update the slot display
        const slot = document.querySelector(`.bait-hotbar-slot[data-hotbar-slot="${slotIndex}"]`);
        if (slot) {
            // Clear existing content except the slot number
            const slotNumber = slot.querySelector('.hotbar-slot-number');
            if (slotNumber) {
                slot.innerHTML = '';
                slot.appendChild(slotNumber);
            } else {
                // If slot number is missing, recreate it
                slot.innerHTML = '';
                const newSlotNumber = document.createElement('span');
                newSlotNumber.className = 'hotbar-slot-number';
                newSlotNumber.textContent = slotIndex + 1;
                slot.appendChild(newSlotNumber);
            }
        }
        
        // Save hotbar configuration
        this.saveHotbar();
        
        // Update the game hotbar if needed
        this.updateGameHotbar();
    }

    updateGameHotbar() {
        // This method would update any game state that needs to know about the hotbar
        // For now, it's just a placeholder
        console.log('Updating game hotbar with:', this.baitHotbar);
    }

    // Add a method to show notifications
    showNotification(message) {
        // Check if notification element exists, create if not
        let notification = document.getElementById('bait-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'bait-notification';
            notification.className = 'bait-notification';
            document.body.appendChild(notification);
            
            // Add notification styles if not already added
            if (!document.getElementById('notification-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-styles';
                style.textContent = `
                    .bait-notification {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background-color: rgba(22, 28, 36, 0.95);
                        border-left: 4px solid #e74c3c;
                        color: white;
                        padding: 12px 20px;
                        border-radius: 4px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                        z-index: 3000;
                        font-size: 14px;
                        max-width: 300px;
                        opacity: 0;
                        transform: translateY(-20px);
                        transition: opacity 0.3s, transform 0.3s;
                    }
                    
                    .bait-notification.show {
                        opacity: 1;
                        transform: translateY(0);
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Set message and show notification
        notification.textContent = message;
        notification.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    showBaitTooltip(bait, event) {
        console.log('[INVENTORY] Showing tooltip for bait:', bait);
        console.log('[INVENTORY] Bait metadata:', bait.metadata);
        console.log('[INVENTORY] Bait stats:', bait.metadata?.baitStats);
        console.log('[INVENTORY] Bait description:', bait.metadata?.baitStats?.description);
        
        // Get or create tooltip element
        let tooltip = document.getElementById('bait-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'bait-tooltip';
            tooltip.className = 'bait-tooltip';
            document.body.appendChild(tooltip);
        }
        
        // Get target species text
        let targetSpeciesText = 'None';
        if (bait.metadata && bait.metadata.baitStats && bait.metadata.baitStats.targetSpecies) {
            const targetSpecies = bait.metadata.baitStats.targetSpecies;
            if (Array.isArray(targetSpecies) && targetSpecies.length > 0) {
                targetSpeciesText = targetSpecies.join(', ');
            } else if (typeof targetSpecies === 'string') {
                targetSpeciesText = targetSpecies;
            }
        }
        
        // Get bait class
        const baitClass = bait.metadata?.baitStats?.class || 'Unknown';
        const baitResilliance = bait.metadata?.baitStats?.resilliance || 0;
        const baitStrength = bait.metadata?.baitStats?.strength || 0;
        
        let boostValue = 0;
        let boostType = '';

        // Check if bait has target species first
        if (bait.metadata?.baitStats?.targetSpecies && 
            Array.isArray(bait.metadata.baitStats.targetSpecies) && 
            bait.metadata.baitStats.targetSpecies.length > 0) {
            // For specialized bait, use the average of species boosts or the highest value
            if (bait.metadata?.baitStats?.speciesLuck) {
                // Get all boost values from the speciesLuck object
                const boostValues = Object.values(bait.metadata.baitStats.speciesLuck);
                if (boostValues.length > 0) {
                    // Use the highest boost value for display
                    boostValue = Math.max(...boostValues);
                } else {
                    boostValue = 1; // Default if no values
                }
            } else {
                boostValue = 1;
            }
            boostType = 'species';
        } else {
            // Default to baseLuck
            boostValue = bait.metadata?.baitStats?.baseLuck || 1;
            boostType = 'base';
        }

        // Format boost as percentage (e.g., 1.35 → 35%)
        const boostPercentage = Math.round((boostValue - 1) * 100);
        const boostDisplay = boostPercentage > 0 ? `+${boostPercentage}%` : `${boostPercentage}%`;
        const resilliancePercentage = Math.round((baitResilliance - 1) * 100);
        const resillianceDisplay = resilliancePercentage > 0 ? `+${resilliancePercentage}%` : `${resilliancePercentage}%`;
        const strengthPercentage = Math.round((baitStrength - 1) * 100);
        const strengthDisplay = strengthPercentage > 0 ? `+${strengthPercentage}%` : `${strengthPercentage}%`;
        
        // Set tooltip content
        tooltip.innerHTML = `
            <div class="tooltip-title ${bait.rarity}">${bait.name}</div>
            <div class="tooltip-stat"><span class="tooltip-stat-label">Luck Boost:</span> ${boostDisplay}</div>
            <div class="tooltip-stat"><span class="tooltip-stat-label">Resilliance Boost:</span> ${resillianceDisplay}</div>
            <div class="tooltip-stat"><span class="tooltip-stat-label">Strength Boost:</span> ${strengthDisplay}</div>
            <div class="tooltip-stat"><span class="tooltip-stat-label">Target Species:</span> ${targetSpeciesText}</div>
            <div class="tooltip-description">${bait.metadata?.baitStats?.description || 'No description available.'}</div>
        `;
        
        // Position tooltip near the mouse
        const padding = 15; // Padding from cursor
        tooltip.style.left = `${event.clientX + padding}px`;
        tooltip.style.top = `${event.clientY + padding}px`;
        
        // Ensure tooltip stays within viewport
        const rect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (rect.right > viewportWidth) {
            tooltip.style.left = `${event.clientX - rect.width - padding}px`;
        }
        
        if (rect.bottom > viewportHeight) {
            tooltip.style.top = `${event.clientY - rect.height - padding}px`;
        }
        
        // Show tooltip
        tooltip.style.display = 'block';
    }

    showItemTooltip(item, event) {
        const tooltip = document.getElementById('bait-tooltip');
        if (!tooltip) return;
        
        console.log('Showing tooltip for item:', item);
        
        // Default values for missing properties
        const itemName = item.name || 'Unknown Item';
        const itemRarity = item.rarity || 'common';
        const itemDescription = item.description || 'No description available.';
        
        // Format the rarity text with proper capitalization
        const formattedRarity = itemRarity.charAt(0).toUpperCase() + itemRarity.slice(1);
        
        tooltip.innerHTML = `
            <div class="tooltip-title ${itemRarity}">${itemName}</div>
            <div class="tooltip-rarity ${itemRarity}">Rarity: ${formattedRarity}</div>
            <div class="tooltip-description">${itemDescription}</div>
        `;
        
        tooltip.style.display = 'block';
        
        // Position the tooltip near the cursor
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        
        // Adjust position to keep tooltip within viewport
        let left = event.clientX + 10;
        let top = event.clientY + 10;
        
        // Check right edge
        if (left + tooltipWidth > window.innerWidth) {
            left = event.clientX - tooltipWidth - 10;
        }
        
        // Check bottom edge
        if (top + tooltipHeight > window.innerHeight) {
            top = event.clientY - tooltipHeight - 10;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    dropItem(itemId) {
        console.log(`Dropping item: ${itemId}`);
        hytopia.sendData({
            type: 'dropItem',
            itemId: itemId
        });
    }

    addItemsStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Items tab layout similar to bait tab */
            .items-content {
                display: flex;
                flex-direction: column;
                gap: 20px;
                padding: 10px;
            }
            
            /* Inventory section */
            .items-inventory-section {
                background: rgba(10, 22, 34, 0.5);
                border-radius: 8px;
                padding: 15px;
            }
            
            .items-inventory-section h3 {
                color: #4a90e2;
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 18px;
                border-bottom: 1px solid #4a90e2;
                padding-bottom: 5px;
            }
            
            .items-inventory-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 10px;
                max-height: 250px;
                overflow-y: auto;
                padding-right: 5px;
            }
            
            .drop-item-button {
                background-color: #e74c3c;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 3px 8px;
                font-size: 10px;
                margin-top: 10px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .drop-item-button:hover {
                background-color: #c0392b;
            }

            /* Tooltip rarity styles */
            .tooltip-rarity {
                font-size: 14px;
                margin-bottom: 8px;
                font-weight: bold;
            }

            /* Rarity colors */
            .tooltip-rarity.common {
                color: #9d9d9d;
            }

            .tooltip-rarity.uncommon {
                color: #1eff00;
            }

            .tooltip-rarity.rare {
                color: #0070dd;
            }

            .tooltip-rarity.epic {
                color: #a335ee;
            }

            .tooltip-rarity.legendary {
                color: #ff8000;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Make it globally available
window.InventoryPanel = new InventoryPanel();
console.log('InventoryPanel global object created'); 