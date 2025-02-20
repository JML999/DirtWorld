import { BEGINNER_CRATE_SPAWN_LOCATIONS } from './CrateCoordinates';
import { BAIT_CATALOG } from './BaitCatalog';

export interface CrateDefinition {
    id: string;
    name: string;
    blockTextureUri: string;
    health: number; // Damage taken before crate breaks
    spawnLocations: typeof BEGINNER_CRATE_SPAWN_LOCATIONS;  // Reference entire spawn set
    lootTable: {
        type: string;
        chance: number;
        minAmount: number;
        maxAmount: number;
    }[];
}

export const CRATE_CATALOG: { [key: string]: CrateDefinition } = {
    'beginner_crate': {
        id: 'beginner_crate',
        name: 'Beginner Bait Crate',
        blockTextureUri: 'blocks/barrel.png',
        health: 3,
        spawnLocations: BEGINNER_CRATE_SPAWN_LOCATIONS,
        lootTable: Object.entries(BAIT_CATALOG)
            .map(([type, bait]) => ({
                type,
                chance: bait.harvestChance,
                minAmount: bait.minHarvestAmount,
                maxAmount: bait.maxHarvestAmount
            }))
    },
};