import { Player, Vector3, World } from "hytopia";
import { FISH_CATALOG } from "./FishCatalog";
import { OCEAN_ZONE, GEOGRAPHIC_ZONES, LOCAL_ZONES } from "./FishingZones";
import type { FishingZone } from "./FishingZones";
import { PlayerStateManager } from '../PlayerStateManager';
import type { InventoryItem } from "../Inventory/Inventory";
import type { GamePlayerEntity } from "../GamePlayerEntity";
import { FishLootManager } from "./FishLootManager";

export interface CaughtFish {
    id: string;        // Unique catch ID (e.g., "mackerel_1234567890")
    name: string;      // Fish name (e.g., "Mackerel")
    rarity: string;    // Calculated rarity based on weight
    weight: number;    // Specific weight of this catch
    value: number; 
    isBaitFish: boolean;
    isLoot?: boolean;  // Flag for loot items
    // Calculated value based on weight/rarity
}

export class FishSpawnManager {
    private lootManager: FishLootManager;

    constructor(private playerStateManager: PlayerStateManager, private world: World) {
        this.lootManager = new FishLootManager(world, playerStateManager);
    }

    public runFishSimulation(position: Vector3, player: Player): void {
        console.log("\n=== Fishing Debug ===");
        const currentZone = this.getZoneAtPosition(position);
        // Check zones
        console.log("Zones at position:", position);
        for (const zone of LOCAL_ZONES) {
            const inZone = this.isInRadius(position, zone.position, zone.radius);
            if (inZone) {
                console.log(`✓ In Local Zone: ${zone.id} (${zone.name})`);
            }
        }
        for (const zone of GEOGRAPHIC_ZONES) {
            const inZone = this.isInRadius(position, zone.position, zone.radius);
            if (inZone) {
                console.log(`✓ In Geographic Zone: ${zone.id} (${zone.name})`);
            }
        }
        // If no zones found, we're in deep ocean
        if (!LOCAL_ZONES.some(z => this.isInRadius(position, z.position, z.radius)) && 
            !GEOGRAPHIC_ZONES.some(z => this.isInRadius(position, z.position, z.radius))) {
            console.log(`✓ In Geographic Zone: ${OCEAN_ZONE.id} (${OCEAN_ZONE.name})`);
        }
        // Check fish probabilities
        console.log("\nPossible Fish:");
        FISH_CATALOG.forEach(fish => {
            var chance = this.getFishChance(fish, currentZone.id, Date.now(), player);
            if (chance > 0) {
                console.log(`${fish.name}: ${chance.toFixed(2)}% chance`);
            }
        })

        console.log("\nSimulating Catch:");
       // const c = this.rollForFish(currentZone.id, Date.now(), player, true);
    }

    public getFishAtLocation(position: Vector3, time: number, player: Player): CaughtFish | null {
        const zone = this.getZoneAtPosition(position);
        const result = this.rollForFish(zone.id, time, player, false);
        
        // If we have a message (e.g., "too heavy for rod"), display it
        if (result.message) {
            this.playerStateManager.sendGameMessage(player, result.message);
        }
        
        // Return the fish (or null if nothing was caught)
        return result.fish;
    }

    private shouldGuaranteeCatch(player: Player, zoneId: string | null): boolean {
        // Check if player is low level and in beginner pond
        const playerLevel = this.playerStateManager.getCurrentLevel(player);
        console.log(`Player level: ${playerLevel}, are we in beginner pond? ${zoneId === 'beginner_pond'}`);
        const isBeginnerPond = zoneId === 'beginner_pond';
        const isLowLevel = playerLevel < 2;
        return isBeginnerPond && isLowLevel;
    }

    private getGuaranteedFish(player: Player): CaughtFish | null {
        // Find a goldfish in the catalog
        const goldfish = FISH_CATALOG.find(fish => fish.id === 'goldfish');
        if (goldfish) {
            const catchResult = this.generateCatch(goldfish, player);
            return catchResult.fish;
        }
        return null;
    }

    private getEligibleFishAndLoot(zoneId: string | null, player: Player): typeof FISH_CATALOG[0][] {
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0] as GamePlayerEntity;
        const equippedRod = playerEntity.getEquippedRod(player);
        const rodId = equippedRod?.id || '';
        
