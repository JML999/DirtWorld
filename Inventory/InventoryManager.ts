import { Player, World, Entity } from 'hytopia';
import type { InventoryItem, PlayerInventory } from './Inventory';

export class InventoryManager {
    private world: World;
    private inventories: Map<string, PlayerInventory> = new Map();
    private equippedRodEntities: Map<string, Entity> = new Map();

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

    addItem(player: Player, item: InventoryItem): boolean {
        const inventory = this.inventories.get(player.id);
        if (!inventory) return false;

        if (inventory.items.length >= inventory.maxSlots) {
            return false; // Inventory full
        }

        // Check for existing item stack
        const existingItem = inventory.items.find(i => i.id === item.id);
        if (existingItem) {
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
        if (item.quantity <= quantity) {
            inventory.items.splice(itemIndex, 1);
        } else {
            item.quantity -= quantity;
        }

        this.updateInventoryUI(player);
        return true;
    }

    equipItem(player: Player, itemId: string): boolean {
        const inventory = this.inventories.get(player.id);
        if (!inventory) return false;

        const item = inventory.items.find(i => i.id === itemId);
        if (!item) return false;

        // Handle rod equipment
        if (item.type === 'rod') {
            // Get old rod entity
            const oldRodEntity = this.equippedRodEntities.get(player.id);
            if (oldRodEntity) {
                oldRodEntity.despawn();
            }

            // Create new rod entity
            const newRodEntity = new Entity({
                name: 'fishingRod',
                modelUri: `models/items/${item.modelId}.gltf`,
                parent: this.world.entityManager.getPlayerEntitiesByPlayer(player)[0],
                parentNodeName: 'hand_right_anchor',
            });

            newRodEntity.spawn(
                this.world,
                { x: 0, y: 0, z: 0 },  // position
                { x: 0, y: 0, z: 0, w: 1 }  // rotation
            );

            this.equippedRodEntities.set(player.id, newRodEntity);
            console.log(newRodEntity.name);
            console.log("added");
        }

        // Unequip any currently equipped items of the same type
        inventory.items.forEach(i => {
            if (i.type === item.type) {
                i.equipped = false;
            }
        });

        // Equip the new item
        item.equipped = true;

        // Update equipped item references
        if (item.type === 'rod') {
            inventory.equippedRod = itemId;
        } else if (item.type === 'bait') {
            inventory.equippedBait = itemId;
        }

        this.updateInventoryUI(player);
        return true;
    }

    unequipItem(player: Player, type: string): boolean {
        const inventory = this.inventories.get(player.id);
        if (!inventory) return false;

        const equippedItem = inventory.items.find(item => item.type === type && item.equipped);
        if (equippedItem) {
            equippedItem.equipped = false;
            
            // Remove rod entity if it's a fishing rod
            if (type === 'rod') {
                const rodEntity = this.equippedRodEntities.get(player.id);
                if (rodEntity) {
                    rodEntity.despawn();
                    this.equippedRodEntities.delete(player.id);
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

    private updateInventoryUI(player: Player) {
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
}