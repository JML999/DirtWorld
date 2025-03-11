import { World, Entity, Player, ColliderShape, BlockType, Vector3, SimpleEntityController, RigidBodyType } from 'hytopia';
import { PlayerStateManager } from './PlayerStateManager';
import { Collider } from 'hytopia';
import { PlayerEntity } from 'hytopia';
import { SceneUI } from 'hytopia';
import { FISH_CATALOG } from './Fishing/FishCatalog';
import { FISHING_RODS } from './Inventory/RodCatalog';
import { FISHING_KNOWLEDGE } from './Fishing/FishingKnowledge';
import type { GamePlayerEntity } from "./GamePlayerEntity";
import type { InventoryItem } from "./Inventory/Inventory";

interface MerchantConfig {
    id: string;
    position: { x: number; y: number; z: number };
    facing: { x: number; y: number; z: number };
    modelUri: string;
    modelScale: number;
    prompt?: string; // Optional welcome message
    dialogOptions: string[];
}

export class MerchantManager {
    public merchants: Map<string, Entity> = new Map();
    public activeDialogs: Map<Player, SceneUI> = new Map();
    
    // Predefined merchant configurations
    private static MERCHANT_CONFIGS: MerchantConfig[] = [
        {
            id: 'fish_merchant',
            position: { x: 12.62, y: 5, z: 4.66 },
            facing: { x: 4, y: 4, z: 5 },
            modelUri: 'models/npcs/merchant.gltf',
            modelScale: 0.60,
            prompt: "Welcome to the Fish Market! What would you like to do?",
            dialogOptions: [
                "Sell Selected fish",
                "Sell Fish Inventory",
                "Who are you?",
            ]
        },
        {
            id: 'rod_merchant',
            position: { x: -13, y: 4.8, z: 12 },
            facing: { x: 0, y: 1.57, z: 0 },
            modelUri: 'models/npcs/merchant.gltf',
            modelScale: 0.60,
            prompt: "Welcome to Rod Emporium! How can I help you?",
            dialogOptions: [
                "Buy a rod",
                "Who are you?",
                "Tell me about rods",
            ]
        },
        {
            id: 'boat_merchant',
            position: { x: 2, y: 7, z: -17 },
            facing: { x: 1, y: 6, z: -24 },
            modelUri: 'models/npcs/merchant.gltf',
            modelScale: 0.60,
            prompt: "Ahoy there! Looking for fishing advice?",
            dialogOptions: [
                "Who are you?",
                "Got any fishing tips",
            ]
        },
        {
            id: 'sushi_merchant',
            position: { x: -11.69, y: 5.75, z: -11.77 },
            facing: { x: -1, y: 5.75, z: -10 },
            modelUri: 'models/npcs/merchant.gltf',
            modelScale: 0.60,
            prompt: "",
            dialogOptions: []
        },
    ];

    // Static array of specific fish for sushi merchant
    private static SUSHI_FISH_OPTIONS = [
        "Grouper",
        "Salmon",
        "Cod",
        "Puffer Fish",
        "Spotted Flounder",
        "Rainbow Flounder"
    ];

    // Static array of available rods with level requirements
    private static AVAILABLE_RODS = [
        {"oak_rod" : 1}, 
        {"carbon_fiber_rod" : 5},
        {"deep_sea_rod" : 10},
        {"onyx_rod" : 15},
        {"hytopia_rod" : 50},
    ];

    private currentCatchOfTheDay: string = MerchantManager.SUSHI_FISH_OPTIONS[0];
    private catchOfTheDayTimestamp: number = Date.now();
    private readonly CATCH_REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    
    constructor(
        private world: World,
        private stateManager: PlayerStateManager
    ) {
        // Clean up any existing merchant UIs on initialization
        this.cleanupExistingMerchantUIs();
        
        // Initialize catch of the day on startup
        this.refreshCatchOfTheDay();
        
        // Set up timer to refresh catch of the day
        setInterval(() => this.refreshCatchOfTheDay(), this.CATCH_REFRESH_INTERVAL);
    }

