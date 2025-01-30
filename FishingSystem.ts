import { Entity, Player, Vector3, World } from 'hytopia';
import { PIER_FISH_CATALOG } from './fishCatalog';
import type { FishData } from './fishCatalog';
import { InventoryManager } from './Inventory/InventoryManager';
import type { ItemRarity } from './Inventory/Inventory';
import type { LevelingSystem } from './LevelingSystem';

interface FishingSpot {
    position: Vector3;
    radius: number;
    name: string;
}

export class FishingSystem {
    private fishingSpots: FishingSpot[];
    private activeFishers = new Map<string, any>();
    private world: World;
    private inventoryManager: InventoryManager;
    private lastErrorMessageTime: Record<string, number> = {};
    private messageTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
    private levelingSystem: LevelingSystem;

    constructor(world: World, inventoryManager: InventoryManager, spots: FishingSpot[], levelingSystem: LevelingSystem) {
        this.world = world;
        this.inventoryManager = inventoryManager;
        this.fishingSpots = spots;
        this.levelingSystem = levelingSystem;
    }

    private selectFish(player: Player, depth: number): FishData | null {
        const roll = Math.random() * 100;
        let cumulativeChance = 0;

        // Get rod stats if equipped
        const rod = this.inventoryManager.getEquippedRod(player);
        const luckBonus = rod?.metadata?.rodStats?.luck || 1;

        for (const fish of PIER_FISH_CATALOG.fish) {
            cumulativeChance +=0.5;
            if (roll <= cumulativeChance) {
                return fish;
            }
        }
        return null;
    }

    private calculateFishRarity(fish: FishData, weight: number): ItemRarity {
        // Base score from fish's inherent rarity
        let rarityScore = 0;
        switch (fish.rarity) {
            case 'common': rarityScore = 1; break;
            case 'uncommon': rarityScore = 2; break;
            case 'rare': rarityScore = 3; break;
            case 'epic': rarityScore = 4; break;
            case 'legendary': rarityScore = 5; break;
        }

        // Weight score: how close to max weight?
        const weightRatio = (weight - fish.minWeight) / (fish.maxWeight - fish.minWeight);
        const weightScore = weightRatio * 3; // 0-3 points from weight

        // Combined score
        const totalScore = rarityScore + weightScore;

        // Convert total score to rarity
        if (totalScore >= 7) return 'legendary' as ItemRarity;
        if (totalScore >= 5) return 'epic' as ItemRarity;
        if (totalScore >= 3.5) return 'rare' as ItemRarity;
        if (totalScore >= 2) return 'uncommon' as ItemRarity;
        return 'common' as ItemRarity;
    }

