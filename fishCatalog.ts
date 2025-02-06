// Define our type interfaces
interface FishModelData {
    modelUri: string;
    baseScale: number;  // Base scale for this fish type
    maxScale: number;   // Maximum scale multiplier
}

// Water block type definitions
export enum WaterBlockType {
    FLOWING = 43,
    STILL = 43,
    OPEN = 43
}

interface FishHotspot {
    x: number;
    y: number;
    z: number;
    radius: number;  // How far the hotspot effect reaches
    bonus: number;   // Multiplier for catch chance
}



export interface WaterBlockData {
    waterBlockType: WaterBlockType;
}

// Helper function to check if a block is water
export function isWaterBlock(blockTypeId: number): boolean {
    return Object.values(WaterBlockType).includes(blockTypeId);
}

// Change from block types to zone types
export enum WaterZoneType {
    SHORE = 'shore',    // Within 35x35 area
    OPEN = 'open'       // Outside that area
}

// Helper function to determine water zone from position
export function getWaterZoneType(position: { x: number, z: number }): WaterZoneType {
    // Define shore boundaries (assuming center is 0,0)
    const SHORE_BOUNDARY = 35;
    
    // Check if position is within shore boundaries
    if (Math.abs(position.x) <= SHORE_BOUNDARY && 
        Math.abs(position.z) <= SHORE_BOUNDARY) {
        return WaterZoneType.SHORE;
    }
    
    return WaterZoneType.OPEN;
}

