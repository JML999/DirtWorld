import { Player, World, Entity } from 'hytopia';
import type { InventoryItem, PlayerInventory } from './Inventory';
import { FISHING_RODS } from './RodCatalog';
import { PlayerStateManager } from '../PlayerStateManager';
import { FISH_CATALOG } from '../Fishing/FishCatalog';

export class InventoryManager {
    private world: World;
    private inventories: Map<string, PlayerInventory> = new Map();
    private equippedRodEntities: Map<string, Entity> = new Map();
    private equippedFishEntities: Map<string, Entity> = new Map();
    private currentRodEntity: Map<string, Entity> = new Map();
    private rodOperationInProgress: Map<string, boolean> = new Map(); // Track ongoing operations
    private rodOperationTimeout: Map<string, ReturnType<typeof setTimeout>> = new Map();

    constructor(world: World) {
        this.world = world;
    }

    initializePlayerInventory(player: Player) {
        const startingInventory: PlayerInventory = {
            items: [],
            maxSlots: 20,
        };
        this.inventories.set(player.id, startingInventory);
        
        // Send initial inventory state to UI
        this.updateInventoryUI(player);
    }

    isFishEquipped(player: Player, fishItem: InventoryItem): boolean {
        const hasEquippedEntity = this.equippedFishEntities.has(player.id);
        const inventory = this.getInventory(player);
        const isMarkedEquipped = inventory?.items.some(item => 
            item.id === fishItem.id && item.equipped
        ) ?? false;  // Add null coalescing operator
        return hasEquippedEntity && isMarkedEquipped;
    }

    addItem(player: Player, item: InventoryItem): boolean {
        console.log(`[Server] Adding item to inventory: ${item.id}, type: ${item.type}`);
        
        const inventory = this.inventories.get(player.id);
        if (!inventory) {
            console.error(`[Server] No inventory found for player ${player.id}`);
            return false;
        }

        if (inventory.items.length >= inventory.maxSlots) {
            console.log(`[Server] Inventory full for player ${player.id}`);
            return false; // Inventory full
        }

        // Check for existing item stack
        const existingItem = inventory.items.find(i => i.id === item.id);
        if (existingItem) {
            console.log(`[Server] Increasing quantity of existing item: ${item.id}`);
            existingItem.quantity += item.quantity;
        } else {
            console.log(`[Server] Adding new item: ${item.id}`);
            inventory.items.push(item);
        }

        this.updateInventoryUI(player);
        console.log(`[Server] Inventory updated, new count: ${inventory.items.length}`);
        return true;
    }

    removeItem(player: Player, itemId: string, quantity: number = 1): boolean {
        const inventory = this.inventories.get(player.id);
        if (!inventory) return false;

        const itemIndex = inventory.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return false;

        const item = inventory.items[itemIndex];
        const isBait = item.type === 'bait';
        if (item.quantity <= quantity) {
                           // Special bait UI reset if we removed bait
                           if (isBait) {
                            player.ui.sendData({
                                type: "resetBaitHighlights",
                                equipped: item.id
                            });
                        }
            inventory.items.splice(itemIndex, 1);
        } else {
            item.quantity -= quantity;
        }

        this.updateInventoryUI(player);

        return true;
    }

    public cleanup(player: Player) {
        // Clear any pending timeouts
        const existingTimeout = this.rodOperationTimeout.get(player.id);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        this.safeCleanupRodEntity(player);
        this.rodOperationInProgress.delete(player.id);
        this.rodOperationTimeout.delete(player.id);

        const inventory = this.getInventory(player);
        if (inventory) {
            // Create a copy of items array since we'll be modifying it during iteration
            const items = [...inventory.items];
            
            // Remove each item individually to trigger UI updates
            items.forEach(item => {
                item.equipped = false;
                this.removeItem(player, item.id, item.quantity);
                
            });
            
            // Force final UI update
            this.updateInventoryUI(player);
        }
    }