    // Use in generateCatch:
    generateCatch(fish: FishData) {
        const weight = this.generateWeight(fish.minWeight, fish.maxWeight);
        const rarity = this.calculateFishRarity(fish, weight);
        const value = Math.floor(fish.baseValue * (weight / fish.minWeight) * (this.getRarityMultiplier(rarity)));

        // Generate a unique ID for each fish catch
        const uniqueId = `${fish.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        return {
            id: uniqueId,  // Use unique ID instead of just fish.id
            name: fish.name,
            rarity,
            weight,
            value
        };
    }

    private getRarityMultiplier(rarity: string): number {
        switch (rarity) {
            case "Legendary": return 5;
            case "Epic": return 3;
            case "Rare": return 2;
            case "Uncommon": return 1.5;
            default: return 1;
        }
    }

    private generateWeight(minWeight: number, maxWeight: number): number {
        const weight = minWeight + Math.random() * (maxWeight - minWeight);
        return Math.round(weight * 10) / 10;  // Round to 1 decimal place
    }

    public onCastAttempt(player: Player): void {
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0];
        const playerPos = Vector3.fromVector3Like(playerEntity.position);
        
        // Debug player position
        console.log("Player position:", {
            x: playerEntity.position.x,
            y: playerEntity.position.y,
            z: playerEntity.position.z
        });

        // Check if player has rod equipped
        const rod = this.inventoryManager.getEquippedRod(player);
        if (!rod) {
            player.ui.sendData({
                type: 'fishingStatus',
                message: 'You need to equip a fishing rod first!'
            });
            return;
        }    

        const spot = this.fishingSpots.find(spot => 
            Vector3.fromVector3Like(playerPos).distance(spot.position) <= spot.radius
        );

        if (!spot) {
            const now = Date.now();
            if (!this.lastErrorMessageTime[player.id] || now - this.lastErrorMessageTime[player.id] > 3000) {
                // Clear any existing message timeout
                if (this.messageTimeouts[player.id]) {
                    clearTimeout(this.messageTimeouts[player.id]);
                }

                player.ui.sendData({
                    type: "fishingStatus",
                    message: "Head to the pier to fish!"
                });
                this.lastErrorMessageTime[player.id] = now;

                // Store the timeout so we can clear it if needed
                this.messageTimeouts[player.id] = setTimeout(() => {
                    player.ui.sendData({
                        type: "fishingStatus",
                        message: null
                    });
                    delete this.messageTimeouts[player.id];
                }, 2000);
            }
            return;
        }

        // Clear any error message if it exists
        if (this.messageTimeouts[player.id]) {
            clearTimeout(this.messageTimeouts[player.id]);
            delete this.messageTimeouts[player.id];
        }

        // If already fishing, ignore
        if (this.activeFishers.has(player.id)) {
            return;
        }

        // Start fishing
        this.activeFishers.set(player.id, true);
        
        // Show panel with initial message
        player.ui.sendData({
            type: "fishingStatus",
            message: "Nice Cast!"
        });

        // After 2 seconds, update message
        setTimeout(() => {
            player.ui.sendData({
                type: "fishingStatus",
                message: "Waiting for a bite..."
            });
        }, 2000);

        // After fishing time (5 seconds total), show result
        setTimeout(() => {
            const selectedFish = this.selectFish(player, 0.33);
            if (selectedFish) {
                const catch_data = this.generateCatch(selectedFish);
                player.ui.sendData({
                    type: "fishingStatus",
                    message: `Caught a ${catch_data.rarity} ${catch_data.name} weighing ${catch_data.weight}lb!`
                });

                // Add to inventory and update UI
                this.inventoryManager.addItem(player, {
                    id: catch_data.id,
                    modelId: 'fish',
                    type: 'fish',
                    name: catch_data.name,
                    rarity: catch_data.rarity,
                    value: catch_data.value,
                    quantity: 1,
                    metadata: {
                        fishStats: {
                            weight: catch_data.weight,
                            size: 0,
                            species: catch_data.name
                        }
                    }
                });

                // Calculate and award XP for the catch
                const xpGained = this.levelingSystem.calculateFishXP({
                    ...catch_data,
                    minWeight: selectedFish.minWeight
                });
                this.levelingSystem.addXP(player, xpGained);

                // Send inventory update to UI
                player.ui.sendData({
                    type: 'inventoryUpdate',
                    inventory: this.inventoryManager.getInventory(player)
                });

                this.displayFish(player, catch_data);
            } else {
                player.ui.sendData({
                    type: "fishingStatus",
                    message: "The fish got away!"
                });
            }
            
            // Hide panel after showing result
            setTimeout(() => {
                player.ui.sendData({
                    type: "fishingStatus",
                    message: null
                });
                this.activeFishers.delete(player.id);
            }, 2000);
        }, 5000);
    }

    private isNearWater(position: Vector3): boolean {
        return this.fishingSpots.some(loc => 
            Vector3.fromVector3Like(position).distance(loc.position) <= loc.radius
        );
    }

    private displayFish(player: Player, fish: any) {
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0];
        
        // Remove any existing display fish
        const existingDisplays = this.world.entityManager.getAllEntities().filter(
            entity => entity.name === 'displayFish'
        );
        existingDisplays.forEach(entity => entity.despawn());

        // Get fish data from catalog
        const fishData = PIER_FISH_CATALOG.fish.find(f => f.name === fish.name);
        if (!fishData) return;

        // Calculate scale based on weight and fish type
        const weightRatio = (fish.weight - fishData.minWeight) / (fishData.maxWeight - fishData.minWeight);
        const scaleMultiplier = fishData.modelData.baseScale + 
            (weightRatio * (fishData.modelData.maxScale - fishData.modelData.baseScale));

        // Create new fish display with parent
        const displayEntity = new Entity({
            name: 'displayFish',
            modelUri: fishData.modelData.modelUri,
            modelScale: scaleMultiplier,
            modelLoopedAnimations: ['swim'],
            parent: playerEntity,
            rigidBodyOptions: {
                angularVelocity: { x: 0, y: Math.PI / 1.5, z: 0 }
            }
        });
        
        // Spawn at offset position
        displayEntity.spawn(this.world, { x: 0, y: 3, z: 0 });

        // Rotate 360 degrees over 3 seconds
        let startTime = Date.now();
        const duration = 3000;
        
        const rotateInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                clearInterval(rotateInterval);
                displayEntity.despawn();
                return;
            }

            // Rotate around Y axis
            displayEntity.rotation.y = progress * Math.PI * 2;
        }, 16); // ~60fps
    }
}