// Update FishData interface to include both types of chances
export interface FishData {
    id: string;
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    // Original jig-related depth chances
    spawnChances: {
        shallow: number;
        mid: number;
        deep: number;
    };
    // New water block type chances
    waterBlockChances: {
        flowing: number;
        still: number;
        open: number;
    };
    // New water zone chances
    waterZoneChances: {
        shore: number;
        open: number;
    };
    minWeight: number;
    maxWeight: number;
    baseValue: number;
    modelData: FishModelData;
    hotspots?: FishHotspot[];
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
            hotspots: [
                 // Double chance within 10 blocks
            ],
            spawnChances: {
                shallow: 33,
                mid: 33,
                deep: 34
            },
            waterBlockChances: {
                flowing: 50,
                still: 30,
                open: 20
            },
            waterZoneChances: {
                shore: 75,
                open: 25
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
            id: 'sardine',
            name: 'Sardine',
            rarity: 'common',
            hotspots: [
                { x: -18, y: 4, z: -18, radius: 20, bonus: 2.0 },  // Double chance within 10 blocks // 1.5x chance within 15 blocks
            ],
            spawnChances: {
                shallow: 60,
                mid: 40,
                deep: 10     // Much more common in deep
            },
            waterBlockChances: {
                flowing: 0,
                still: 90,
                open: 10
            },
            waterZoneChances: {
                shore: 90,
                open: 10
            },
            minWeight: 1,
            maxWeight: 5,
            baseValue: 10,
            modelData: {
                modelUri: 'models/npcs/sardine.gltf',
                baseScale: 0.5,
                maxScale: 1.8
            }
        },
        {
            id: 'goldfin_mackerel',
            name: 'Goldfin Mackerel',
            rarity: 'rare',
            hotspots: [
                { x: -22, y: 5, z: 23, radius: 8, bonus: 1.5 },  // Double chance within 10 blocks // 1.5x chance within 15 blocks
            ],
            spawnChances: {
                shallow: 30,
                mid: 70,
                deep: 0     // Much more common in deep
            },
            waterBlockChances: {
                flowing: 0,
                still: 10,
                open: 90
            },
            waterZoneChances: {
                shore: 90,
                open: 10
            },
            minWeight: 3,
            maxWeight: 12,
            baseValue: 80,
            modelData: {
                modelUri: 'models/npcs/goldfin_mackerel.gltf',
                baseScale: 0.75,
                maxScale: 1.2
            }
        },        {
            id: 'spotted_flounder',
            name: 'Spotted Flounder',
            rarity: 'rare',
            hotspots: [
                { x: -22, y: 5, z: 23, radius: 4, bonus: 1.3 },  // Double chance within 10 blocks // 1.5x chance within 15 blocks
            ],
            spawnChances: {
                shallow: 20,
                mid: 70,
                deep: 10     // Much more common in deep
            },
            waterBlockChances: {
                flowing: 0,
                still: 40,
                open: 60
            },
            waterZoneChances: {
                shore: 60,
                open: 40
            },
            minWeight: 3,
            maxWeight: 12,
            baseValue: 50,
            modelData: {
                modelUri: 'models/npcs/spotted_flounder.gltf',
                baseScale: 0.8,
                maxScale: 1.4
            }
        },
        {
            id: 'grouper',
            name: 'Grouper',
            rarity: 'rare',
            spawnChances: {
                shallow: 5,   
                mid: 15,
                deep: 85     
            },
            hotspots: [
                { x: 100, y: 5, z: 200, radius: 10, bonus: 2.0 },
                { x: 14, y: 5, z: -9, radius: 10, bonus: 1.05 },
            ],
            waterBlockChances: {
                flowing: 0,
                still: 20,
                open: 80
            },
            waterZoneChances: {
                shore: 20,
                open: 80
            },
            minWeight: 10,
            maxWeight: 300,
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
            hotspots: [
                { x: -22, y: 5, z: 23, radius: 4, bonus: 1.2 },  // Double chance within 10 blocks // 1.5x chance within 15 blocks
            ],
            spawnChances: {
                shallow: 25,
                mid: 35,     // Most common in mid
                deep: 15
            },
            waterBlockChances: {
                flowing: 50,
                still: 30,
                open: 20
            },
            waterZoneChances: {
                shore: 50,
                open: 50
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
            waterBlockChances: {
                flowing: 50,
                still: 30,
                open: 20
            },
            waterZoneChances: {
                shore: 30,
                open: 70
            },
            minWeight: 3,
            maxWeight: 100,
            baseValue: 30,
            modelData: {
                modelUri: 'models/npcs/squid.gltf',
                baseScale: 0.2,
                maxScale: 1.8
            }
        }, 
        {
            id: 'swordfish',
            name: 'Swordfish',
            rarity: 'rare',
            spawnChances: {
                shallow: 5,
                mid: 40,
                deep: 65     // Much more common in deep
            },
            waterBlockChances: {
                flowing: 0,
                still: 5,
                open: 95
            },
            waterZoneChances: {
                shore: 5,
                open: 95
            },
            minWeight: 50,
            maxWeight: 1000,
            baseValue: 100,
            modelData: {
                modelUri: 'models/npcs/swordfish.gltf',
                baseScale: 1.0,
                maxScale: 3.0
            }
        },
        {
            id: 'tropical_swordfish',
            name: 'Tropical Swordfish',
            rarity: 'epic',
            spawnChances: {
                shallow: 5,
                mid: 40,
                deep: 65     // Much more common in deep
            },
            waterBlockChances: {
                flowing: 0,
                still: 3,
                open: 97
            },
            waterZoneChances: {
                shore: 3,
                open: 97
            },
            minWeight: 50,
            maxWeight: 1000,
            baseValue: 150,
            modelData: {
                modelUri: 'models/npcs/tropical_swordfish.gltf',
                baseScale: 1.0,
                maxScale: 3.0
            }
        }, {
            id: 'hammerhead_shark',
            name: 'hammerhead Shark',
            rarity: 'epic',
            spawnChances: {
                shallow: 5,
                mid: 40,
                deep: 65     // Much more common in deep
            },
            waterBlockChances: {
                flowing: 0,
                still: 5,
                open: 95
            },
            waterZoneChances: {
                shore: 40,
                open: 60
            },
            minWeight: 500,
            maxWeight: 1000,
            baseValue: 120,
            modelData: {
                modelUri: 'models/npcs/hammerhead_shark.gltf',
                baseScale: 1.0,
                maxScale: 3.0
            }
        },     
        {
            id: 'gold_swordfish',
            name: 'Gold Swordfish',
            rarity: 'legendary',
            spawnChances: {
                shallow: 0,
                mid: 5,
                deep: 95     // Much more common in deep
            },
            waterBlockChances: {
                flowing: 0,
                still: 0,
                open: 100
            },
            waterZoneChances: {
                shore: 0,
                open: 100
            },
            minWeight: 50,
            maxWeight: 1000,
            baseValue: 400,
            modelData: {
                modelUri: 'models/npcs/gold_swordfish.gltf',
                baseScale: 1.0,
                maxScale: 3.0
            }
        }, 
        {
            id: 'great_white_shark',
            name: 'Great White Shark',
            rarity: 'legendary',
            spawnChances: {
                shallow: 5,
                mid: 40,
                deep: 65     // Much more common in deep
            },
            waterBlockChances: {
                flowing: 0,
                still: 5,
                open: 95
            },
            waterZoneChances: {
                shore: 5,
                open: 95
            },
            minWeight: 1000,
            maxWeight: 4000,
            baseValue: 500,
            modelData: {
                modelUri: 'models/npcs/great_white_shark.gltf',
                baseScale: 1.0,
                maxScale: 3.0
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

// Helper function to get fish pool based on water zone
export function getFishPoolByZone(position: { x: number, z: number }): FishData[] {
    const zoneType = getWaterZoneType(position).toLowerCase();
    
    return PIER_FISH_CATALOG.fish.filter(fish => 
        fish.waterZoneChances[zoneType as keyof typeof fish.waterZoneChances] > 0
    );
}