    equipItem(player: Player, itemId: string): boolean {
        const inventory = this.inventories.get(player.id);
        if (!inventory) return false;

        const item = inventory.items.find(i => i.id === itemId);
        if (!item) return false;
        console.log("equipping item", item);


        // If clicking an already equipped fish, unequip it
        if (item.type === 'fish' && item.equipped) {
            console.log("unequipping fish", item.id, item.type);
            this.unequipItem(player, item.type);
            inventory.equippedFish = undefined;
            const entity = this.equippedFishEntities.get(player.id);
            if (entity) {
                console.log("despawning fish", entity);
                entity.despawn();
                this.equippedFishEntities.delete(player.id);
            }
            item.equipped = false;
            this.updateInventoryUI(player);
            return true;
        }

        if (item.type === 'fish' ) {
            const fishEntity = this.equippedFishEntities.get(player.id);
            if (fishEntity) {
                fishEntity.despawn();
                this.equippedFishEntities.delete(player.id);
            }
        }

        // Unequip any currently equipped items of the same type
        inventory.items.forEach(i => {
            if (i.type === item.type) {
                i.equipped = false;
                this.unequipItem(player, i.type);
            }
        });

        // Handle rod equipment
        if (item.type === 'rod') {
            this.equipRod(player, item);
        } else if (item.type === 'fish') {
            let e = this.displayFish(player, item);
            this.equippedFishEntities.set(player.id, e);
        } else if (item.type === 'bait') {
            this.equipBait(player, item);
        }

        // Equip the new item
        item.equipped = true;

        // Update equipped item references
        if (item.type === 'rod') {
            inventory.equippedRod = itemId;
        } else if (item.type === 'bait') {
            inventory.equippedBait = itemId;
            this.hookBait(player, itemId);
        } else if (item.type === 'fish') {
            inventory.equippedFish = itemId;
        }   
        this.updateInventoryUI(player);
        return true;
    }

    equipBait(player: Player, item: InventoryItem){
        this.hookBait(player, item.id);
    }

    private async equipRod(player: Player, item: InventoryItem): Promise<boolean> {
        // Prevent concurrent rod operations
        if (this.rodOperationInProgress.get(player.id)) {
            console.log('Rod operation already in progress, skipping');
            return false;
        }

        try {
            this.rodOperationInProgress.set(player.id, true);

            // Clear any pending timeouts
            const existingTimeout = this.rodOperationTimeout.get(player.id);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            // Clean up existing rod with verification
            await this.safeCleanupRodEntity(player);

            // Create new rod entity with verification
            const rodEntity = new Entity({
                name: 'fishingRod',
                tag: 'fishingRod',
                modelUri: `models/items/${item.modelId}.gltf`,
                parent: this.world.entityManager.getPlayerEntitiesByPlayer(player)[0],
                parentNodeName: 'hand_right_anchor',
                modelScale: item.metadata.rodStats?.custom ? 5 : 1,
            });

            // Verify entity creation was successful
            if (!rodEntity) {
                throw new Error('Failed to create rod entity');
            }

            const rotation = item.metadata.rodStats?.custom 
                ? { x: 0, y: 0, z: 0, w: 1 }
                : { x: -0.3826834, y: 0, z: 0, w: 0.9238795 }; // ~45 degrees instead of ~90

            await rodEntity.spawn(this.world, { x: 0, y: 0, z: 0 }, rotation);
            
            // Set a timeout to clear the operation lock
            const timeout = setTimeout(() => {
                this.rodOperationInProgress.set(player.id, false);
                this.rodOperationTimeout.delete(player.id);
            }, 1000); // 500ms safety buffer

            this.rodOperationTimeout.set(player.id, timeout);
            this.currentRodEntity.set(player.id, rodEntity);

            return true;
        } catch (error) {
            console.error('Error during rod equipment:', error);
            this.rodOperationInProgress.set(player.id, false);
            return false;
        }
    }

    private async safeCleanupRodEntity(player: Player): Promise<void> {
        try {
            const existingRod = this.currentRodEntity.get(player.id);
            if (existingRod && existingRod.id && this.world.entityManager.getEntity(existingRod.id)) {
                await existingRod.despawn();
            }
            this.currentRodEntity.delete(player.id);
        } catch (error) {
            console.error('Error during rod cleanup:', error);
            // Force cleanup of references even if despawn fails
            this.currentRodEntity.delete(player.id);
        }
    }

    getEquippedFish(player: Player): InventoryItem | null {
        const hasEquippedEntity = this.equippedFishEntities.has(player.id);
        if (!hasEquippedEntity) return null;

        const inventory = this.getInventory(player);
        return inventory?.items.find(item => item.equipped && item.type === 'fish') || null;
    }

