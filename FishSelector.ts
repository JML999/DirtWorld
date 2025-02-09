import type { Player } from 'hytopia';
import type { LevelingSystem } from './LevelingSystem';
import type { FishData } from './fishCatalog';
import { PIER_FISH_CATALOG, isWaterBlock, WaterBlockType } from './fishCatalog';
import type { InventoryManager } from './Inventory/InventoryManager';
import type { World } from 'hytopia';
import mapData from './assets/maps/map_test.json';
import { getWaterZoneType, WaterZoneType } from './fishCatalog';
export interface CaughtFish {
    id: string;        // Unique catch ID (e.g., "mackerel_1234567890")
    name: string;      // Fish name (e.g., "Mackerel")
    rarity: string;    // Calculated rarity based on weight
    weight: number;    // Specific weight of this catch
    value: number;     // Calculated value based on weight/rarity
}

interface BaitStatus {
    isHooked: boolean;
    weight?: number;
}

export class FishSelector {
    constructor(
        private world: World,
        private inventoryManager: InventoryManager,
        private levelingSystem: LevelingSystem
    ) {}

    getFish(player: Player, depth: number, landingPos: { x: number, y: number, z: number }): CaughtFish | null {
        const selectedFish = this.selectFish(player, depth, landingPos);
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

    private selectFish(player: Player, depth: number, position: { x: number, y: number, z: number }): FishData | null {
        const waterZone = this.getWaterZone(position);
        if (!waterZone) return null;
        
        // If in open water, 40% chance for rare+ fish logic
        if (waterZone === WaterZoneType.OPEN) {
            const zoneRoll = Math.random() * 100;
            if (zoneRoll > 60) {  // 40% chance for rare fish logic
                const rareFish = PIER_FISH_CATALOG.fish.filter(fish => 
                    fish.rarity === 'rare' || 
                    fish.rarity === 'epic' || 
                    fish.rarity === 'legendary'
                );
                const roll = Math.random() * 100;
                if (this.isBaitHooked(player).isHooked) {
                    let smallBait = [7, 40, 70]
                    let largeBait = [5, 38, 65]
                    var chosenBait = smallBait

                    if (this.isBaitHooked(player).weight! > 3) {
                        chosenBait = largeBait
                    }
                    if (roll < chosenBait[0]) {
                        return null; // No catch
                    } else if (roll < chosenBait[1]) {
                        const rareFishOnly = rareFish.filter(fish => fish.rarity === 'rare');
                        return rareFishOnly[Math.floor(Math.random() * rareFishOnly.length)];
                    } else if (roll < chosenBait[2]) {
                        const epicFishOnly = rareFish.filter(fish => fish.rarity === 'epic');
                        return epicFishOnly[Math.floor(Math.random() * epicFishOnly.length)];
                    } else {
                        const legendaryFishOnly = rareFish.filter(fish => fish.rarity === 'legendary');
                        return legendaryFishOnly[Math.floor(Math.random() * legendaryFishOnly.length)];
                    }
                } else {
                    if (roll < 10) {
                        return null; // No catch
                    } else if (roll < 50) {
                        const rareFishOnly = rareFish.filter(fish => fish.rarity === 'rare');
                        return rareFishOnly[Math.floor(Math.random() * rareFishOnly.length)];
                    } else if (roll < 80) {
                        const epicFishOnly = rareFish.filter(fish => fish.rarity === 'epic');
                        return epicFishOnly[Math.floor(Math.random() * epicFishOnly.length)];
                    } else {
                        const legendaryFishOnly = rareFish.filter(fish => fish.rarity === 'legendary');
                        return legendaryFishOnly[Math.floor(Math.random() * legendaryFishOnly.length)];
                    }
                }
            }
        }
        // 60% chance in open water or always in shore water
        return this.selectShoreWaterFish(player, position);
    }

    // Move existing shore water logic to separate method
    private selectShoreWaterFish(player: Player, position: { x: number, y: number, z: number }): FishData | null {
        var roll = Math.random() * 100;
        let rod = this.inventoryManager.getEquippedRod(player);
        if (rod?.id === "beginner-rod" || rod?.id === "oak_rod") {
            return this.getBeginnerWaterFish(player, position);
        } else if (rod?.id === "bamboo_rod_basic" || rod?.id === "carbon_fiber_rod") {
            return this.getMediumWaterFish(player, position);
        } else {
            if (this.isBaitHooked(player).isHooked) {
                roll = roll * 0.90;
            }
            let cumulativeChance = 0;
            for (const fish of PIER_FISH_CATALOG.fish) {
                let baseChance = fish.waterZoneChances.shore;
                cumulativeChance += baseChance;
                
                if (roll <= cumulativeChance) {
                    return fish;
                }
            }
            return null;
        }
    }

    private getBeginnerWaterFish(player: Player, position: { x: number, y: number, z: number }): FishData | null {
        var roll = Math.random() * 100;
        let rod = this.inventoryManager.getEquippedRod(player);
        if (rod?.id === "beginner-rod") { 
            roll = roll * 8;
        } else if (rod?.id === "oak_rod") {
            roll = roll * 3;
        } 
        if (this.isBaitHooked(player).isHooked) {
            roll = roll * 0.90;
        }
        let cumulativeChance = 0;
        for (const fish of PIER_FISH_CATALOG.fish) {
            let baseChance = fish.waterZoneChances.shore;
            cumulativeChance += baseChance;
            
            if (roll <= cumulativeChance) {
                return fish;
            }
        }
        return null;
    }

    private getMediumWaterFish(player: Player, position: { x: number, y: number, z: number }): FishData | null {
        const MAX_ATTEMPTS = 5;
        
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            // Get a random fish index from the catalog
            const randomIndex = Math.floor(Math.random() * PIER_FISH_CATALOG.fish.length);
            
            // Do the probability roll for this fish
            const roll = Math.random() * 100;
            let cumulativeChance = 0;
            
            // Start checking from our random index
            for (let i = 0; i < PIER_FISH_CATALOG.fish.length; i++) {
                const currentIndex = (randomIndex + i) % PIER_FISH_CATALOG.fish.length;
                const fish = PIER_FISH_CATALOG.fish[currentIndex];
                
                let baseChance = fish.waterZoneChances.shore;
                cumulativeChance += baseChance;
                
                if (roll <= cumulativeChance) {
                    return fish;
                }
            }
        }
        return null; // No fish caught after all attempts
    }

