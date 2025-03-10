import { Entity, Player, World } from 'hytopia';
import { InventoryManager } from './Inventory/InventoryManager';
import { LevelingSystem } from './LevelingSystem';
import type { FishingState } from './Fishing/FishingMiniGame';
import type { InventoryItem } from './Inventory/Inventory';
import { CurrencyManager } from './CurrencyManager';
import mapData from './assets/maps/map_test.json';
import { FISHING_RODS } from './Inventory/RodCatalog';
import { MessageManager } from './MessageManager';
import { PersistenceManager } from 'hytopia';
import { CONFIG, isDevMode, canSaveData, canLoadFromPastPlayers } from './state/Config';

export type PlayerState = {
    fishing: FishingState;
    merchant: {
        isInteracting: boolean;
        selectedOption: number | null;
        currentMerchant: string | null;
        merchantResponse: string;
        catchOfTheDay: string | null;
    };
    swimming: {
        isSwimming: boolean;
        breath: number;
    };
};

// First, define our state manager
export class PlayerStateManager {
    private readonly PLAYER_EYE_HEIGHT = 0.1; // Assuming a default eye height

    private states: Map<Player, PlayerState> = new Map();

    constructor(
        private inventoryManager: InventoryManager,
        private levelingSystem: LevelingSystem,
        private currencyManager: CurrencyManager,
        private messageManager: MessageManager
    ) {
        console.log(`[PlayerStateManager] DEVELOPMENT_MODE is set to: ${CONFIG.DEVELOPMENT_MODE}`);
    }

    async initializePlayer(player: Player) {
        // Set default state first
        this.states.set(player, this.createDefaultState());
        console.log(`[INIT] Initializing player ${player.id}`);
        
        try {
            // Step 1: Try to load persisted data from various sources
            const persistedData = await this.loadPersistedData(player);
            
            // Step 2: Apply the data if found
            if (persistedData) {
                await this.applyPersistedData(player, persistedData);
            } else {
                console.log("[INIT] No persisted data found, using default state");
            }
            
            // Step 3: Always update UI regardless of data source
            this.updateAllUI(player);
            
            // Step 4: Save this player as the most recent
            await PersistenceManager.instance.setGlobalData("mostRecentPlayer", { 
                id: player.id, 
                timestamp: Date.now() 
            });
            
        } catch (e) {
            console.error("[INIT] Error in initializePlayer:", e);
            // Still update UI even if there was an error
            this.updateAllUI(player);
        }
        
        // Print debug info
        if (CONFIG.DEVELOPMENT_MODE) { this.printAllPersistedData();}
    }

    // Helper method to load persisted data from various sources
    private async loadPersistedData(player: Player): Promise<any> {
        console.log(`[PlayerStateManager] loadPersistedData called, DEVELOPMENT_MODE: ${CONFIG.DEVELOPMENT_MODE}`);
        
        if (CONFIG.DEVELOPMENT_MODE) {
            console.log('[PlayerStateManager] DEVELOPMENT_MODE is true, returning null instead of loading');
            return null;
        }
        
        // Try source 1: Player's own persisted data
        try {
            const ownData = await player.getPersistedData();
            if (ownData) {
                console.log(`[LOAD] Loaded persisted data for current player ${player.id}`);
                return ownData;
            }
        } catch (e) {
            console.warn("[LOAD] Failed to load player's own data:", e);
        }
        
        // If we don't want to load from past players, return null here
        if (!CONFIG.LOAD_FROM_PAST_PLAYERS) {
            console.log("[LOAD] Loading from past players is disabled, using default state");
            return null;
        }
        
        /*
        // Try source 2: Most recent player's data (only if LOAD_FROM_PAST_PLAYERS is enabled)
        if (CONFIG.LOAD_FROM_PAST_PLAYERS) {
            try {
                const mostRecentPlayer = await PersistenceManager.instance.getGlobalData("mostRecentPlayer");
                if (mostRecentPlayer && mostRecentPlayer.id && mostRecentPlayer.id !== player.id) {
                    console.log(`[LOAD] Found most recent player: ${mostRecentPlayer.id}`);
                    
                    // Load data for this player
                    const mostRecentData = await PersistenceManager.instance.getGlobalData(`player-data-${mostRecentPlayer.id}`);
                    
                    if (mostRecentData) {
                        console.log(`[LOAD] Loaded data from most recent player: ${mostRecentPlayer.id}`);
                        return mostRecentData;
                    }
                }
            } catch (e) {
                console.warn("[LOAD] Failed to load most recent player data:", e);
            }
        }
        */
        
        // No data found from any source
        return null;
    }