    hookBait(player: Player, itemId: string): boolean {
        const inventory = this.inventories.get(player.id);
        if (!inventory) return false;
        const item = inventory.items.find(i => i.id === itemId);
        if (!item || !item.metadata.fishStats) return false;
        this.updateInventoryUI(player);
        return true;
    }

    checkBait(player: Player): {hasBait: boolean, item: InventoryItem | null} {
        const inventory = this.inventories.get(player.id);
        if (!inventory) return {hasBait: false, item: null};
        for (const item of inventory.items) {
            if (item.type === 'bait' && item.equipped) {
                return {hasBait: true, item: item};
            }
        }
        return {hasBait: false, item: null};
    }

    displayFish(player: Player, item: InventoryItem): Entity {
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0];
        // Create display entity
        const defaultEntity = new Entity({
            name: 'displayFish',
            modelUri: item.modelId,
            modelScale: 1,
            modelLoopedAnimations: ['swim'],
            parent: playerEntity,
        });
        const fishData = FISH_CATALOG.find(f => f.name === item.name);
        if (!fishData) {return defaultEntity};
        if (!item.metadata?.fishStats || !fishData) {return defaultEntity};
        // Calculate display scale
        const weightRatio = (item.metadata.fishStats.weight - fishData.minWeight) / (fishData.maxWeight - fishData.minWeight);
        const scaleMultiplier = fishData.modelData.baseScale + 
            (weightRatio * (fishData.modelData.maxScale - fishData.modelData.baseScale));
        const displayEntity = new Entity({
            name: 'displayFish',
            modelUri: item.modelId,
            modelScale: scaleMultiplier,
            modelLoopedAnimations: ['swim'],
            parent: playerEntity,
        });
        