        // Filter fish by eligibility criteria
        return FISH_CATALOG.filter(fish => {
            // Skip if fish is restricted to specific rods and player's rod isn't one of them
            if (fish.spawnData.rodRestrictions && 
                fish.spawnData.rodRestrictions.length > 0 && 
                !fish.spawnData.rodRestrictions.includes(rodId)) {
                return false;
            }
            
            // Restrict low-level players to common and uncommon fish
            const playerLevel = this.playerStateManager.getCurrentLevel(player);
            if (playerLevel < 3 && !['common', 'uncommon'].includes(fish.rarity)) {
                return false;
            }
            
            return true;
        });
    }

    // In the rollForFish method
    private rollForFish(zoneId: string | null, time: number, player: Player, sim: boolean = false): 
    { fish: CaughtFish | null, message?: string } {
        console.log(`\n=== DETAILED FISHING DEBUG ===`);
        console.log(`Zone: ${zoneId}, Simulation: ${sim}`);
        
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0] as GamePlayerEntity;
        const equippedBait = playerEntity.getEquippedBait(player);
        const equippedRod = playerEntity.getEquippedRod(player);
        const rodId = equippedRod?.id || '';
        
        console.log(`Player equipment - Rod: ${rodId}, Bait: ${equippedBait?.item?.name || 'None'}`);
        
        // Check for guaranteed catch for beginners
        if (this.shouldGuaranteeCatch(player, zoneId)) {
            console.log(`Low level player in beginner pond - guaranteed catch`);
            const guaranteedFish = this.getGuaranteedFish(player);
            if (guaranteedFish) {
                if (!sim) {
                    playerEntity.useBait(player, equippedBait.item);
                }
                return { fish: guaranteedFish };
            }
        }
        
        // Get eligible fish and loot
        const eligibleItems = this.getEligibleFishAndLoot(zoneId, player);
        console.log(`Eligible items: ${eligibleItems.length}`);
        
        // Calculate total probability weight
        let totalWeight = 0;
        const itemsWithChances = eligibleItems.map(item => {
            const chance = this.getFishChance(item, zoneId, time, player);
            const baitMultiplier = this.baitMultiplier(item, equippedBait.item);
            const finalChance = chance * baitMultiplier;
            totalWeight += finalChance;
            return { item, chance: finalChance };
        });
        
        console.log(`Total probability weight before normalization: ${totalWeight}`);
        console.log(`\nPre-normalized chances:`);
        itemsWithChances.forEach(entry => {
            console.log(`${entry.item.name} (${entry.item.rarity}): ${entry.chance.toFixed(2)}%`);
        });
        
        // Normalize to ensure total is 100%
        const normalizedItems = itemsWithChances.map(entry => ({
            item: entry.item,
            normalizedChance: (entry.chance / totalWeight) * 100
        }));
        
        console.log(`\nNormalized chances:`);
        normalizedItems.forEach(entry => {
            console.log(`${entry.item.name} (${entry.item.rarity}): ${entry.normalizedChance.toFixed(2)}%`);
        });
        
        // Roll and select item
        const roll = Math.random() * 100;
        console.log(`\nRoll: ${roll.toFixed(2)}`);
        
        let cumulativeChance = 0;
        for (const entry of normalizedItems) {
            cumulativeChance += entry.normalizedChance;
            console.log(`${entry.item.name}: cumulative ${cumulativeChance.toFixed(2)}, roll ${roll.toFixed(2)}`);
            if (roll <= cumulativeChance) {
                console.log(`Selected: ${entry.item.name} (${entry.item.rarity})`);
                const catchResult = this.generateCatchResult(entry.item, player);
                if (!sim) {
                    playerEntity.useBait(player, equippedBait.item);
                }
                return catchResult;
            }
        }
        
        // This should rarely happen due to normalization, but just in case
        console.log(`No fish selected (should be rare)`);
        return { fish: null, message: "No bites." };
    }

    private generateCatchResult(item: typeof FISH_CATALOG[0], player: Player): 
    { fish: CaughtFish | null, message?: string } {
        if (item.isLoot) {
            // Use existing loot manager to handle loot items
            const lootItem = this.lootManager.rollForLoot(item.id, player);
            
            if (lootItem) {
                // Add to inventory and display
                this.lootManager.addLootToInventory(player, lootItem);
                this.lootManager.displayLoot(player, lootItem);
                
                // Return null fish since we handled it as loot
                return { fish: null };
            } else {
                return { fish: null, message: "No bites." };
            }
        } else {
            // Generate fish catch using existing logic
            return this.generateCatch(item, player);
        }
    }

    private baitMultiplier(fish: typeof FISH_CATALOG[0], bait: InventoryItem | null): number {
        if (!bait) { return 1; }
        if (bait && fish.id in (bait.metadata.baitStats?.speciesLuck || {})) {
            return bait.metadata.baitStats?.speciesLuck?.[fish.id] || 1;
        } else {
            return bait?.metadata.baitStats?.baseLuck || 1;
        }
    }

    private generateCatch(fish: typeof FISH_CATALOG[0], player: Player): 
    { fish: CaughtFish | null, message?: string } {
        const weight = this.generateWeight(fish.minWeight, fish.maxWeight);
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0] as GamePlayerEntity;
        var rodWeighted = playerEntity.getEquippedRod(player)?.metadata?.rodStats?.maxCatchWeight;
        const equippedBait = this.playerStateManager.getInventory(player)
        ?.items.find(item => 
            item.type === 'bait' && 
            item.equipped === true
        );

        const baitStrength = equippedBait?.metadata?.baitStats?.strength || 1;
        rodWeighted = rodWeighted ?? 1 * baitStrength;
        console.log('generateCatch', fish.name, fish.rarity, weight, 'rod boost', baitStrength, 'rod weighted', rodWeighted);
        if (rodWeighted && weight > rodWeighted) {
            return { 
                fish: null, 
                message: `Wow, that fish was big. It was too heavy for your rod.` 
            };
        }

        console.log(`${fish.name}: ${weight}lbs, ${rodWeighted}lbs, good to catch`);
        const rarity = this.calculateFishRarity(fish, weight);
        const value = Math.floor(fish.baseValue * (weight / fish.minWeight) * this.getRarityMultiplier(rarity));

        return {
            fish: {
                id: `${fish.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                name: fish.name,
                rarity,
                weight,
                value,
                isBaitFish: fish.isBait
            }
        };
    }

    private generateWeight(min: number, max: number): number {
        const weight = min + Math.random() * (max - min);
        return Number(weight.toFixed(2));
    }

    private calculateFishRarity(fish: typeof FISH_CATALOG[0], weight: number): string {
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
            case 'Legendary': return 5.0;
            case 'Epic': return 3.0;
            case 'Rare': return 2.0;
            case 'Uncommon': return 1.5;
            default: return 1.0;
        }
    }

    private getFishChance(fish: typeof FISH_CATALOG[0], zoneId: string | null, time: number, player: Player): number {
        // Get base chance from zone or default
        let chance = fish.spawnData.baseChance;
        if (zoneId && fish.spawnData.zoneChances[zoneId]) {
            chance = fish.spawnData.zoneChances[zoneId].chance;
        } else if (zoneId) {
            // If fish doesn't have this zone listed, make it extremely rare
            // This prevents normalization from making rare fish too common
            if (fish.rarity === 'legendary') {
                chance = 0.1; // 0.1% chance for legendary fish in non-listed zones
            } else if (fish.rarity === 'epic') {
                chance = 0.5; // 0.5% chance for epic fish in non-listed zones
            } else if (fish.rarity === 'rare') {
                chance = 1.0; // 1% chance for rare fish in non-listed zones
            } else {
                chance = fish.spawnData.baseChance * 0.1; // 10% of base chance for others
            }
        }
        
        // Apply rarity penalty for higher-level players without bait
        const playerLevel = this.playerStateManager.getCurrentLevel(player);
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0] as GamePlayerEntity;
        const equippedBait = playerEntity.getEquippedBait(player)?.item;
        
        if (playerLevel >= 3 && !equippedBait && ['rare', 'epic', 'legendary'].includes(fish.rarity)) {
            // Reduce chance by 70% for rare+ fish when no bait is equipped
            chance *= 0.3;
        }
        
        return chance;
    }

    private isInTimeWindow(windows: { start: number; end: number; }[], time: number): boolean {
        return windows.some(window => {
            if (window.start < window.end) {
                return time >= window.start && time < window.end;
            } else {
                // Handles overnight windows (e.g., 22-4)
                return time >= window.start || time < window.end;
            }
        });
    }

    private getZoneAtPosition(position: Vector3): FishingZone {
        // Check local zones first
        for (const zone of LOCAL_ZONES) {
            if (this.isInRadius(position, zone.position, zone.radius)) {
                return zone;
            }
        }

        // Then check geographic zones
        for (const zone of GEOGRAPHIC_ZONES) {
            if (this.isInRadius(position, zone.position, zone.radius)) {
                return zone;
            }
        }

        // Default to ocean zone
        return OCEAN_ZONE;
    }

    private isInRadius(pos1: Vector3, pos2: Vector3, radius: number): boolean {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        const distanceSquared = dx * dx + dz * dz;
        const radiusSquared = radius * radius;
        return distanceSquared <= radiusSquared;
    }
}