class CraftingPanel {
    constructor() {
        this.container = null;
        this.craftingOpen = false;
        this.craftingSlots = [null, null, null, null]; // 4 input slots
        this.resultSlot = null;
        this.recipes = []; // Start with empty recipes, will be populated from server
        this.styleElement = null;
    }

    initialize(containerId) {
        this.container = document.getElementById(containerId);
        
        // Create panel HTML
        const panel = document.createElement('div');
        panel.id = 'crafting-ui';
        panel.innerHTML = `
            <div id="crafting-overlay">
                <div class="crafting-container">
                    <div class="crafting-header">
                        <h2>Crafting Station</h2>
                        <div class="close-button" id="crafting-close-button">×</div>
                    </div>
                    <div class="crafting-content">
                        <div class="crafting-grid">
                            <div class="crafting-inputs">
                                <div class="crafting-slot" data-slot="0"></div>
                                <div class="crafting-slot" data-slot="1"></div>
                                <div class="crafting-slot" data-slot="2"></div>
                                <div class="crafting-slot" data-slot="3"></div>
                            </div>
                            <div class="crafting-arrow">→</div>
                            <div class="crafting-result">
                                <div class="result-slot"></div>
                            </div>
                        </div>
                        <div class="crafting-inventory">
                            <h3>Inventory</h3>
                            <div class="inventory-grid" id="crafting-inventory-grid"></div>
                        </div>
                        <button id="craft-button" disabled>Craft</button>
                    </div>
                </div>
            </div>
        `;
        
        this.container.appendChild(panel);

        // Add CSS for the crafting panel
        const style = document.createElement('style');
        style.textContent = `
            #crafting-overlay {
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
            
            .crafting-container {
                width: 700px;
                background-color: #1a2633;
                border: 2px solid #4a90e2;
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .crafting-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: #0a1622;
                border-bottom: 1px solid #4a90e2;
            }
            
            .crafting-header h2 {
                margin: 0;
                color: #ffffff;
                font-size: 22px;
            }
            
            .crafting-content {
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .crafting-grid {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                padding: 20px;
                background: rgba(10, 22, 34, 0.5);
                border-radius: 8px;
            }
            
            .crafting-inputs {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(2, 1fr);
                gap: 10px;
            }
            
            .crafting-slot, .result-slot {
                width: 70px;
                height: 70px;
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid #4a90e2;
                border-radius: 6px;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .crafting-slot:hover {
                background: rgba(74, 144, 226, 0.1);
            }
            
            .crafting-slot.filled {
                background: rgba(74, 144, 226, 0.2);
            }
            
            .crafting-arrow {
                font-size: 32px;
                color: #4a90e2;
                margin: 0 10px;
            }
            
            .result-slot {
                width: 80px;
                height: 80px;
                background: rgba(0, 0, 0, 0.5);
                border-color: #ffeb3b;
            }
            
            .crafting-inventory {
                background: rgba(10, 22, 34, 0.5);
                border-radius: 8px;
                padding: 15px;
            }
            
            .crafting-inventory h3 {
                color: #4a90e2;
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 18px;
                border-bottom: 1px solid #4a90e2;
                padding-bottom: 5px;
            }
            
            .inventory-grid {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 10px;
                max-height: 250px;
                overflow-y: auto;
                padding-right: 5px;
            }
            
            .inventory-item {
                width: 60px;
                height: 60px;
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
            
            .inventory-item:hover {
                background: rgba(74, 144, 226, 0.1);
                transform: translateY(-2px);
            }
            
            .inventory-item .item-name {
                font-size: 10px;
                color: white;
                text-align: center;
                margin-top: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
            }
            
            .inventory-item .item-icon {
                width: 32px;
                height: 32px;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            }
            
            .inventory-item .item-quantity {
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
                width: 80%;
                height: 80%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .item-in-slot .item-icon {
                width: 32px;
                height: 32px;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            }
            
            .item-in-slot .item-name {
                font-size: 9px;
                color: white;
                text-align: center;
                margin-top: 3px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
            }
            
            #craft-button {
                background-color: #4a90e2;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                transition: background-color 0.2s;
                align-self: center;
            }
            
            #craft-button:hover:not(:disabled) {
                background-color: #3a7bc8;
            }
            
            #craft-button:disabled {
                background-color: #2a3b4d;
                cursor: not-allowed;
            }
            
            .common { color: #ffffff; }
            .uncommon { color: #4caf50; }
            .rare { color: #2196f3; }
            .epic { color: #9c27b0; }
            .legendary { color: #ff9800; }
            
            /* Animation for crafting */
            @keyframes craftingGlow {
                0% { box-shadow: 0 0 5px #4a90e2; }
                50% { box-shadow: 0 0 20px #4a90e2; }
                100% { box-shadow: 0 0 5px #4a90e2; }
            }
            
            .crafting-animation {
                animation: craftingGlow 1.5s infinite;
            }
            
            .crafting-message {
                position: absolute;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                padding: 12px 20px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 100;
                animation: message-slide-in 0.3s ease-out;
            }
            
            .crafting-message.success {
                background-color: rgba(46, 125, 50, 0.9);
                border: 1px solid #4CAF50;
            }
            
            .crafting-message.error {
                background-color: rgba(183, 28, 28, 0.9);
                border: 1px solid #F44336;
            }
            
            .message-icon {
                font-size: 24px;
                font-weight: bold;
            }
            
            .message-text {
                font-size: 16px;
                font-weight: 500;
                color: white;
            }
            
            .crafting-message.fade-out {
                opacity: 0;
                transition: opacity 0.5s ease-out;
            }
            
            @keyframes message-slide-in {
                from {
                    transform: translateX(-50%) translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
        `;
        
        document.head.appendChild(style);

        // Set up event listeners
        this.setupEventListeners();
        
        // Hide crafting menu initially
        document.getElementById('crafting-overlay').style.display = 'none';

        // Set up message handling
        hytopia.onData((data) => {
            if (data.type === 'inventoryUpdate') {
                this.updateInventoryGrid(data.inventory);
            } else if (data.type === 'craftingResult') {
                this.handleCraftingResult(data.success, data.result);
            } else if (data.type === 'craftingRecipes') {
                // New handler for receiving recipes from server
                this.recipes = data.recipes;
                console.log('Received crafting recipes from server:', this.recipes.length);
            } else if (data.type === 'openCrafting') {
                this.toggleCraftingMenu(true);
            }
        });

        // Add keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.craftingOpen) {
                this.toggleCraftingMenu(false);
            }
        });

        // Apply dynamic icon styles
        this.applyIconStyles();
    }

    setupEventListeners() {
        // Close button
        document.getElementById('crafting-close-button').addEventListener('click', () => {
            this.toggleCraftingMenu(false);
        });

        // Crafting slots
        document.querySelectorAll('.crafting-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const slotIndex = parseInt(e.currentTarget.dataset.slot);
                if (this.craftingSlots[slotIndex]) {
                    // Remove item from slot
                    this.removeItemFromSlot(slotIndex);
                }
            });
        });

        // Craft button
        document.getElementById('craft-button').addEventListener('click', () => {
            this.attemptCrafting();
        });
    }

    toggleCraftingMenu(force) {
        const overlay = document.getElementById('crafting-overlay');
        this.craftingOpen = force !== undefined ? force : !this.craftingOpen;
        
        if (this.craftingOpen) {
            overlay.style.display = 'flex';
            hytopia.sendData({ type: 'disablePlayerInput' });
            this.addHideChatStyle();
            
            // Request inventory data and recipes
            hytopia.sendData({ type: 'requestInventory' });
            hytopia.sendData({ type: 'requestCraftingRecipes' });
        } else {
            overlay.style.display = 'none';
            hytopia.sendData({ type: 'enablePlayerInput' });
            this.removeHideChatStyle();
            
            // Clear crafting slots when closing
            this.clearCraftingSlots();
        }
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

    updateInventoryGrid(inventory) {
        console.log("=== INVENTORY UPDATE ===");
        console.log("Full inventory:", JSON.stringify(inventory, null, 2));
        
        const baseUrl = this.getAssetBaseUrl();
        const grid = document.getElementById('crafting-inventory-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Filter for craftable items (bait, fish that can be used as bait, and materials)
        const craftableItems = inventory.items.filter(item => 
            ['bait', 'item'].includes(item.type) || 
            (item.type === 'fish' && item.metadata?.fishStats?.isBaitFish === true)
        );
        
        // Test image loading for the first bait item we find
        for (let i = 0; i < craftableItems.length; i++) {
            const item = craftableItems[i];
            if (item.type === 'bait') {
                this.testImageLoading(item.id, item.type);
            }
        }
        
        craftableItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.dataset.itemId = item.id;
            itemElement.dataset.itemType = item.type;
            
            // Get sprite path based on item type and ID
            let spritePath = '';
            if (item.type === 'bait' || item.type === 'item') {
                console.log("Loading bait/item:", item.sprite);
                if (item.sprite) {
                    // Use the sprite property directly
                    spritePath = `${baseUrl}/ui/icons/${item.sprite}`;
                    console.log("Sprite path:", spritePath);
                }
            } else if (item.type === 'fish') {
                spritePath = `${baseUrl}/ui/icons/${item.sprite}`;
            } else if (item.type === 'material') {
                spritePath = `${baseUrl}/ui/icons/${item.sprite}`;
            }
            
            // Use sprite if available, otherwise use colored background with fallback
            const iconStyle = spritePath ? 
                `background-image: url('${spritePath}');` : 
                `background-color: ${this.getColorForRarity(item.rarity)};`;
            
            itemElement.innerHTML = `
                <div class="item-icon" style="${iconStyle}"></div>
                <div class="item-name ${item.rarity}">${item.name}</div>
                <div class="item-quantity">x${item.quantity}</div>
            `;
            
            // Add drag functionality
            this.addDragFunctionality(itemElement, item);
            
            grid.appendChild(itemElement);
        });
        
        if (craftableItems.length === 0) {
            grid.innerHTML = '<div class="empty-message">No craftable items in inventory</div>';
        }
    }
    
    addDragFunctionality(element, item) {
        element.draggable = true;
        
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(item));
            e.dataTransfer.effectAllowed = 'copy';
        });
        
        // Also add click to select functionality
        element.addEventListener('click', () => {
            // Find first empty slot
            const emptySlotIndex = this.craftingSlots.findIndex(slot => slot === null);
            if (emptySlotIndex !== -1) {
                this.addItemToSlot(emptySlotIndex, item);
            }
        });
        
        // Make crafting slots droppable
        document.querySelectorAll('.crafting-slot').forEach(slot => {
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
                
                const itemData = JSON.parse(e.dataTransfer.getData('text/plain'));
                const slotIndex = parseInt(slot.dataset.slot);
                
                this.addItemToSlot(slotIndex, itemData);
            });
        });
    }
    
    addItemToSlot(slotIndex, item) {
        console.log("Adding item to slot:", item);
        if (slotIndex < 0 || slotIndex >= this.craftingSlots.length) return;
        
        // Check if we have enough of this item
        const existingCount = this.craftingSlots.filter(
            slot => slot && slot.id === item.id
        ).length;
        
        if (existingCount >= item.quantity) {
            // Not enough of this item
            return;
        }
        
        this.craftingSlots[slotIndex] = item;
        
        // Get sprite path based on item type and ID
        const baseUrl = this.getAssetBaseUrl();
        let spritePath = '';
        
        // Use the same logic as in updateInventoryGrid
        if (item.type === 'bait' || item.type === 'item') {
            console.log("Loading bait/item:", item.sprite);
            if (item.sprite) {
                // Use the sprite property directly
                spritePath = `${baseUrl}/ui/icons/${item.sprite}`;
            }
        } else if (item.type === 'fish') {
            spritePath = `${baseUrl}/ui/icons/${item.sprite}`;
        } else if (item.type === 'material') {
            spritePath = `${baseUrl}/ui/icons/${item.sprite}`;
        }
        
        // Log the path we're using
        console.log(`Using sprite path for ${item.id} (${item.type}): ${spritePath}`);
        
        // Use sprite if available, otherwise use colored background
        const iconStyle = spritePath ? 
            `background-image: url('${spritePath}');` : 
            `background-color: ${this.getColorForRarity(item.rarity)};`;
        
        // Update the UI
        const slotElement = document.querySelector(`.crafting-slot[data-slot="${slotIndex}"]`);
        slotElement.innerHTML = `
            <div class="item-in-slot">
                <div class="item-icon" style="${iconStyle}"></div>
                <div class="item-name ${item.rarity}">${item.name}</div>
            </div>
        `;
        slotElement.classList.add('filled');
        
        // Check if we can craft something
        this.checkRecipes();
    }
    
    removeItemFromSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.craftingSlots.length) return;
        
        this.craftingSlots[slotIndex] = null;
        
        // Update the UI
        const slotElement = document.querySelector(`.crafting-slot[data-slot="${slotIndex}"]`);
        slotElement.innerHTML = '';
        slotElement.classList.remove('filled');
        
        // Clear result slot
        this.clearResultSlot();
        
        // Disable craft button
        document.getElementById('craft-button').disabled = true;
    }
    
    clearCraftingSlots() {
        this.craftingSlots = [null, null, null, null];
        
        // Update UI
        document.querySelectorAll('.crafting-slot').forEach(slot => {
            slot.innerHTML = '';
            slot.classList.remove('filled');
        });
        
        this.clearResultSlot();
        document.getElementById('craft-button').disabled = true;
    }
    
    clearResultSlot() {
        this.resultSlot = null;
        const resultElement = document.querySelector('.result-slot');
        resultElement.innerHTML = '';
        resultElement.classList.remove('filled');
    }
    
    checkRecipes() {
        console.log("=== CHECKING RECIPES ===");
        console.log("Crafting slots:", JSON.stringify(this.craftingSlots, null, 2));
        console.log("Available recipes:", JSON.stringify(this.recipes, null, 2));
        
        // Detailed logging of each slot item
        this.craftingSlots.forEach((slot, index) => {
            if (slot) {
                console.log(`Slot ${index} item:`, {
                    id: slot.id,
                    name: slot.name,
                    type: slot.type,
                    rarity: slot.rarity,
                    metadata: slot.metadata
                });
            }
        });
        
        // Get the items in slots
        const slotItems = this.craftingSlots.filter(slot => slot !== null);
        
        // Check if we match any recipe
        for (const recipe of this.recipes) {
            if (slotItems.length !== recipe.inputs.length) continue;
            
            console.log("Checking recipe:", recipe.inputs);
            
            const recipeInputs = [...recipe.inputs]; // Clone the recipe inputs
            let match = true;
            
            // Check if all slots match recipe requirements
            for (const slotItem of slotItems) {
                // Extract the base item type from the ID
                const baseItemId = this.getBaseItemId(slotItem.id);
                console.log(`Item ${slotItem.id} has base ID: ${baseItemId}`);
                
                // Check if this is a direct match with the base ID or name
                const inputIndex = recipeInputs.findIndex(input => 
                    input === baseItemId || 
                    input.toLowerCase() === slotItem.name.toLowerCase()
                );
                
                if (inputIndex !== -1) {
                    // Direct match found, remove this input from the recipe
                    recipeInputs.splice(inputIndex, 1);
                    console.log(`Found match for ${baseItemId}`);
                } else {
                    match = false;
                    console.log(`No match found for ${baseItemId}`);
                    break;
                }
            }
            
            if (match && recipeInputs.length === 0) {
                // We have a match!
                console.log("Recipe match found! Showing result:", recipe.output);
                this.showCraftingResult(recipe.output);
                return;
            }
        }
        
        // No match found
        console.log("No matching recipe found");
        this.clearResultSlot();
        document.getElementById('craft-button').disabled = true;
    }
    
    showCraftingResult(item) {
        console.log("Showing crafting result:", item);
        console.log("Item sprite:", item.sprite);
        
        // If it's a bait item but missing sprite, try to derive it from the ID
        if (item.type === 'bait' && !item.sprite) {
            // Extract the bait name from the ID (e.g., "bait_bug_roll" -> "bug_roll")
            const baitName = item.id.replace('bait_', '');
            item.sprite = `${baitName}.png`;
            console.log("Added derived sprite:", item.sprite);
        }
        
        this.resultSlot = item;
        
        // Get sprite path based on result type and ID
        const baseUrl = this.getAssetBaseUrl();
        let spritePath = '';
        
        // Use the same logic as in other methods
        if (item.type === 'bait' || item.type === 'item') {
            if (item.sprite) {
                // Use the sprite property directly
                spritePath = `${baseUrl}/ui/icons/${item.sprite}`;
                console.log("Sprite path:", spritePath);
            }
        } else if (item.type === 'fish') {
            spritePath = `${baseUrl}/ui/icons/${item.sprite}`;
        } else if (item.type === 'material') {
            spritePath = `${baseUrl}/ui/icons/${item.sprite}`;
        } else if (item.type === 'rod') {
            spritePath = `${baseUrl}/ui/icons/${item.sprite}`;
        }
        
        // Log the path we're using
        console.log(`Using sprite path for result ${item.id} (${item.type}): ${spritePath}`);
        
        // Use sprite if available, otherwise use colored background
        const iconStyle = spritePath ? 
            `background-image: url('${spritePath}');` : 
            `background-color: ${this.getColorForRarity(item.rarity)};`;
        
        const resultElement = document.querySelector('.result-slot');
        resultElement.innerHTML = `
            <div class="item-in-slot">
                <div class="item-icon" style="${iconStyle}"></div>
                <div class="item-name ${item.rarity}">${item.name}</div>
                <div class="item-quantity">x${item.quantity || 1}</div>
            </div>
        `;
        resultElement.classList.add('filled');
        
        // Enable craft button
        document.getElementById('craft-button').disabled = false;
    }
    
    attemptCrafting() {
        if (!this.resultSlot) {
            console.log("No result slot item, can't craft");
            return;
        }
        
        console.log("=== ATTEMPTING CRAFT ===");
        console.log("Result slot:", JSON.stringify(this.resultSlot, null, 2));
        
        // Detailed logging of each slot item
        this.craftingSlots.forEach((slot, index) => {
            if (slot) {
                console.log(`Slot ${index} item:`, {
                    id: slot.id,
                    name: slot.name,
                    type: slot.type,
                    rarity: slot.rarity,
                    metadata: slot.metadata
                });
            }
        });
        
        // Get base IDs for crafting
        const inputIds = this.craftingSlots.map(slot => 
            slot ? slot.id : null
        );
        
        // Animate the crafting process
        const craftingSlots = document.querySelectorAll('.crafting-slot.filled');
        craftingSlots.forEach(slot => {
            slot.classList.add('crafting-animation');
        });
        
        // Send crafting request to server
        hytopia.sendData({
            type: 'craftItem',
            inputs: inputIds,
            output: this.resultSlot.id
        });
        
        // Simulate crafting delay
        setTimeout(() => {
            // Remove animation
            craftingSlots.forEach(slot => {
                slot.classList.remove('crafting-animation');
            });
            
            // Clear slots after crafting
            this.clearCraftingSlots();
            
            // Request updated inventory
            hytopia.sendData({ type: 'requestInventory' });
            
        }, 1500);
        hytopia.sendData({ type: 'disablePlayerInput' });
    }
    
    handleCraftingResult(success, result) {
        if (success) {
            // Show success message
            const message = document.createElement('div');
            message.className = 'crafting-message success';
            message.innerHTML = `
                <div class="message-icon">✓</div>
                <div class="message-text">Successfully crafted ${result.name}!</div>
            `;
            document.querySelector('.crafting-content').prepend(message);
            
            setTimeout(() => {
                message.classList.add('fade-out');
                setTimeout(() => {
                    message.remove();
                }, 500);
            }, 2500);
        } else {
            // Show error message
            const message = document.createElement('div');
            message.className = 'crafting-message error';
            message.innerHTML = `
                <div class="message-icon">✗</div>
                <div class="message-text">Crafting failed. Please try again.</div>
            `;
            document.querySelector('.crafting-content').prepend(message);
            
            setTimeout(() => {
                message.classList.add('fade-out');
                setTimeout(() => {
                    message.remove();
                }, 500);
            }, 2500);
        }
    }
    
    getColorForRarity(rarity) {
        const rarityColors = {
            common: '#aaaaaa',
            uncommon: '#4caf50',
            rare: '#2196f3',
            epic: '#9c27b0',
            legendary: '#ff9800'
        };
        
        return rarityColors[rarity] || '#aaaaaa';
    }

    // Add a debug method to test image loading
    testImageLoading(itemId, itemType) {
        const baseUrl = this.getAssetBaseUrl();
        
        // Test different path variations
        const paths = [
            `${baseUrl}/ui/icons/${itemType}/${itemId}.png`,
            `${baseUrl}/ui/icons/${itemType}_sprite.png`,
            `${baseUrl}/ui/icons/${itemId}.png`,
            `${baseUrl}/ui/icons/${itemType}s/${itemId}.png`,
            `${baseUrl}/ui/icons/worm_sprite.png`  // Direct test for worm sprite
        ];
        
        console.log(`Testing image loading for ${itemId} (${itemType}):`);
        
        paths.forEach((path, index) => {
            const testImg = new Image();
            testImg.onload = () => console.log(`✅ Path ${index+1} loaded successfully: ${path}`);
            testImg.onerror = () => console.log(`❌ Path ${index+1} failed to load: ${path}`);
            testImg.src = path;
        });
    }

    // Add a method to apply dynamic icon styles
    applyIconStyles() {
        console.log('Setting up crafting panel icon styles with dynamic paths');
        
        setTimeout(() => {
            const baseUrl = this.getAssetBaseUrl();
            console.log('Using base URL for crafting panel icons:', baseUrl);
            
            // Apply to all crafting-related icons
            const craftingIcons = document.querySelectorAll('.crafting-icon, .recipe-icon, .material-icon');
            craftingIcons.forEach(icon => {
                // Get the icon type from a data attribute or class name
                let iconType = '';
                if (icon.classList.contains('crafting-icon')) iconType = 'crafting';
                else if (icon.classList.contains('recipe-icon')) iconType = 'recipe';
                else if (icon.classList.contains('material-icon')) iconType = 'material';
                
                // Only proceed if we have an icon type
                if (!iconType) return;
                
                // Get the specific icon name from data attribute if available
                const iconName = icon.dataset.icon || `${iconType}_default`;
                
                // Set the background image
                icon.style.backgroundImage = `url('${baseUrl}/ui/icons/${iconName}.png')`;
                icon.style.backgroundSize = 'contain';
                icon.style.backgroundRepeat = 'no-repeat';
                icon.style.backgroundPosition = 'center';
            });
            
            console.log('Applied dynamic background images to crafting panel icons');
        }, 100); // Small delay to ensure elements are in the DOM
    }

    getBaseItemId(itemId) {
        if (!itemId) return null;
        
        // Convert to lowercase
        let normalized = itemId.toLowerCase();
        
        // Handle bait items with specific types
        if (normalized.startsWith('bait_')) {
            // Extract the actual bait type instead of just returning "bait"
            normalized = normalized.substring(5); // e.g., 'bait_raw_shrimp' -> 'raw_shrimp'
            console.log(`Item ${itemId} has base ID: ${normalized}`);
            return normalized;
        }
        
        // Handle fish IDs with timestamps
        const fishMatch = normalized.match(/^([a-z_]+)_\d+_\d+$/);
        if (fishMatch) {
            normalized = fishMatch[1];
        }
        
        console.log(`Item ${itemId} has base ID: ${normalized}`);
        return normalized;
    }

    // Add a style to hide chat window
    addHideChatStyle() {
        if (!this.styleElement) {
            this.styleElement = document.createElement('style');
            this.styleElement.id = 'crafting-chat-style';
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
        if (this.styleElement) {
            document.head.removeChild(this.styleElement);
            this.styleElement = null;
        }
    }
}

// Make it globally available
window.CraftingPanel = new CraftingPanel();
console.log('CraftingPanel global object created');