import { Player, World, Entity } from 'hytopia';
import type { InventoryItem, PlayerInventory } from './Inventory';
import { FISHING_RODS } from './RodCatalog';

export class InventoryManager {
    private world: World;
    private inventories: Map<string, PlayerInventory> = new Map();
    private equippedRodEntities: Map<string, Entity> = new Map();
    private equippedFishEntities: Map<string, Entity> = new Map();
    private currentRodEntity: Map<string, Entity> = new Map();
    private rodOperationInProgress: Map<string, boolean> = new Map(); // Track ongoing operations
    private rodOperationTimeout: Map<string, ReturnType<typeof setTimeout>> = new Map(); // Track timeouts

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
        const inventory = this.inventories.get(player.id);
        if (!inventory) return false;

        if (inventory.items.length >= inventory.maxSlots) {
            return false; // Inventory full
        }

        // Check for existing item stack
        const existingItem = inventory.items.find(i => i.id === item.id);
        if (existingItem ) {
            existingItem.quantity += item.quantity;
        } else {
            inventory.items.push(item);
        }

        this.updateInventoryUI(player);
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

        // If clicking an already equipped fish, unequip it
        if (item.type === 'fish' && item.equipped) {
            this.unequipItem(player, item.type);
            inventory.equippedFish = undefined;
            const entity = this.equippedFishEntities.get(player.id);
            if (entity) {
                entity.despawn();
                this.equippedFishEntities.delete(player.id);
            }
            item.equipped = false;
            this.updateInventoryUI(player);
            return true;
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

    async equipRod(player: Player, item: InventoryItem): Promise<boolean> {
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
                : { x: -0.7071068, y: 0, z: 0, w: 0.7071068 };

            await rodEntity.spawn(this.world, { x: 0, y: 0, z: 0 }, rotation);
            
            // Set a timeout to clear the operation lock
            const timeout = setTimeout(() => {
                this.rodOperationInProgress.set(player.id, false);
                this.rodOperationTimeout.delete(player.id);
            }, 500); // 500ms safety buffer

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

        for (const item of inventory.items) {
            if (item.metadata.fishStats?.baited) {
               item.metadata.fishStats.baited = false;
            }
        }
        const item = inventory.items.find(i => i.id === itemId);
        if (!item || !item.metadata.fishStats) return false;

        item.metadata.fishStats.baited = true;

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
        const displayEntity = new Entity({
            name: 'displayFish',
            modelUri: item.modelId,
            modelScale: 1,
            modelLoopedAnimations: ['swim'],
            parent: playerEntity,
        });
        
        displayEntity.spawn(this.world, { x: 0, y: 2.2, z: 0 });
        displayEntity.setAngularVelocity({ x: 0, y: Math.PI / 1.5, z: 0 });
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
}