    // Helper method to apply persisted data to player
    private async applyPersistedData(player: Player, data: any): Promise<void> {
        console.log(`[PlayerStateManager] applyPersistedData called, DEVELOPMENT_MODE: ${CONFIG.DEVELOPMENT_MODE}`);
        
        if (CONFIG.DEVELOPMENT_MODE) {
            console.log('[PlayerStateManager] DEVELOPMENT_MODE is true, skipping applyPersistedData');
            return;
        }
        
        // Apply inventory
        if (data.inventory) {
            try {
                console.log(`[APPLY] Applying inventory data`);
                this.inventoryManager.loadInventory(player, data.inventory);
            } catch (e) {
                console.error("[APPLY] Failed to restore inventory:", e);
            }
        }
        
        // Apply level and XP
        if (data.level !== undefined && data.xp !== undefined) {
            try {
                const level = typeof data.level === 'number' ? data.level : 
                            (typeof data.level === 'string' ? parseInt(data.level) : 1);
                const xp = typeof data.xp === 'number' ? data.xp : 
                          (typeof data.xp === 'string' ? parseInt(data.xp) : 0);
                this.levelingSystem.setPlayerLevel(player, level, xp);
            } catch (e) {
                console.error("[APPLY] Failed to restore level and XP:", e);
            }
        }
        
        // Apply currency
        if (data.coins !== undefined) {
            try {
                const coins = typeof data.coins === 'number' ? data.coins : 
                            (typeof data.coins === 'string' ? parseInt(data.coins) : 0);
                this.currencyManager.setCoins(player, coins);
            } catch (e) {
                console.error("[APPLY] Failed to restore currency:", e);
            }
        }
    }

    // Helper method to update all UI elements
    public updateAllUI(player: Player): void {
        try {
            console.log(`[UI] Updating all UI elements for player ${player.id}`);
            
            // Force direct UI updates with explicit console logs
            const inventory = this.inventoryManager.getInventory(player);
            console.log(`[UI] Sending inventory update with ${inventory?.items?.length || 0} items`);
            this.inventoryManager.updateInventoryUI(player);
            
            const currency = this.currencyManager.getCoins(player);
            console.log(`[UI] Sending currency update with ${currency} coins`);
            this.currencyManager.updateCurrencyUI(player);
            
            const level = this.levelingSystem.getCurrentLevel(player);
            const xp = this.levelingSystem.getCurrentXP(player);
            console.log(`[UI] Sending level update with level ${level}, XP ${xp}`);
            this.levelingSystem.sendLevelUIUpdate(player);
            
            console.log(`[UI] All updates sent for player ${player.id}`);
        } catch (e) {
            console.error("[UI] Failed to update UI:", e);
        }
    }