    initialize() {
        // Spawn all merchants
        MerchantManager.MERCHANT_CONFIGS.forEach(config => {
            this.spawnMerchant(config);
        });
        
        // Create the sushi merchant counter
        this.createSushiMerchantCounter();
        // Create the crafting block
        this.createCraftingBlock();
    }

    private createSushiMerchantCounter() {
        // Sushi merchant position from config
        const merchantPos = { x: -11.69, y: 5.75, z: -11.77 };
        
        // Position for center counter block
        const centerPos = {
            x: -11.0,
            y: 5.25,
            z: -11.77
        };
        
        // Create center counter block
        const centerBlock = new Entity({
            blockTextureUri: "blocks/oak-planks.png",
            blockHalfExtents: { x: 0.5, y: 0.5, z: 0.5 },
            rigidBodyOptions: {
                type: RigidBodyType.FIXED,
            }
        });
        centerBlock.spawn(this.world, centerPos);
        
        // Create front counter block (closer to player)
        const frontPos = {
            x: centerPos.x,
            y: centerPos.y,
            z: centerPos.z + 1.0 // 1 unit forward
        };
        
        const frontBlock = new Entity({
            blockTextureUri: "blocks/oak-planks.png",
            blockHalfExtents: { x: 0.5, y: 0.5, z: 0.5 },
            rigidBodyOptions: {
                type: RigidBodyType.FIXED,
            }
        });
        frontBlock.spawn(this.world, frontPos);
        
        // Create back counter block (closer to merchant)
        const backPos = {
            x: centerPos.x,
            y: centerPos.y,
            z: centerPos.z - 1.0 // 1 unit backward
        };
        
        const backBlock = new Entity({
            blockTextureUri: "blocks/oak-planks.png",
            blockHalfExtents: { x: 0.5, y: 0.5, z: 0.5 },
            rigidBodyOptions: {
                type: RigidBodyType.FIXED,
            }
        });
        backBlock.spawn(this.world, backPos);

        const endPos = {
            x: centerPos.x,
            y: centerPos.y,
            z: centerPos.z + 2.0 // 1 unit forward
        };
        
        const endBlock = new Entity({
            blockTextureUri: "blocks/oak-planks.png",
            blockHalfExtents: { x: 0.5, y: 0.5, z: 0.5 },
            rigidBodyOptions: {
                type: RigidBodyType.FIXED,
            }
        });
        endBlock.spawn(this.world, endPos);
        
        // Create back counter block (closer to merchant)
        const beginPos = {
            x: centerPos.x,
            y: centerPos.y,
            z: centerPos.z - 2.0 // 1 unit backward
        };
        
        const beginBlock = new Entity({
            blockTextureUri: "blocks/oak-planks.png",
            blockHalfExtents: { x: 0.5, y: 0.5, z: 0.5 },
            rigidBodyOptions: {
                type: RigidBodyType.FIXED,
            }
        });
        beginBlock.spawn(this.world, beginPos);
        
        // Add cod on front block
        const codModel = new Entity({
            modelUri: 'models/items/cod-raw.gltf',
            modelScale: 1
        });
        codModel.spawn(this.world, { 
            x: frontPos.x, 
            y: frontPos.y + 0.4, // Place on top of block
            z: frontPos.z 
        });
        
        // Add salmon on back block
        const salmonModel = new Entity({
            modelUri: 'models/items/salmon-raw.gltf',
            modelScale: 1
        });
        salmonModel.spawn(this.world, { 
            x: backPos.x, 
            y: backPos.y + 0.4, // Place on top of block
            z: backPos.z 
        });
    }