    private getHotspotBonus(fish: FishData, position: { x: number, y: number, z: number }): number {
        if (!fish.hotspots) return 1.0;
    
        let maxBonus = 1.0;
        for (const hotspot of fish.hotspots) {
            // Calculate horizontal distance only (ignoring y/height)
            const distance = Math.sqrt(
                Math.pow(position.x - hotspot.x, 2) +
                Math.pow(position.z - hotspot.z, 2)
            );
    
            // If within radius, consider this bonus
            if (distance <= hotspot.radius) {
                // Scale bonus based on horizontal distance
                const scaledBonus = hotspot.bonus * (1 - (distance / hotspot.radius));
                maxBonus = Math.max(maxBonus, scaledBonus);
            }
        }
        return maxBonus;
    }

    private isBaitHooked(player: Player): BaitStatus {
        const inventory = this.inventoryManager.getInventory(player);
        if (!inventory) return { isHooked: false };

        for (const item of inventory.items) {
            if (item.metadata.fishStats?.baited) {
                this.inventoryManager.useBait(player, item.id);
                return {
                    isHooked: true,
                    weight: item.metadata.fishStats.weight
                };
            }
        }
        return { isHooked: false };
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

    private isWater(position: { x: number, y: number, z: number }): boolean {
        const blockKey = `${Math.floor(position.x)},${Math.floor(position.y)},${Math.floor(position.z)}`;
        const blockTypeId = (mapData.blocks as Record<string, number>)[blockKey];
        return isWaterBlock(blockTypeId);  // Using imported function
    }

    private getWaterZone(position: { x: number, y: number, z: number }): WaterZoneType | null {
        // First check if it's water at all (using your existing water check)
        if (!this.isWater(position)) return null;
        // If it is water, determine the zone
        return getWaterZoneType(position);
    }
}
