import { World, Entity, Player, ColliderShape, BlockType, Vector3, SimpleEntityController, RigidBodyType } from 'hytopia';
import { PlayerStateManager } from './PlayerStateManager';
import { Collider } from 'hytopia';
import { PlayerEntity } from 'hytopia';
import { SceneUI } from 'hytopia';
import { FISHING_RODS } from './Inventory/RodCatalog';
import { FISHING_KNOWLEDGE } from './FishingKnowledge';

interface MerchantConfig {
    id: string;
    position: { x: number; y: number; z: number };
    facing: { x: number; y: number; z: number };
    modelUri: string;
    modelScale: number;
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
            dialogOptions: [
                "Who are you?",
                "Got any fishing tips",
            ]
        },
    ];

    constructor(
        private world: World,
        private stateManager: PlayerStateManager
    ) {
        // Clean up any existing merchant UIs on initialization
        this.cleanupExistingMerchantUIs();
    }

    initialize() {

        // Spawn all merchants
        MerchantManager.MERCHANT_CONFIGS.forEach(config => {
            this.spawnMerchant(config);
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
                const state = this.stateManager.getState(other.player);
                this.removeDialog(other.player);
                if (state) {
                    state.merchant.currentMerchant = null;
                }
                other.player.ui.sendData({
                    type: 'hideRodShop'
                });
            }
          },
        });
        console.log("Merchant spawned:", merchant.isSpawned, merchant.position);
        this.merchants.set(config.id, merchant);
    }

    private handlePlayerInteraction(player: Player, config: MerchantConfig) {
        const state = this.stateManager.getState(player);
        if (!state) return;

        state.merchant.isInteracting = true;
       // this.removeDialog(player);

        player.ui.sendData({
            type: 'showMerchantDialog'
        });

        const dialog = new SceneUI({
            templateId: 'merchant-dialog',
            position: { 
                x: config.position.x, 
                y: config.position.y + 1.5, // Raise dialog above merchant
                z: config.position.z 
            },
            state: {
                merchantId: config.id,
                options: config.dialogOptions
            }
        });

        dialog.load(this.world);
        this.activeDialogs.set(player, dialog);
    }

    public handleMerchantOption(player: Player, merchantId: string, option: number) {
        switch(merchantId) {
            case 'fish_merchant':
                this.handleFishMerchantOption(player, option);
                break;
            case 'rod_merchant':
                this.handleRodMerchantOption(player, option);
                break;
            case 'boat_merchant':
                this.handleBoatMerchantOption(player, option);
                break;
        }
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

    private handleRodMerchantOption(player: Player, option: number) {
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
                const randomResponse = FISHING_KNOWLEDGE.rods.general[
                    Math.floor(Math.random() * FISHING_KNOWLEDGE.rods.general.length)
                ];
                player.ui.sendData({
                    type: 'merchantSpeak',
                    message: randomResponse
                });             
                break;

        }
    }

    private handleBoatMerchantOption(player: Player, option: number) {
        switch(option) {
            case 0: // Who are you?
                player.ui.sendData({
                    type: 'merchantSpeak',
                    message: "I'm the boat merchant! I'll sell you a boat when our shop is built."
                });
                break;
            case 1: // Got any fishing tips
            const randomResponse = FISHING_KNOWLEDGE.fishing_tips[
                Math.floor(Math.random() * FISHING_KNOWLEDGE.fishing_tips.length)
            ];
        
            player.ui.sendData({
                type: 'merchantSpeak',
                message: randomResponse
            });  
                break;
        }
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

    private removeDialog(player: Player) {
        console.log("Starting dialog removal");
        const existingDialog = this.activeDialogs.get(player);
        if (existingDialog) {
            console.log("Found existing dialog, unloading");
            existingDialog.unload();
            this.activeDialogs.delete(player);
            
            // Force UI reset after dialog removal
            player.ui.sendData({
                type: 'hideMerchantDialog'
            });
            
            // Update state
            const state = this.stateManager.getState(player);
            if (state) {
                state.merchant.isInteracting = false;
                state.merchant.currentMerchant = null;
            }
        }
        console.log("Dialog removal complete");
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
        
        // Filter rods based on level only
        let availableRods = FISHING_RODS.filter(rod => {
            // Skip if player already owns this rod
            if (inventory?.items.some(item => item.id === rod.id)) return false;
            switch(rod.rarity) {
                case 'common':
                case 'uncommon':
                    return level >= 0; // 5
                case 'rare':
                    return level >= 3; // 10
                case 'epic':
                    return level >= 4; // 20 
                case 'legendary':
                    return level >= 5; // 30
                default:
                    return false;
            }
        });
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
}
