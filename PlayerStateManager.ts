import { Entity, Player, World } from 'hytopia';
import { InventoryManager } from './Inventory/InventoryManager';
import { LevelingSystem } from './LevelingSystem';
import type { FishingState } from './FishingMiniGame';
import type { InventoryItem } from './Inventory/Inventory';
import { CurrencyManager } from './CurrencyManager';
import mapData from './assets/maps/map_test.json';
import { FISHING_RODS } from './Inventory/RodCatalog';
import { MessageManager } from './MessageManager';
// First, define our state manager
export class PlayerStateManager {
    private readonly PLAYER_EYE_HEIGHT = 0.1; // Assuming a default eye height

    private states: Map<Player, {
        fishing: FishingState;
        merchant: {
            isInteracting: boolean;
            selectedOption: number | null;
            currentMerchant: string | null;
        };
        swimming: {
            isSwimming: boolean;
        };
    }> = new Map();

    constructor(
        private inventoryManager: InventoryManager,
        private levelingSystem: LevelingSystem,
        private currencyManager: CurrencyManager,
        private messageManager: MessageManager
    ) {}

    initializePlayer(player: Player) {
        this.states.set(player, {
            fishing: {
                isCasting: false,
                castPower: 0,
                isReeling: false,
                lastInputState: { ml: false },
                isPlayerFishing: false,
                fishDepth: 0,
                currentCatch: null,
                isJigging: false,
                fishVelocityY: 0,
                fishingInterval: null,
                reelingGame: {
                    isReeling: false,
                    fishPosition: 0.5,
                    barPosition: 0.5,
                    fishVelocity: 0.005,
                    progress: 25,
                    currentCatch: null
                },
            },
            merchant: {
                isInteracting: false,
                currentMerchant: null,
                selectedOption: null
            },
            swimming: {
                isSwimming: false
            }
        });
    }

    getState(player: Player) {
        return this.states.get(player);
    }

    cleanup(player: Player) {
        const state = this.states.get(player);
        if (state?.fishing.fishingInterval) {
            clearInterval(state.fishing.fishingInterval);
        }
        if (this.inventoryManager.getEquippedRod(player)) {
            let rod = this.inventoryManager.getEquippedRod(player);
            if (rod) {
                this.inventoryManager.cleanup(player);
                this.inventoryManager.unequipItem(player, rod.id);
            }
        }
        this.states.delete(player);
    }

    getEquippedRod(player: Player) {
        return this.inventoryManager.getEquippedRod(player);
    }

    getInventory(player: Player) {
        return this.inventoryManager.getInventory(player);
    }

    addInventoryItem(player: Player, item: InventoryItem) {
        return this.inventoryManager.addItem(player, item);
    }
    
    addXP(player: Player, amount: number) {
        return this.levelingSystem.addXP(player, amount);
    }

    getCurrentLevel(player: Player) {
        return this.levelingSystem.getCurrentLevel(player);
    }

    getCoinBalance(player: Player) {
        return this.currencyManager.getCoins(player);
    }

    updateCurrencyUI(player: Player) {
        this.currencyManager.updateCurrencyUI(player);
    }

    sellFish(player: Player, fishItem: InventoryItem): boolean {
        const state = this.getState(player);
        if (!state || !state.merchant.isInteracting) return false;

        // Check if item exists and is a fish
        if (fishItem.type !== 'fish') return false;

        if (this.isFishEquipped(player, fishItem)) {
            this.inventoryManager.unequipItem(player, fishItem.type);
        }
        // Attempt to remove fish and add coins
        if (this.inventoryManager.removeItem(player, fishItem.id)) {
            this.currencyManager.addCoins(player, fishItem.value);
            return true;
        }

        return false;
    }

    sendGameMessage(player: Player, message: string) {
        this.messageManager.sendGameMessage(message, player);
    }

    isFishEquipped(player: Player, fishItem: InventoryItem): boolean {
        return this.inventoryManager.isFishEquipped(player, fishItem);
    }

    getEquippedFish(player: Player): InventoryItem | null {
        return this.inventoryManager.getEquippedFish(player);
    }

    buyRod(player: Player, rodId: string) {
        const state = this.getState(player);
        if (!state ) return false;
    
        // Get player's inventory and currency
        const inventory = this.getInventory(player);
        const currency = this.currencyManager.getCoins(player);
        if (!inventory || !currency) return false;
    
        // Find the rod in the catalog
        const rod = FISHING_RODS.find(r => r.id === rodId);
        if (!rod) {
            console.log("Rod not found in catalog:", rodId);
            return false;
        }
    
        // Check if player already owns this rod
        if (inventory.items.some(item => item.id === rodId)) {
            player.ui.sendData({
                type: 'gameMessage',
                message: 'You already own this rod!'
            });
            return false;
        }
    
        // Check if player has enough coins
        const playerCoins = this.getCoinBalance(player);
        if (playerCoins < rod.value) {
            player.ui.sendData({
                type: 'gameMessage',
                message: 'Not enough coins!'
            });
            return false;
        }
        // Purchase the rod
        // Subtract coins
        this.currencyManager.removeCoins(player, rod.value);
        
        // Add rod to inventory
        this.inventoryManager.addItem(player, {
            id: rod.id,
            modelId: rod.modelId,
            name: rod.name,
            type: 'rod',
            rarity: rod.rarity,
            value: rod.value,
            quantity: 1,
            metadata: rod.metadata
        });

      //  this.messageManager.sendGameMessage(`Successfully purchased ${rod.name}!`, player);
        player.ui.sendData({
            type: 'hideRodStore',
        });
        console.log(`Successfully purchased ${rod.name}!`);
        return true;
    }


    isInWater(entity : any) {
        const startPos = {
            x: entity.position.x,
            y: entity.position.y + this.PLAYER_EYE_HEIGHT,
            z: entity.position.z
        };
        return this.isWaterBlock(startPos);
    }

    isWaterBlock(position: { x: number, y: number, z: number }): boolean {
        const blockKey = `${Math.floor(position.x)},${Math.floor(position.y)},${Math.floor(position.z)}`;
        const blockTypeId = (mapData.blocks as Record<string, number>)[blockKey];
        return blockTypeId === 43 || blockTypeId === 42 || blockTypeId === 100;
    }

}



