import { Player, Vector3, World, Entity } from "hytopia";
import { BAIT_CATALOG, BaitService } from "../Bait/BaitCatalog";
import { OCEAN_ZONE, GEOGRAPHIC_ZONES, LOCAL_ZONES } from "./FishingZones";
import type { FishingZone } from "./FishingZones";
import { PlayerStateManager } from '../PlayerStateManager';
import type { InventoryItem } from "../Inventory/Inventory";
import type { GamePlayerEntity } from "../GamePlayerEntity";
import { ITEM_CATALOG } from '../Crafting/ItemCatalog';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'rod' | 'bait' | 'fish' | 'boat' | 'accessory' |'item';

export interface LootItem {
    id: string;
    name: string;
    quantity: number;
    value: number;
}

type LootTable = Array<{
    id: string;
    chance: number;
    quantityRange: [number, number]; // [min, max]
}>;

export class FishLootManager {
    private lootTables: Record<string, LootTable> = {};
    private world: World;
    private playerStateManager: PlayerStateManager;
    
    constructor(world: World, playerStateManager: PlayerStateManager) {
        this.world = world;
        this.playerStateManager = playerStateManager;
        this.initializeLootTables();
    }
    
    private initializeLootTables() {
        // Define loot tables for different zones
        this.lootTables = {
            // Ocean zone loot table
            'ocean': [
                { id: 'Seaweed', chance: 30, quantityRange: [1, 3] },
                { id: 'bait_raw_shrimp', chance: 40, quantityRange: [1, 1] },
                { id: 'trash', chance: 10, quantityRange: [1, 1] },
                { id: 'fish_head', chance: 40, quantityRange: [1, 1] },
            ],
            'pier': [
                { id: 'Seaweed', chance: 40, quantityRange: [1, 3] },
                { id: 'bait_raw_shrimp', chance: 40, quantityRange: [1, 1] },
                { id: 'trash', chance: 20, quantityRange: [1, 1] },
                { id: 'fish_head', chance: 20, quantityRange: [1, 1] },
            ],
            'default': [
                { id: 'Seaweed', chance: 40, quantityRange: [1, 3] },
                { id: 'bait_raw_shrimp', chance: 40, quantityRange: [1, 1] },
                { id: 'trash', chance: 20, quantityRange: [1, 1] },
                { id: 'fish_head', chance: 20, quantityRange: [1, 1] },
            ]
        };
        
        console.log('Loot tables initialized:', Object.keys(this.lootTables));
    }
    
    /**
     * Roll for loot when a fish isn't caught
     * @param zoneId The current fishing zone
     * @param player The player fishing
     * @returns A loot item if successful, null otherwise
     */
    public rollForLoot(zoneId: string, player: Player): LootItem | null {
        // Get the loot table for the zone
        const lootTable = this.lootTables[zoneId] || this.lootTables['default'];
        
        console.log(`Rolling for loot in zone ${zoneId}, found table: ${lootTable ? 'yes' : 'no'}`);
        
        if (!lootTable || lootTable.length === 0) {
            console.log(`No loot table found for zone ${zoneId}`);
            return null;
        }
        // Calculate total chance
        let totalChance = 0;
        for (const entry of lootTable) {
            totalChance += entry.chance;
        }
        const roll = Math.random() * totalChance;
        console.log(`Loot roll: ${roll}, total chance: ${totalChance}`);
        let currentChance = 0;
        for (const entry of lootTable) {
            currentChance += entry.chance;
            if (roll < currentChance) {
                const quantity = Math.floor(Math.random() * 
                    (entry.quantityRange[1] - entry.quantityRange[0] + 1)) + 
                    entry.quantityRange[0];
                
                console.log(`Selected loot: ${entry.id} (${quantity})`);
                
                return {
                    id: entry.id,
                    name: entry.id.replace('bait_', '').replace(/_/g, ' '),
                    quantity: quantity,
                    value: 1
                };
            }
        }
        
        console.log('No loot selected');
        return null;
    }
    
    /**
     * Add loot to player's inventory
     * @param player The player to receive the loot
     * @param loot The loot item to add
     */
    public addLootToInventory(player: Player, loot: LootItem): void {
        if (loot.id === 'trash') {
            console.log(`Not adding trash to inventory`);
            this.playerStateManager.sendGameMessage(player, `You hooked some trash. You threw it away.`);
            return;
        }
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0] as GamePlayerEntity;
        
        // First, determine if this is a regular item or a bait item
        // Check if it exists in the FISH_CATALOG (regular items)
        const regularItem = ITEM_CATALOG.find(item => 
            item.id.toLowerCase() === loot.id.toLowerCase() || 
            item.name.toLowerCase() === loot.name.toLowerCase()
        );
        
        // Check if it exists in the BAIT_CATALOG (bait items)
        const baitKey = Object.keys(BAIT_CATALOG).find(key => 
            key.toLowerCase() === loot.id.toLowerCase() || 
            BAIT_CATALOG[key].name.toLowerCase() === loot.name.toLowerCase() ||
            BAIT_CATALOG[key].id.toLowerCase() === loot.id.toLowerCase()
        );
        
