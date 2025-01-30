import type { Player } from 'hytopia';
import type { LevelingSystem } from './LevelingSystem';
import type { FishData } from './fishCatalog';
import { PIER_FISH_CATALOG } from './fishCatalog';
import type { InventoryManager } from './Inventory/InventoryManager';
import type { World } from 'hytopia';

export interface CaughtFish {
    id: string;        // Unique catch ID (e.g., "mackerel_1234567890")
    name: string;      // Fish name (e.g., "Mackerel")
    rarity: string;    // Calculated rarity based on weight
    weight: number;    // Specific weight of this catch
    value: number;     // Calculated value based on weight/rarity
}

export class FishSelector {
    constructor(
        private world: World,
        private inventoryManager: InventoryManager,
        private levelingSystem: LevelingSystem
    ) {}

    getFish(player: Player, depth: number): CaughtFish | null {
        const selectedFish = this.selectFish(player, depth);
        if (selectedFish) {
            return this.generateCatch(selectedFish);
        }
        return null;
    }

    // Base catch rates for each depth
    private readonly DEPTH_CATCH_RATES = {
        shallow: 1.0,    // 100% base chance in shallow
        mid: 0.8,       // 80% base chance in mid
        deep: 0.6       // 60% base chance in deep
    };

    private selectFish(player: Player, depth: number): FishData | null {
        const roll = Math.random() * 100;
        let cumulativeChance = 0;

        // Get rod and skill modifiers
        const rod = this.inventoryManager.getEquippedRod(player);
        const luckBonus = rod?.metadata?.rodStats?.luck || 1;
        const skillLevel = this.levelingSystem.getCurrentLevel(player);
        const skillBonus = 0.5 + (skillLevel * 0.1);  // 50% base chance + 10% per level
        
        const depthType = this.getDepthType(depth) as keyof typeof this.DEPTH_CATCH_RATES;
        for (const fish of PIER_FISH_CATALOG.fish) {
            const depthChance = fish.spawnChances[depthType] * this.DEPTH_CATCH_RATES[depthType];
            cumulativeChance += depthChance * luckBonus * skillBonus;
            
            if (roll <= cumulativeChance) {
                return fish;
            }
        }
        return null;
    }

    private getDepthType(depth: number): 'shallow' | 'mid' | 'deep' {
        if (depth < 0.33) return 'shallow';
        if (depth < 0.66) return 'mid';
        return 'deep';
    }

    private generateCatch(fish: FishData): CaughtFish {
        const weight = this.generateWeight(fish.minWeight, fish.maxWeight);
        const rarity = this.calculateFishRarity(fish, weight);
        const value = Math.floor(fish.baseValue * (weight / fish.minWeight) * (this.getRarityMultiplier(rarity)));

        return {
            id: `${fish.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: fish.name,
            rarity,
            weight,
            value
        };
    }

    private generateWeight(min: number, max: number): number {
        const weight = min + Math.random() * (max - min);
        return Number(weight.toFixed(2));
    }

    private calculateFishRarity(fish: FishData, weight: number): string {
        const weightRange = fish.maxWeight - fish.minWeight;
        const weightPercentile = (weight - fish.minWeight) / weightRange;

        if (weightPercentile > 0.95) return 'Legendary';
        if (weightPercentile > 0.85) return 'Epic';
        if (weightPercentile > 0.70) return 'Rare';
        if (weightPercentile > 0.50) return 'Uncommon';
        return 'Common';
    }

    private getRarityMultiplier(rarity: string): number {
        switch (rarity) {
            case 'Legendary': return 5;
            case 'Epic': return 3;
            case 'Rare': return 2;
            case 'Uncommon': return 1.5;
            default: return 1;
        }
    }
/*
    private displayFish(fish: any) {
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(this.player)[0];
        
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
        }, 16);
    }
*/
}