    private spawnMerchant(config: MerchantConfig) {
        const merchant = new Entity({
            name: `Merchant - ${config.id}`,
            controller: new SimpleEntityController(),
            modelUri: config.modelUri,
            modelLoopedAnimations: ['idle'],
            modelScale: config.modelScale,
            rigidBodyOptions: {
                type: RigidBodyType.KINEMATIC_POSITION  // This prevents physics interaction
            }
        });

        const merchantEntityController = merchant.controller as SimpleEntityController;
        merchantEntityController.face(config.facing, 1);

        merchant.spawn(this.world, config.position);
        // Add our sensor collider
        merchant.createAndAddChildCollider({
          shape: ColliderShape.CYLINDER,
          radius: 3,
          halfHeight: 2,
          isSensor: true,// This makes the collider not collide with other entities/objects, just sense their intersection
          onCollision: (other: BlockType | Entity, started: boolean) => {
            if (other instanceof PlayerEntity && started) {
                const state = this.stateManager.getState(other.player);
                if (state) {
                    state.merchant.currentMerchant = config.id;
                }
                this.handlePlayerInteraction(other.player, config);
            } else if (other instanceof PlayerEntity) {
                // Player left merchant area - use the comprehensive cleanup
                this.forceCleanupPlayerUI(other.player);
            }
          },
        });
        this.merchants.set(config.id, merchant);
    }

    private handlePlayerInteraction(player: Player, config: MerchantConfig) {
        const state = this.stateManager.getState(player);
        if (!state) return;

        state.merchant.isInteracting = true;
        state.merchant.currentMerchant = config.id;
        
        // Special handling for sushi merchant
        if (config.id === 'sushi_merchant') {
            // Use the current catch of the day
            const catchOfTheDay = this.getCurrentCatchOfTheDay();
            
            // Store in player state
            state.merchant.catchOfTheDay = catchOfTheDay;
            
            // Check if player has this fish
            const inventory = this.stateManager.getInventory(player);
            const hasFish = inventory?.items.some(item => 
                item.type === 'fish' && 
                (item.name === catchOfTheDay || item.metadata?.fishStats?.species === catchOfTheDay)
            );
            
            // Format time until refresh
            const timeRemaining = this.getTimeUntilNextCatchRefresh();
            const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));
            const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
            
            // Create dialog with everything in one screen
            player.ui.sendData({
                type: 'showMerchantDialog'
            });

            const dialog = new SceneUI({
                templateId: 'merchant-dialog',
                position: { 
                    x: config.position.x, 
                    y: config.position.y + 1.5,
                    z: config.position.z 
                },
                state: {
                    merchantId: config.id,
                    message: `Welcome to Oiji Sushi! Im running low on todays catch of the day, ${catchOfTheDay}. I'll trade you a Fly Rod for some. What do you say?`,
                    options: [
                        `${hasFish ? "Yes, trade my " + catchOfTheDay + " for a Fly Rod" : "I'll find a " + catchOfTheDay + " for you"}`,
                        "Tell me about Fly Rods",
                        "Tell me about Bait Crafting"
                    ]
                }
            });

