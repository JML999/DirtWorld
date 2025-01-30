// Define our type interfaces
interface FishModelData {
    modelUri: string;
    baseScale: number;  // Base scale for this fish type
    maxScale: number;   // Maximum scale multiplier
}

export interface FishData {
    id: string;
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';  // Keep original rarity
    spawnChances: {
        shallow: number;
        mid: number;
        deep: number;
    };
    minWeight: number;
    maxWeight: number;
    baseValue: number;
    modelData: FishModelData;
}

export interface FishingArea {
    id: string;
    name: string;
    requiredLevel: number;
    fish: FishData[];
}

// Export our catalog
export const PIER_FISH_CATALOG: FishingArea = {
    id: 'fishing_pier',
    name: 'Fishing Pier',
    requiredLevel: 1,
    fish: [
        {
            id: 'mackerel',
            name: 'Mackerel',
            rarity: 'common',
            spawnChances: {
                shallow: 60,  // More common in shallow
                mid: 30,
                deep: 10
            },
            minWeight: 1,
            maxWeight: 5,
            baseValue: 10,
            modelData: {
                modelUri: 'models/npcs/mackerel.gltf',
                baseScale: 0.8,
                maxScale: 1.2
            }
        },
        {
            id: 'grouper',
            name: 'Grouper',
            rarity: 'rare',
            spawnChances: {
                shallow: 5,   // Rare in shallow
                mid: 15,
                deep: 25     // More common in deep
            },
            minWeight: 10,
            maxWeight: 30,
            baseValue: 50,
            modelData: {
                modelUri: 'models/npcs/grouper.gltf',
                baseScale: 1.2,
                maxScale: 2.0
            }
        },
        {
            id: 'pufferfish',
            name: 'Puffer Fish',
            rarity: 'uncommon',
            spawnChances: {
                shallow: 25,
                mid: 35,     // Most common in mid
                deep: 15
            },
            minWeight: 2,
            maxWeight: 8,
            baseValue: 25,
            modelData: {
                modelUri: 'models/npcs/puffer_fish.gltf',
                baseScale: 1.0,
                maxScale: 1.5
            }
        },
        {
            id: 'squid',
            name: 'Squid',
            rarity: 'uncommon',
            spawnChances: {
                shallow: 10,
                mid: 20,
                deep: 50     // Much more common in deep
            },
            minWeight: 3,
            maxWeight: 12,
            baseValue: 30,
            modelData: {
                modelUri: 'models/npcs/squid.gltf',
                baseScale: 1.0,
                maxScale: 1.8
            }
        }
    ]
};

// Optional: Export helper functions
export function getFishByRarity(rarity: string): FishData[] {
    return PIER_FISH_CATALOG.fish.filter(fish => fish.rarity === rarity);
}

export function getFishById(id: string): FishData | undefined {
    return PIER_FISH_CATALOG.fish.find(fish => fish.id === id);
}