        displayEntity.spawn(this.world, { x: 0, y: 2.2, z: 0 });
        displayEntity.setAngularVelocity({ x: 0, y: Math.PI / 1.5, z: 0 });
        this.equippedFishEntities.set(player.id, displayEntity);
        return displayEntity;
    }

    useBait(player: Player, itemId: string): boolean {
        const inventory = this.inventories.get(player.id);
        if (!inventory) return false;

        const item = inventory.items.find(i => i.id === itemId);
        if (!item) return false;

        this.removeItem(player, itemId, 1); 
        this.updateInventoryUI(player);
        return true;
    }

    unequipItem(player: Player, type: string): boolean {
        // Prevent unequip if operation in progress
        if (type === 'rod' && this.rodOperationInProgress.get(player.id)) {
            console.log('Rod operation in progress, skipping unequip');
            return false;
        }

        const inventory = this.inventories.get(player.id);
        if (!inventory) return false;

        const equippedItem = inventory.items.find(item => item.type === type && item.equipped);
        if (equippedItem) {
            equippedItem.equipped = false;
            
            if (type === 'rod') {
                this.safeCleanupRodEntity(player);
            } else if (type === 'fish') {
                const fishEntity = this.equippedFishEntities.get(player.id);
                if (fishEntity) {
                    fishEntity.despawn();
                    this.equippedFishEntities.delete(player.id);
                    
                }
            }

            this.updateInventoryUI(player);
            return true;
        }
        return false;
    }

    getInventory(player: Player): PlayerInventory | undefined {
        return this.inventories.get(player.id);
    }

    updateInventoryUI(player: Player) {
        const inventory = this.inventories.get(player.id);
        if (!inventory) return;

        player.ui.sendData({
            type: "inventoryUpdate",
            inventory: inventory
        });
    }

    setEquippedRodEntity(player: Player, entity: Entity) {
        this.equippedRodEntities.set(player.id, entity);
    }

    getEquippedRod(player: Player) {
        const inventory = this.getInventory(player);
        return inventory?.items.find(item => 
            item.type === 'rod' && item.equipped
        );
    }

    public addRodById(player: Player, rodId: string) {
        const rod = FISHING_RODS.find(r => r.id === rodId);
        if (rod) {
            this.addItem(player, rod);
        } else {
            console.warn(`Rod with id ${rodId} not found`);
        }
    }

    // Helper method to check rod entity state
    isRodEntityValid(player: Player): boolean {
        const rodEntity = this.currentRodEntity.get(player.id);
        return !!(rodEntity?.id && this.world.entityManager.getEntity(rodEntity.id));
    }

    public hasItem(player: Player, itemId: string): boolean {
        const inventory = this.getInventory(player);
        if (!inventory) return false;
        return inventory.items.some(item => item.id === itemId && item.quantity > 0);
    }

    /**
     * Apply damage to a fishing rod
     * @param player The player who owns the rod
     * @param rodId The ID of the rod to damage
     * @param damageAmount Amount of damage to apply (defaults to rod's damage stat)
     * @returns true if successful, false otherwise
     */
    applyRodDamage(player: Player, rodId: string, damageAmount?: number, playerStateManager?: PlayerStateManager): boolean {
        const inventory = this.inventories.get(player.id);
        if (!inventory) return false;

        const rod = inventory.items.find(item => item.id === rodId && item.type === 'rod');
        if (!rod) return false;

        // Get rod stats
        const rodStats = rod.metadata?.rodStats;
        if (!rodStats) return false;

        // Initialize health if not present
        if (rodStats.health === undefined) {
            rodStats.health = 100; // Default health
        }

        // Use rod's own damage stat if no amount specified
        const damage = damageAmount ?? rodStats.damage ?? 1;
        
        // Apply damage
        rodStats.health = Math.max(0, rodStats.health - damage);
        
        // Check if rod is broken
        if (rodStats.health <= 0) {
            // Rod is broken - remove it from inventory
            this.unequipItem(player, 'rod');
            this.removeItem(player, rodId);
            
            // Notify player
            player.ui.sendData({
                type: 'gameMessage',
                message: `Your ${rod.name} has broken!`
            });
            
            return true;
        }
        
        // Update UI if health is low
        if (rodStats.health <= 20) {
            playerStateManager?.sendGameMessage(player, `Your ${rod.name} is badly damaged (${rodStats.health}% health remaining)!`);
        } else if (rodStats.health <= 50) {
            playerStateManager?.sendGameMessage(player, `Your ${rod.name} is showing signs of wear (${rodStats.health}% health remaining).`);
        }
        
        // Update inventory UI
        this.updateInventoryUI(player);
        
        return true;
    }

    loadInventory(player: Player, inventory: any) {
        console.log(`[INVENTORY] Loading inventory for player ${player.id}`);
        
        // Log the incoming inventory data
        console.log(`[INVENTORY] Raw inventory data:`, JSON.stringify(inventory, null, 2));
        
        // Check if inventory has the expected structure
        if (!inventory.items) {
            console.warn(`[INVENTORY] Missing items array in inventory data`);
            inventory.items = [];
        }
        
        if (!inventory.equippedItems) {
            console.warn(`[INVENTORY] Missing equippedItems object in inventory data`);
            inventory.equippedItems = {};
        }
        
        // Create a deep copy to avoid reference issues
        const playerInventory: PlayerInventory = {
            items: JSON.parse(JSON.stringify(inventory.items)),
            maxSlots: 20,
            equippedBait: inventory.equippedBait ? JSON.parse(JSON.stringify(inventory.equippedBait)) : undefined,
            equippedFish: inventory.equippedFish ? JSON.parse(JSON.stringify(inventory.equippedFish)) : undefined,
            equippedRod: inventory.equippedRod ? JSON.parse(JSON.stringify(inventory.equippedRod)) : undefined
        };
        
        // Set the player's inventory in the map
        this.inventories.set(player.id, playerInventory);
        
        // Log the inventory after setting
        console.log(`[INVENTORY] Inventory map after loading:`, 
            JSON.stringify({
                itemCount: playerInventory.items.length,
                itemIds: playerInventory.items.map(i => i.id),
                equippedBait: playerInventory.equippedBait,
                equippedFish: playerInventory.equippedFish,
                equippedRod: playerInventory.equippedRod
            }, null, 2));
        
        // Re-equip items if they were equipped
        if (inventory.equippedItems) {
            Object.entries(inventory.equippedItems).forEach(([_, itemId]) => {
                if (itemId) {
                    const item = inventory.items.find((i: InventoryItem) => i.id === itemId);
                    if (item) {
                        console.log(`[INVENTORY] Re-equipping item: ${item.id}`);
                        this.equipItem(player, item.id);
                    }
                }
            });
        }
        
        // Update UI
        this.updateInventoryUI(player);
        console.log(`[INVENTORY] UI updated for player ${player.id}`);
    }

}