            dialog.load(this.world);
            this.activeDialogs.set(player, dialog);
            return;
        }
        
        // Regular merchant handling
        this.showMerchantDialog(player, config, config.prompt || "");
    }

    // Helper method to show merchant dialog
    private showMerchantDialog(player: Player, config: MerchantConfig, message: string) {
        player.ui.sendData({
            type: 'showMerchantDialog'
        });

        const dialog = new SceneUI({
            templateId: 'merchant-dialog',
            position: { 
                x: config.position.x, 
                y: config.position.y + 1.5,
                z: config.position.z 
            },
            state: {
                merchantId: config.id,
                message: message,
                options: config.dialogOptions
            }
        });

        dialog.load(this.world);
        this.activeDialogs.set(player, dialog);
    }

    public handleMerchantOption(player: Player, merchantId: string, option: number): void {
        console.log(`Handling merchant option: ${merchantId}, option: ${option}`);
        
        const state = this.stateManager.getState(player);
        if (!state) return;
        
        // Get the current merchant config
        const merchantConfig = MerchantManager.MERCHANT_CONFIGS.find(m => m.id === merchantId);
        if (!merchantConfig) {
            this.removeDialog(player);
            return;
        }
        
        // Special case for sushi merchant
        if (merchantId === 'sushi_merchant') {
            switch(option) {
                case 0: // First option - accept the deal
                    this.processSushiTrade(player);
                    break;

                case 1: // Tell me about Fly Rods
                    player.ui.sendData({
                        type: 'merchantSpeak',
                        message: "Fly Rods are the best way to catch freshwater fish. Cast them in ponds around the island."
                    });
                    break;
                case 2: // Tell me about Bait Crafting
                    player.ui.sendData({
                        type: 'merchantSpeak',
                        message: "Combining your catch and loot with seaweed is a great way to make new types of bait. Feel free to use our sushi crafting block to create your own!"
                    });
                    break;
                case 3: // Second option - decline
                    player.ui.sendData({
                        type: 'merchantSpeak',
                        message: "No problem! Come back if you change your mind."
                    });
                    break;
                default:
                    this.removeDialog(player);
                    break;
            }
            return;
        }
        
        // Handle other merchants based on their ID
        switch(merchantId) {
            case 'fish_merchant':
                this.handleFishMerchantOption(player, option);
                break;
            case 'rod_merchant':
                const randomResponse = this.getMerchantResponse(player, "rod");
                this.handleRodMerchantOption(player, option, randomResponse);
                break;
            case 'boat_merchant':
                const randomBoatResponse = this.getMerchantResponse(player, "boat");
                this.handleBoatMerchantOption(player, option, randomBoatResponse);
                break;
            default:
                // Unknown merchant, just remove the dialog
                this.removeDialog(player);
                break;
        }
    }

    public getMerchantResponse(player: Player, merchantType: string): string {
        const state = this.stateManager.getState(player);
        if (!state) return "Let me think about it...";
        if (state.merchant.merchantResponse == "") {
            if (merchantType == "rod") {
                const randomResponse = FISHING_KNOWLEDGE.rods.general[
                    Math.floor(Math.random() * FISHING_KNOWLEDGE.rods.general.length)
                ];
                state.merchant.merchantResponse = randomResponse;
                return randomResponse;
            } else if (merchantType == "boat") {
                const randomResponse = FISHING_KNOWLEDGE.fishing_tips[
                    Math.floor(Math.random() * FISHING_KNOWLEDGE.fishing_tips.length)
                ];
                state.merchant.merchantResponse = randomResponse;
                return randomResponse;
            }
        } else {
            return state.merchant.merchantResponse;
        }
        return "Let me think about it...";
    }

    private handleFishMerchantOption(player: Player, option: number) {
        switch(option) {
            case 0: // Sell this
                this.sellSelectedFish(player);
                break;
            case 1: // Sell inventory
                this.sellAllFish(player);
                this.stateManager.updateCurrencyUI(player);
                break;
            case 2: // Who are you?
                player.ui.sendData({
                    type: 'merchantSpeak',
                    message: "I'm the fish merchant! I'll buy any fish you catch."
                });
                break;
        }
    }

    private handleRodMerchantOption(player: Player, option: number, randomResponse: string) {
        switch(option) {
            case 0: // Buy gear
                this.showRodShop(player);
                break;
            case 1: // Who are you?
                player.ui.sendData({
                    type: 'merchantSpeak',
                        message: "I'm the rod merchant! I sell the finest equipment around."
                    });     
                     break;
            case 2: // Sell gear
                player.ui.sendData({
                    type: 'merchantSpeak',
                    message: randomResponse
                });             
                break;

        }
    }

    private handleBoatMerchantOption(player: Player, option: number, randomBoatResponse: string) {
        switch(option) {
            case 0: // Who are you?
                player.ui.sendData({
                    type: 'merchantSpeak',
                    message: "I'm the boat merchant! I'll sell you a boat when our shop is built."
                });
                break;
            case 1: // Got any fishing tips
            player.ui.sendData({
                type: 'merchantSpeak',
                message: randomBoatResponse
            });  
                break;
        }
    }   
    // Add a new handler for the deal response
    public handleSushiDealResponse(player: Player, option: number) {
        const state = this.stateManager.getState(player);
        if (!state || !state.merchant.catchOfTheDay) return;
        
        if (option === 0) { // Yes, make the trade
            // Find the fish in inventory
            const inventory = this.stateManager.getInventory(player);
            const fishItem = inventory?.items.find(item => 
                item.type === 'fish' && 
                item.metadata?.fishStats?.species === state.merchant.catchOfTheDay
            );

            // Check if player already owns this rod
            if (inventory?.items.some(item => item.id === 'fly_rod')) {
                player.ui.sendData({
                    type: 'gameMessage',
                    message: 'You already own this rod!'
                });
                return;
            }
            
            if (fishItem) {
                // Remove the fish
                this.stateManager.removeInventoryItem(player, fishItem.id);
                
                // Add fly rod to inventory
                const flyRod = FISHING_RODS.find(rod => rod.id === 'fly_rod');
                if (flyRod) {
                    this.stateManager.addInventoryItem(player, {
                        id: flyRod.id,
                        name: flyRod.name,
                        modelId: flyRod.modelId,
                        sprite: flyRod.sprite,
                        type: 'rod',
                        rarity: flyRod.rarity,
                        value: flyRod.value,
                        quantity: 1,
                        metadata: {
                            rodStats: {
                                maxCatchWeight: flyRod.metadata.rodStats?.maxCatchWeight || 10,
                                custom: flyRod.metadata.rodStats?.custom || false,
                                rarityBonus: 1.0,
                                sizeBonus: 1.0,
                                maxDistance: 20,
                                luck: 1.0,
                                health: 100,
                                damage: flyRod.metadata.rodStats?.damage || 10
                            }
                        }
                    });
                    
                    this.stateManager.sendGameMessage(player, `You traded a ${state.merchant.catchOfTheDay} for a ${flyRod.name}!`);
                    player.ui.sendData({
                        type: 'merchantSpeak',
                        message: `Excellent! This ${state.merchant.catchOfTheDay} will make a perfect dish. Enjoy your new rod!`
                    });
                } else {
                    console.error("Fly rod not found in FISHING_RODS");
                }
            } else {
                player.ui.sendData({
                    type: 'merchantSpeak',
                    message: `Hmm, it seems you don't have a ${state.merchant.catchOfTheDay} after all. Come back when you catch one!`
                });
            }
        } else { // No thanks
            player.ui.sendData({
                type: 'merchantSpeak',
                message: "No problem! Come back if you change your mind."
            });
        }
        
        // Clear the catch of the day from state
        state.merchant.catchOfTheDay = null;
        
        // Remove dialog
        this.removeDialog(player);
    }

    private sellSelectedFish(player: Player) {
        const inventory = this.stateManager.getInventory(player);
        if (!inventory) return;

        const selectedFish = this.stateManager.getEquippedFish(player);
        if (!selectedFish) {
            this.stateManager.sendGameMessage(player, `Equip a fish in inventory`);
            return;
        }
        const fishItem = inventory.items.find(item => item.id === selectedFish.id);
        if (!fishItem) return;
        
        this.stateManager.sellFish(player, fishItem);
        this.stateManager.sendGameMessage(player, `Sold ${fishItem.name} for ${fishItem.value} coins!`);
    }

    private sellAllFish(player: Player) {
        const inventory = this.stateManager.getInventory(player);
        if (!inventory) return;
        const fishItems = inventory.items.filter(item => item.type === 'fish');
        if (fishItems.length === 0) {
            this.stateManager.sendGameMessage(player, `You have no fish to sell!`);
            return;
        }
        let totalEarnings = 0;
        let fishSold = 0;
        for (const fish of fishItems) {
            if (this.stateManager.sellFish(player, fish)) {
                totalEarnings += fish.value;
                fishSold++;
            }
        }
        this.stateManager.sendGameMessage(player, `Sold ${fishSold} fish for ${totalEarnings} coins!`);
    }

    private removeDialog(player: Player): void {
        const dialog = this.activeDialogs.get(player);
        if (dialog) {
            dialog.unload();
            this.activeDialogs.delete(player);
        }
        
        // Reset merchant state
        const state = this.stateManager.getState(player);
        if (state) {
            state.merchant.isInteracting = false;
            // Don't reset currentMerchant here as it's used to track which merchant area the player is in
        }
        
        // Make sure to clear any pending catch of the day deals
        if (state?.merchant.catchOfTheDay) {
            state.merchant.catchOfTheDay = null;
        }
    }

    cleanup() {
        for (const merchant of this.merchants.values()) {
            merchant.despawn();
        }
        this.merchants.clear();
    }


    cleanupPlayerDialogs(player: Player) {
        this.removeDialog(player);
    }

    private showRodShop(player: Player) {
        const level = this.stateManager.getCurrentLevel(player);
        const playerCoins = this.stateManager.getCoinBalance(player);
        const inventory = this.stateManager.getInventory(player);
        
        // Filter rods based on level using the new data structure
        let availableRods = [];
        
        for (const rodEntry of MerchantManager.AVAILABLE_RODS) {
            const rodId = Object.keys(rodEntry)[0];
            const requiredLevel = rodEntry[rodId as keyof typeof rodEntry];
            
            // Skip if player already owns this rod
            if (inventory?.items.some(item => item.id === rodId)) continue;
            
            // Skip if player level is too low
            if (level < (requiredLevel ?? 1)) continue;
            
            // Find the rod in the catalog
            const rod = FISHING_RODS.find(r => r.id === rodId);
            if (rod) {
                availableRods.push(rod);
            }
        }
        
        // Send available rods to UI with affordability info
        player.ui.lockPointer(true);
        console.log("sending rods to ui", availableRods);
        player.ui.sendData({
            type: 'showRodShop',
            rods: availableRods,
            playerCoins: playerCoins  // Send current coins to UI for display/logic
        });
    }

    public cleanupExistingMerchantUIs() {
        const allSceneUIs = this.world.sceneUIManager.getAllSceneUIs();
        const activePlayers = Array.from(this.activeDialogs.keys());
        
        // Filter for merchant dialogs
        allSceneUIs.forEach(ui => {
            if (ui.templateId === 'merchant-dialog') {
                // Check if this UI belongs to an active player's dialog
                const isActiveDialog = activePlayers.some(player => {
                    const playerDialog = this.activeDialogs.get(player);
                    return playerDialog && playerDialog.id === ui.id;
                });
    
                if (!isActiveDialog) {
                    console.log(`Cleaning up orphaned merchant UI at position:`, ui.position);
                    ui.unload();
                } else {
                    console.log(`Keeping active merchant UI at position:`, ui.position);
                }
            }
        });
    }
    
    public forceCleanup(player?: Player) {
        if (player) {
            // Clean up just this player's dialog
            this.removeDialog(player);
            this.activeDialogs.delete(player);
            const state = this.stateManager.getState(player);
            if (state) {
                state.merchant.currentMerchant = null;
                state.merchant.merchantResponse = "";
            }
        } else {
            // Clean up all dialogs
            this.activeDialogs.forEach((dialog, player) => {
                this.removeDialog(player);
            });
            this.activeDialogs.clear();
        }
        
        // Clean up any orphaned UIs
        this.cleanupExistingMerchantUIs();
    }

    // Add a method to force cleanup all UI elements for a player
    public forceCleanupPlayerUI(player: Player): void {
        console.log("Force cleaning up all UI for player");
        
        // 1. Remove any tracked dialogs
        const dialog = this.activeDialogs.get(player);
        if (dialog) {
            try {
                dialog.unload();
            } catch (e) {
                console.error("Error unloading dialog:", e);
            }
            this.activeDialogs.delete(player);
        }
        
        // 2. Reset merchant state
        const state = this.stateManager.getState(player);
        if (state && state.merchant) {
            state.merchant.isInteracting = false;
            state.merchant.currentMerchant = null;
            state.merchant.merchantResponse = "";
            state.merchant.catchOfTheDay = null;
        }
        
        // 3. Send explicit commands to hide all UI elements
        try {
            player.ui.sendData({ type: 'hideRodShop' });
            player.ui.sendData({ type: 'hideMerchantDialog' });
            player.ui.sendData({ type: 'resetAllDialogs' });
        } catch (e) {
            console.error("Error sending UI commands:", e);
        }
        
        // 4. Find and remove any orphaned dialog entities in the world
        const dialogEntities = this.world.entityManager.getAllEntities().filter(
            entity => entity.name && (
                entity.name.includes('dialog') || 
                entity.name.includes('merchant') ||
                entity.name === 'SceneUI'
            )
        );
        
        for (const entity of dialogEntities) {
            try {
                if (entity.parent && entity.parent.id && player.id && 
                    entity.parent.id.toString() === player.id.toString()) {
                    entity.despawn();
                }
            } catch (e) {
                console.error("Error despawning dialog entity:", e);
            }
        }
    }

    // Add cleanup when player disconnects
    public onPlayerDisconnect(player: Player): void {
        this.forceCleanupPlayerUI(player);
    }

    // Add cleanup when player respawns
    public onPlayerRespawn(player: Player): void {
        this.forceCleanupPlayerUI(player);
    }

    private handleCatchOfTheDayDeal(player: Player): void {
        console.log("Handling Catch of the Day Deal");
        
        // Get or generate the catch of the day
        const state = this.stateManager.getState(player);
        if (!state || !state.merchant) return;
        
        // If we don't have a catch of the day yet, generate one
        if (!state.merchant.catchOfTheDay) {
            // Pick a random fish from the catalog (excluding legendary)
            const eligibleFish = Object.values(FISH_CATALOG).filter(
                fish => fish.rarity !== 'legendary'
            );
            
            if (eligibleFish.length > 0) {
                const randomFish = eligibleFish[Math.floor(Math.random() * eligibleFish.length)];
                state.merchant.catchOfTheDay = randomFish.id;
            } else {
                state.merchant.catchOfTheDay = 'common-fish'; // Fallback
            }
        }
        
        // Get the fish details
        const fishId = state.merchant.catchOfTheDay;
        const fishDetails = FISH_CATALOG.find(fish => fish.name === fishId || fish.id === fishId);
        
        if (!fishDetails) {
            this.showMerchantResponse(player, "Sorry, I don't have a special deal today.");
            return;
        }
        
        // Show the offer
        this.showMerchantResponse(
            player, 
            `Today's special: Bring me a ${fishDetails.name} and I'll trade you a fly rod! Do you have one?`
        );
    }

    private showMerchantResponse(player: Player, message: string): void {
        player.ui.sendData({
            type: 'merchantSpeak',
            message: message
        });
    }

    // Add a new method to process the sushi trade
    private processSushiTrade(player: Player): void {
        console.log("Processing sushi trade");
        const state = this.stateManager.getState(player);
        if (!state || !state.merchant.catchOfTheDay) {
            this.removeDialog(player);
            return;
        }
        const fishName = state.merchant.catchOfTheDay;
        // Check if player has this fish
        const inventory = this.stateManager.getInventory(player);
        const fishItem = inventory?.items.find(item => 
            item.type === 'fish' && 
            (item.name === fishName || item.metadata?.fishStats?.species === fishName)
        );
        
        if (fishItem) {
            // Remove the fish from inventory
            this.stateManager.removeInventoryItem(player, fishItem.id);
            // Add a fly rod to inventory
            const flyRod = FISHING_RODS.find(rod => rod.id === 'fly_rod');
            if (flyRod) {
                this.stateManager.addInventoryItem(player, {
                    id: flyRod.id,
                    name: flyRod.name,
                    modelId: flyRod.modelId,
                    sprite: flyRod.sprite,
                    type: 'rod',
                    rarity: flyRod.rarity,
                    value: flyRod.value,
                    quantity: 1,
                    metadata: {
                        rodStats: {
                            maxCatchWeight: flyRod.metadata.rodStats?.maxCatchWeight || 10,
                            custom: flyRod.metadata.rodStats?.custom || false,
                            rarityBonus: 1.0,
                            sizeBonus: 1.0,
                            maxDistance: flyRod.metadata.rodStats?.maxDistance || 10,
                            luck: 1.0,
                            health: 100,
                            damage: flyRod.metadata.rodStats?.damage || 10
                        }
                    }
                });
                
                this.stateManager.sendGameMessage(player, `You traded a ${fishName} for a ${flyRod.name}!`);
                player.ui.sendData({
                    type: 'merchantSpeak',
                    message: `Excellent! This ${fishName} will make a perfect dish. Enjoy your new rod!`
                });
            }
        } else {
            player.ui.sendData({
                type: 'merchantSpeak',
                message: `Hmm, it seems you don't have a ${fishName}. Come back when you catch one!`
            });
        }
        // Remove dialog after processing
        this.removeDialog(player);
    }

    /**
     * Refresh the catch of the day fish
     */
    public refreshCatchOfTheDay(): void {
        // Select a random fish from our curated list
        const randomIndex = Math.floor(Math.random() * MerchantManager.SUSHI_FISH_OPTIONS.length);
        this.currentCatchOfTheDay = MerchantManager.SUSHI_FISH_OPTIONS[randomIndex];
        this.catchOfTheDayTimestamp = Date.now();
        console.log(`New Catch of the Day: ${this.currentCatchOfTheDay} (refreshes in 12 hours)`);
    }
    
    /**
     * Get the current catch of the day
     */
    public getCurrentCatchOfTheDay(): string {
        // Check if we need to refresh (in case the interval was missed)
        if (Date.now() - this.catchOfTheDayTimestamp > this.CATCH_REFRESH_INTERVAL) {
            this.refreshCatchOfTheDay();
        }
        return this.currentCatchOfTheDay;
    }
    
    /**
     * Get time remaining until next catch of the day refresh
     * @returns Time remaining in milliseconds
     */
    public getTimeUntilNextCatchRefresh(): number {
        const elapsed = Date.now() - this.catchOfTheDayTimestamp;
        return Math.max(0, this.CATCH_REFRESH_INTERVAL - elapsed);
    }

    private createCraftingBlock() {
        // Crafting block position
        const craftingPos = { 
            x: -8.147893905639648, 
            y: 5.25, // Adjusted to match other blocks
            z: -14.272636413574219 
        };
        
        // Create crafting block
        const craftingBlock = new Entity({
            name: "Crafting Block",
            blockTextureUri: "blocks/craft", // Use crafting table texture
            blockHalfExtents: { x: 0.5, y: 0.5, z: 0.5 },
            rigidBodyOptions: {
                type: RigidBodyType.FIXED,
            }
        });
        
        // Spawn the block
        craftingBlock.spawn(this.world, craftingPos);        
        // Add sensor collider for player interaction
        craftingBlock.createAndAddChildCollider({
            shape: ColliderShape.CYLINDER,
            radius: 1,
            halfHeight: 1,
            isSensor: true,
            onCollision: (other: BlockType | Entity, started: boolean) => {
                if (other instanceof PlayerEntity && started) {
                    // Player entered the crafting area
                    console.log("[CRAFTING] Player entered crafting area");
                    
                    const player = other.player;
                    
                    // Open the crafting UI by sending a message to the client
                    player.ui.sendData({
                        type: 'openCrafting'
                    });
                    
                    // If you need to call handleCraftItem directly, you would need access to that method
                    // This would typically be done when the player actually submits a crafting request
                    // not just when they approach the crafting table
                }
            },
        });
        
        console.log("[CRAFTING] Created crafting block at", craftingPos);
    }
}
