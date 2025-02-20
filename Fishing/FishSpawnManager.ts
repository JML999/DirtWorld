import { Player, Vector3, World } from "hytopia";
import { FISH_CATALOG } from "./FishCatalog";
import { OCEAN_ZONE, GEOGRAPHIC_ZONES, LOCAL_ZONES } from "./FishingZones";
import type { FishingZone } from "./FishingZones";
import { PlayerStateManager } from '../PlayerStateManager';
import type { InventoryItem } from "../Inventory/Inventory";
import type { GamePlayerEntity } from "../GamePlayerEntity";

export interface CaughtFish {
    id: string;        // Unique catch ID (e.g., "mackerel_1234567890")
    name: string;      // Fish name (e.g., "Mackerel")
    rarity: string;    // Calculated rarity based on weight
    weight: number;    // Specific weight of this catch
    value: number;     // Calculated value based on weight/rarity
}


export class FishSpawnManager {
    constructor(private playerStateManager: PlayerStateManager, private world: World) {}

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
            var chance = this.getFishChance(fish, currentZone.id, Date.now());
            if (chance > 0) {
                console.log(`${fish.name}: ${chance.toFixed(2)}% chance`);
            }
        })

        console.log("\nSimulating Catch:");
        const roll = Math.random() * 100;
        const c = this.rollForFish(roll, currentZone.id, Date.now(), player, true);

        if (c){
            console.log(c.message)
        } else {
            console.log("Nothing caught!");
        }
    }

    public getFishAtLocation(position: Vector3, time: number, player: Player): CaughtFish | null {
        const zone = this.getZoneAtPosition(position);
        const roll = Math.random() * 100;
        const result = this.rollForFish(roll, zone.id, time, player, false);
        
        // Handle messaging here based on result
        if (!result.fish) {
            this.playerStateManager.sendGameMessage(player, result.message || "No bites.");
        }
        return result.fish;
    }

    private rollForFish(roll: number, zoneId: string | null, time: number, player: Player, sim: boolean = false): 
    { fish: CaughtFish | null, message?: string } {
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0] as GamePlayerEntity;
        const equippedBait = playerEntity.getEquippedBait(player);
        if (!sim) {
            playerEntity.useBait(player, equippedBait.item);
        }
        
        const singleRoll = Math.random() * 100;
        const shuffledFish = [...FISH_CATALOG].sort(() => Math.random() - 0.5);
        
        for (const fish of shuffledFish) {
            var chance = this.getFishChance(fish, zoneId, time);
            let c = this.baitMultiplier(fish, equippedBait.item);
           
            console.log(`${fish.name}: ${c.toFixed(2)}% chance, bait multiplier: ${c}`);
            chance = chance * c;
            console.log(`${fish.name}: ${chance.toFixed(2)}% chance`);
            console.log(`singleRoll: ${singleRoll}, chance: ${chance}`);
            if (singleRoll <= chance) {
                const catchResult = this.generateCatch(fish, player);
                if (!catchResult.fish) {
                    return { fish: null, message: catchResult.message };
                }
                return { fish: catchResult.fish };
            }
        }
        return { fish: null };
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
        const rodWeighted = playerEntity.getEquippedRod(player)?.metadata?.rodStats?.maxCatchWeight;
        
        if (rodWeighted && weight > rodWeighted) {
            return { 
                fish: null, 
                message: `Wow, that fish was big. It was too heavy for your rod.` 
            };
        }

        (`${fish.name}: ${weight}lbs, ${rodWeighted}lbs, good to catch`);
        const rarity = this.calculateFishRarity(fish, weight);
        const value = Math.floor(fish.baseValue * (weight / fish.minWeight) * this.getRarityMultiplier(rarity));

        return {
            fish: {
                id: `${fish.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                name: fish.name,
                rarity,
                weight,
                value
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

    private getFishChance(fish: typeof FISH_CATALOG[0], zoneId: string | null, time: number): number {
        if (!zoneId) return fish.spawnData.baseChance;

        const zone = [...LOCAL_ZONES, ...GEOGRAPHIC_ZONES, OCEAN_ZONE].find(z => z.id === zoneId);
        if (!zone) return fish.spawnData.baseChance;
        
        if (zone?.restrictedTo?.length > 0) {
            if (!zone?.restrictedTo?.includes(fish.id)) {
                return 0;
            }
        }

        const zoneData = fish.spawnData.zoneChances[zoneId];
        if (!zoneData) {
            return fish.spawnData.baseChance;
        }

        return zoneData.chance;
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