        console.log(`Processing loot: ${loot.id} (${loot.name})`);
        console.log(`Found in regular items: ${!!regularItem}, Found in bait: ${!!baitKey}`);
        
        // Handle regular items
        if (regularItem) {
            console.log(`Adding regular item: ${regularItem.name}`);
            console.log(`Description: ${regularItem.description}`);
            console.log(`Model URI from catalog: ${regularItem.modelData.modelUri}`);
            
            const inventoryItem = {
                id: regularItem.id,
                name: regularItem.name,
                quantity: loot.quantity,
                value: regularItem.baseValue,
                sprite: regularItem.modelData.sprite,
                rarity: regularItem.rarity,
                modelId: regularItem.modelData.modelUri,
                type: 'item' as ItemType,
                description: regularItem.description,
                metadata: {}
            };
            
            
            console.log('Created inventory item with modelId:', inventoryItem.modelId);
            
            playerEntity.stateManager.addInventoryItem(player, inventoryItem);
            
            // Send message
            this.playerStateManager.sendGameMessage(
                player, 
                `You hooked a ${regularItem.name.toLowerCase()}! Item was added to your inventory.`
            );
        }
        // Handle bait items
        else if (baitKey) {
            console.log(`Adding bait item: ${BAIT_CATALOG[baitKey].name}`);
            const baitItem = BaitService.createBaitItem(BAIT_CATALOG[baitKey].id, loot.quantity);
            if (baitItem) {
                playerEntity.stateManager.addInventoryItem(player, baitItem);
                // Send message
                this.playerStateManager.sendGameMessage(
                    player, 
                    `You hooked a ${loot.quantity > 1 ? `${loot.quantity}x ${BAIT_CATALOG[baitKey].name}` : BAIT_CATALOG[baitKey].name}!`
                );
            } else {
                console.error(`Failed to create bait item for ID: ${loot.id}`);
            }
        }
        // Handle items that start with bait_ prefix but aren't in the catalog
        else if (loot.id.startsWith('bait_')) {
            console.log(`Adding bait item by prefix: ${loot.id}`);
            const baitItem = BaitService.createBaitItem(loot.id, loot.quantity);
            if (baitItem) {
                playerEntity.stateManager.addInventoryItem(player, baitItem);
                // Send message
                this.playerStateManager.sendGameMessage(
                    player, 
                    `You found ${loot.quantity > 1 ? `${loot.quantity}x ${loot.name}` : loot.name}!`
                );
            } else {
                console.error(`Failed to create bait item for ID: ${loot.id}`);
            }
        }
        // Unknown item type
        else {
            console.error(`Unknown item type for loot: ${loot.id} (${loot.name})`);
        }
    }

    /**
     * Display the loot item above the player
     * @param player The player who found the loot
     * @param loot The loot item to display
     */
    public displayLoot(player: Player, loot: LootItem): void {
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0];
        
        // Remove existing display items
        const existingDisplays = this.world.entityManager.getAllEntities().filter(
            entity => entity.name === 'displayLoot'
        );
        existingDisplays.forEach(entity => entity.despawn());

        // Get model URI based on loot type
        let modelUri = 'models/items/generic_item.gltf'; // Default model
        let modelScale = 1.0;
        let modelAnimation = null;
        
        // Check if this is a regular item from the item catalog
        const regularItem = ITEM_CATALOG.find(item => 
            item.id === loot.id || item.name === loot.name
        );
        
        if (regularItem && regularItem.modelData && regularItem.modelData.modelUri) {
            console.log(`Using model from item catalog: ${regularItem.modelData.modelUri}`);
            modelUri = regularItem.modelData.modelUri;
            modelScale = regularItem.modelData.baseScale || 1.0;
        }
        // For bait items, use their specific models
        else if (loot.id.startsWith('bait_')) {
            const baitId = loot.id.replace('bait_', '');
            const baitInfo = BAIT_CATALOG[baitId];
            
            if (baitInfo && baitInfo.modelId) {
                modelUri = baitInfo.modelId;
                
                // Set specific animations and scales for different bait types
                if (baitId === 'raw_shrimp') {
                    modelAnimation = '';
                    modelScale = 0.8;
                } else if (baitId === 'seaweed') {
                    modelAnimation = '';
                    modelScale = 1.2;
                }
            }
        }
        
        console.log(`Displaying loot with model: ${modelUri}`);
        
        // Create the display entity
        const displayEntity = new Entity({
            name: 'displayLoot',
            modelUri: modelUri,
            modelScale: modelScale,
            modelLoopedAnimations: modelAnimation ? [modelAnimation] : undefined,
            parent: playerEntity,
        });
        
        displayEntity.spawn(this.world, { x: 0, y: 2.2, z: 0 });
        displayEntity.setAngularVelocity({ x: 0, y: Math.PI / 2, z: 0 });

        // Rotate and float animation
        let startTime = Date.now();
        const duration = 3000;
        const baseY = 2.2;
        const floatHeight = 0.3;
        
        const animateInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                clearInterval(animateInterval);
                displayEntity.despawn();
                return;
            }
            
            // Rotate and float up and down
            displayEntity.rotation.y = progress * Math.PI * 2;
            displayEntity.position.y = baseY + Math.sin(progress * Math.PI * 2) * floatHeight;
        }, 16);
    }
}