    getPersistedPlayerData(player: Player, persistedData: any) {
        console.log(`Loading persisted data for player ${player.id}`);
            // Initialize state with default values
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
                        currentCatch: null,
                        time: 0,
                        amplitude: 0.5,
                        frequency: 0.05,
                        basePosition: 0.5
                    },
                },
                merchant: {
                    isInteracting: false,
                    currentMerchant: null,
                    selectedOption: null,
                    merchantResponse: "",
                    catchOfTheDay: null
                },
                swimming: {
                    isSwimming: false,
                    breath: 100.00
                }
            });
            
            // Restore inventory
            if (persistedData.inventory) {
                this.inventoryManager.loadInventory(player, persistedData.inventory);
                let rod = this.inventoryManager.getEquippedRod(player);
                if (rod) {
                    this.inventoryManager.equipItem(player, rod.id);
                }
            }
            
            // Restore level and XP
            if (persistedData.level && persistedData.xp) {
                const level = typeof persistedData.level === 'number' ? persistedData.level : 
                             (typeof persistedData.level === 'string' ? parseInt(persistedData.level) : 1);
                const xp = typeof persistedData.xp === 'number' ? persistedData.xp : 
                              (typeof persistedData.xp === 'string' ? parseInt(persistedData.xp) : 0);
                this.levelingSystem.setPlayerLevel(player, level, xp);
            }
            
            // Restore currency
            if (persistedData.coins) {
                const coins = typeof persistedData.coins === 'number' ? persistedData.coins : 
                              (typeof persistedData.coins === 'string' ? parseInt(persistedData.coins) : 0);
                this.currencyManager.setCoins(player, coins);
            }
            
    }

    getState(player: Player) {
        return this.states.get(player);
    }

    async cleanup(player: Player) {
        // Save player data before cleanup
        await this.savePlayerData(player);
        
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

    removeInventoryItem(player: Player, itemId: string) {
        return this.inventoryManager.removeItem(player, itemId);
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
        if (!state) return false;

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
        
        // Create a deep copy of the rod metadata to avoid modifying the catalog
        const rodMetadata = JSON.parse(JSON.stringify(rod.metadata || {}));
        
        // Initialize rod health and damage
        if (!rodMetadata.rodStats) {
            rodMetadata.rodStats = {};
        }
        rodMetadata.rodStats.health = 100;
        rodMetadata.rodStats.damage = rod.metadata?.rodStats?.damage ?? 1;
        
        console.log(`Initialized new rod with health: ${rodMetadata.rodStats.health}, damage: ${rodMetadata.rodStats.damage}`);
        
        // Add rod to inventory with initialized metadata
        this.inventoryManager.addItem(player, {
            id: rod.id,
            modelId: rod.modelId,
            sprite: rod.sprite,
            name: rod.name,
            type: 'rod',
            rarity: rod.rarity,
            value: rod.value,
            quantity: 1,
            metadata: rodMetadata
        });
        
        this.inventoryManager.equipItem(player, rod.id);
        this.sendGameMessage(player, `Successfully purchased ${rod.name}!`);

        player.ui.sendData({
            type: 'hideRodStore',
        });
        console.log(`Successfully purchased ${rod.name}!`);
        return true;
    }

    private initializeDevState(player: Player) {
        // Set to max level with 0 XP
       // this.levelingSystem.setPlayerLevel(player, 20, 0);

        // Add all rods from catalog
        FISHING_RODS.forEach(rod => {
            this.addInventoryItem(player, { ...rod, quantity: 1 });
        });

        // Set best rod (Hytopian Rod) as equipped
        this.inventoryManager.equipItem(player, 'hytopian_rod');
    }

    public initDevMode(player: Player) {
        this.initializeDevState(player);
    }

    /**
     * Apply damage to a player's fishing rod
     * @param player The player
     * @param rodId The rod ID to damage
     * @param damageAmount Optional custom damage amount
     * @returns true if successful
     */
    applyRodDamage(player: Player, rodId: string, damageAmount?: number): boolean {
        return this.inventoryManager.applyRodDamage(player, rodId, damageAmount, this);
    }

    // Add a method to save player data
    async savePlayerData(player: Player) {
        console.log(`[PlayerStateManager] savePlayerData called, DEVELOPMENT_MODE: ${CONFIG.DEVELOPMENT_MODE}`);
        
        if (CONFIG.DEVELOPMENT_MODE) {
            console.log('[PlayerStateManager] DEVELOPMENT_MODE is true, skipping save');
            return;
        }
        
        // Check if saving is disabled
        if (!CONFIG.SAVE_PLAYER_DATA) {
            console.log(`[SAVE] Saving disabled in config, skipping save for player ${player.id}`);
            return;
        }
        try {
            // Get inventory data
            const state = this.getState(player);
            const inventory = this.getInventory(player);
            
            // VALIDATION: Check that required data exists
            if (!state) {
                console.error(`[SAVE] Cannot save - player state is missing for ${player.id}`);
                return;
            }
            
            if (!inventory) {
                console.error(`[SAVE] Cannot save - inventory is missing for ${player.id}`);
                return;
            }
            
            // VALIDATION: Check that critical values are valid
            if (typeof this.levelingSystem.getCurrentLevel(player) !== 'number' || this.levelingSystem.getCurrentLevel(player) < 0) {
                console.error(`[SAVE] Cannot save - invalid level value for ${player.id}`);
                return;
            }
            
            if (!Array.isArray(inventory.items)) {
                console.error(`[SAVE] Cannot save - invalid inventory structure for ${player.id}`);
                return;
            }
            console.log(`[SAVE] Player ${player.id} inventory before saving:`, 
                JSON.stringify({
                    itemCount: inventory?.items?.length || 0,
                    itemIds: inventory?.items?.map(i => i.id) || [],
                    equippedRod: inventory?.equippedRod,
                    equippedBait: inventory?.equippedBait,
                    equippedFish: inventory?.equippedFish
                }, null, 2));
            
            const dataToSave = {
                inventory: inventory,
                level: this.levelingSystem.getCurrentLevel(player),
                xp: this.levelingSystem.getCurrentXP(player),
                coins: this.currencyManager.getCoins(player)
            };
            
            // Save to player's persisted data
            await player.setPersistedData(dataToSave);
            
            // Also save to global storage for cross-session access
            const globalKey = `player-data-${player.id}`;
            await PersistenceManager.instance.setGlobalData(globalKey, dataToSave);
            
            // Verify the data was saved correctly
            try {
                const savedData = await PersistenceManager.instance.getGlobalData(globalKey);
                console.log(`[SAVE] Verified saved data for ${globalKey}:`, 
                    JSON.stringify({
                        itemCount: (savedData?.inventory as any)?.items?.length || 0,
                        itemIds: (savedData?.inventory as any)?.items?.map((i: any) => i.id) || [],
                        equippedRod: (savedData?.inventory as any)?.equippedRod,
                        equippedBait: (savedData?.inventory as any)?.equippedBait,
                        equippedFish: (savedData?.inventory as any)?.equippedFish
                    }, null, 2));
            } catch (e) {
                console.error(`[SAVE] Failed to verify saved data:`, e);
            }
            
            // Also save a reference to this player as the most recent
            await PersistenceManager.instance.setGlobalData("mostRecentPlayer", { id: player.id, timestamp: Date.now() });
            
            console.log(`[SAVE] Data saved for player ${player.id}`);
            
            // For debugging: write directly to the file system to ensure it's saved
            try {
                const fs = require('fs');
                const path = require('path');
                const persistenceDir = path.join(process.cwd(), 'dev', 'persistence');
                
                if (!fs.existsSync(persistenceDir)) {
                    fs.mkdirSync(persistenceDir, { recursive: true });
                }
                
                const filePath = path.join(persistenceDir, `player-${player.id}.json`);
                fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
                console.log(`[SAVE] Directly wrote data to file: ${filePath}`);
            } catch (e) {
                console.error(`[SAVE] Failed to write directly to file:`, e);
            }
        } catch (e) {
            console.error("[SAVE] Error saving player data:", e);
        }
    }

    private createDefaultState(): PlayerState {
        return {
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
                    currentCatch: null,
                    time: 0,
                    amplitude: 0.5,
                    frequency: 0.05,
                    basePosition: 0.5
                },
            },
            merchant: {
                isInteracting: false,
                currentMerchant: null,
                selectedOption: null,
                merchantResponse: "",
                catchOfTheDay: null
            },
            swimming: {
                isSwimming: false,
                breath: 100.00
            }
        };
    }

    async printAllPersistedData() {
        try {
            const fs = require('fs');
            const path = require('path');
            const persistenceDir = path.join(process.cwd(), 'dev', 'persistence');
            
            console.log("\n=== PERSISTED DATA SUMMARY ===");
            
            if (fs.existsSync(persistenceDir)) {
                const files = fs.readdirSync(persistenceDir)
                    .filter((file: string) => file.endsWith('.json'));
                
                if (files.length === 0) {
                    console.log("No persisted data files found.");
                    return;
                }
                
                console.log(`Found ${files.length} persisted data files:`);
                
                // Sort files by modification time (newest first)
                const sortedFiles = files.map((file: string) => ({
                    file,
                    mtime: fs.statSync(path.join(persistenceDir, file)).mtime
                }))
                .sort((a: { mtime: Date }, b: { mtime: Date }) => b.mtime.getTime() - a.mtime.getTime());
                
                for (const {file, mtime} of sortedFiles) {
                    const filePath = path.join(persistenceDir, file);
                    const fileData = fs.readFileSync(filePath, 'utf8');
                    let data;
                    
                    try {
                        data = JSON.parse(fileData);
                    } catch (e) {
                        console.log(`${file}: Invalid JSON`);
                        continue;
                    }
                    
                    const lastModified = new Date(mtime).toLocaleString();
                    
                    console.log(`\n${file} (Last modified: ${lastModified}):`);
                    
                    // Print summary of data
                    if (file.startsWith('player-')) {
                        // For player data files
                        const inventory = data.inventory?.items?.length || 0;
                        const level = data.level || 'N/A';
                        const xp = data.xp || 'N/A';
                        const coins = data.coins || 'N/A';
                        
                        console.log(`  Level: ${level}`);
                        console.log(`  XP: ${xp}`);
                        console.log(`  Coins: ${coins}`);
                        console.log(`  Inventory items: ${inventory}`);
                    } else if (file === 'lastActivePlayer.json') {
                        // For last active player file
                        console.log(`  Last active player: ${JSON.stringify(data)}`);
                    } else {
                        // For other global data files
                        console.log(`  Data: ${JSON.stringify(data).substring(0, 100)}${JSON.stringify(data).length > 100 ? '...' : ''}`);
                    }
                }
            } else {
                console.log("Persistence directory not found at:", persistenceDir);
            }
            
            console.log("\n=== END OF PERSISTED DATA SUMMARY ===");
        } catch (e) {
            console.error("Error printing persisted data:", e);
        }
    }

}



