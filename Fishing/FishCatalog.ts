import { Vector3, World } from "hytopia";

// Core fish data structure
interface FishData {
    id: string;
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    minWeight: number;
    maxWeight: number;
    baseValue: number;
    modelData: {
        modelUri: string;
        baseScale: number;
        maxScale: number;
    };
    spawnData: {
        baseChance: number;  // Default chance outside of zones
        zoneChances: {
            [zoneId: string]: {
                chance: number;
                timeWindows?: { start: number; end: number; }[];
            }
        };
    };
}

export const FISH_CATALOG: FishData[] = [
    {
        id: 'mackerel',
        name: 'Mackerel',
        rarity: 'common',
        minWeight: 1,
        maxWeight: 5,
        baseValue: 10,
        modelData: {
            modelUri: 'models/npcs/mackerel.gltf',
            baseScale: 0.8,
            maxScale: 1.2
        },
        spawnData: {
            baseChance: 18,
            zoneChances: {
                'beginner_pond': { chance: 5 },
                'pier': { chance: 20 },
                'reef': { chance: 28 },
                'wooded_shore': { chance: 10 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 20 },
                'boat_house': { chance: 22 },
                'old_dock': { chance: 25 },
                'merch_beach': { chance: 20 },
                'open_ocean': { chance: 18 },
            }
        }
    },
    {
        id: 'sardine',
        name: 'Sardine',
        rarity: 'common',
        minWeight: 1,
        maxWeight: 5,
        baseValue: 10,
        modelData: {
            modelUri: 'models/npcs/sardine.gltf',
            baseScale: 0.5,
            maxScale: 1.8
        },
        spawnData: {
            baseChance: 15,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 25 },
                'reef': { chance: 20 },
                'wooded_shore': { chance: 20 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 33 },
                'boat_house': { chance: 18 },
                'old_dock': { chance: 16 },
                'merch_beach': { chance: 15 },
                'open_ocean': { chance: 25 },
            }
        }
    },
    {
        id: 'goldfin_mackerel',
        name: 'Goldfin Mackerel',
        rarity: 'rare',
        minWeight: 3,
        maxWeight: 12,
        baseValue: 80,
        modelData: {
            modelUri: 'models/npcs/goldfin_mackerel.gltf',
            baseScale: 0.75,
            maxScale: 1.2
        },
        spawnData: {
            baseChance: 12,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 18 },
                'reef': { chance: 25 },
                'wooded_shore': { chance: 18 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 18 },
                'boat_house': { chance: 15 },
                'old_dock': { chance: 15 },
                'merch_beach': { chance: 15 },
                'open_ocean': { chance: 15 },
            }
        }
    },
    {
        id: 'spotted_flounder',
        name: 'Spotted Flounder',
        rarity: 'rare',
        minWeight: 3,
        maxWeight: 12,
        baseValue: 50,
        modelData: {
            modelUri: 'models/npcs/spotted_flounder.gltf',
            baseScale: 0.8,
            maxScale: 1.4
        },
        spawnData: {
            baseChance: 17,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 18 },
                'reef': { chance: 33 },
                'wooded_shore': { chance: 19 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 20 },
                'boat_house': { chance: 22 },
                'old_dock': { chance: 12 },
                'merch_beach': { chance: 18 },
                'open_ocean': { chance: 20 },
            }
        }
    },
    {
        id: 'rainbow_flounder',
        name: 'Rainbow Flounder',
        rarity: 'epic',
        minWeight: 3,
        maxWeight: 12,
        baseValue: 50,
        modelData: {
            modelUri: 'models/npcs/rainbow_flounder.gltf',
            baseScale: 0.8,
            maxScale: 1.4
        },
        spawnData: {
            baseChance: 10,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 10 },
                'reef': { chance: 25 },
                'wooded_shore': { chance: 9 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 10 },
                'boat_house': { chance: 12 },
                'old_dock': { chance: 10 },
                'merch_beach': { chance: 12 },
                'open_ocean': { chance: 25 },
            }
        }
    },
    {
        id: 'grouper',
        name: 'Grouper',
        rarity: 'rare',
        minWeight: 10,
        maxWeight: 300,
        baseValue: 50,
        modelData: {
            modelUri: 'models/npcs/grouper.gltf',
            baseScale: 1.2,
            maxScale: 2.0
        },
        spawnData: {
            baseChance: 10,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 12 },
                'reef': { chance: 10 },
                'wooded_shore': { chance: 10 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 12 },
                'boat_house': { chance: 13 },
                'old_dock': { chance: 33 },
                'merch_beach': { chance: 1 },
                'open_ocean': { chance: 35 },
            }
        }
    },
    {
        id: 'pufferfish',
        name: 'Puffer Fish',
        rarity: 'uncommon',
        minWeight: 2,
        maxWeight: 8,
        baseValue: 25,
        modelData: {
            modelUri: 'models/npcs/puffer_fish.gltf',
            baseScale: 1.0,
            maxScale: 1.5
        },
        spawnData: {
            baseChance: 23,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 28 },
                'reef': { chance: 30 },
                'wooded_shore': { chance: 25 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 25 },
                'boat_house': { chance: 25 },
                'old_dock': { chance: 15 },
                'merch_beach': { chance: 25 },
                'open_ocean': { chance: 20 },
            }
        }
    },
    {
        id: 'squid',
        name: 'Squid',
        rarity: 'uncommon',
        minWeight: 3,
        maxWeight: 100,
        baseValue: 30,
        modelData: {
            modelUri: 'models/npcs/squid.gltf',
            baseScale: 0.2,
            maxScale: 1.8
        },
        spawnData: {
            baseChance: 15,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 19 },
                'reef': { chance: 20 },
                'wooded_shore': { chance: 15 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 19 },
                'boat_house': { chance: 22 },
                'old_dock': { chance: 15 },
                'merch_beach': { chance: 15 },
                'open_ocean': { chance: 35 },
            }
        }
    },
    {
        id: 'swordfish',
        name: 'Swordfish',
        rarity: 'rare',
        minWeight: 50,
        maxWeight: 1000,
        baseValue: 100,
        modelData: {
            modelUri: 'models/npcs/swordfish.gltf',
            baseScale: 1.0,
            maxScale: 3.0
        },
        spawnData: {
            baseChance: 5,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 8 },
                'reef': { chance: 5 },
                'wooded_shore': { chance: 5 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 5},
                'boat_house': { chance: 5 },
                'old_dock': { chance: 5 },
                'merch_beach': { chance: 6 },
                'open_ocean': { chance: 30 },
            }
        }
    },
    {
        id: 'tropical_swordfish',
        name: 'Tropical Swordfish',
        rarity: 'epic',
        minWeight: 50,
        maxWeight: 1000,
        baseValue: 150,
        modelData: {
            modelUri: 'models/npcs/tropical_swordfish.gltf',
            baseScale: 1.0,
            maxScale: 3.0
        },
        spawnData: {
            baseChance: 4,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 6 },
                'reef': { chance: 5 },
                'wooded_shore': { chance: 4 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 4},
                'boat_house': { chance: 5 },
                'old_dock': { chance: 5 },
                'merch_beach': { chance: 4 },
                'open_ocean': { chance: 25 },
            }
        }
    },
    {
        id: 'hammerhead_shark',
        name: 'Hammerhead Shark',
        rarity: 'epic',
        minWeight: 500,
        maxWeight: 1000,
        baseValue: 120,
        modelData: {
            modelUri: 'models/npcs/hammerhead_shark.gltf',
            baseScale: 1.0,
            maxScale: 3.0
        },
        spawnData: {
            baseChance: 8,
            zoneChances: {
                'pier': { chance: 8 },
                'old_dock': { chance: 5 },
                'boat_house': { chance: 2 },
                'open_ocean': { chance: 24 }
            }
        }
    },
    {
        id: 'gold_swordfish',
        name: 'Gold Swordfish',
        rarity: 'legendary',
        minWeight: 50,
        maxWeight: 1000,
        baseValue: 400,
        modelData: {
            modelUri: 'models/npcs/gold_swordfish.gltf',
            baseScale: 1.0,
            maxScale: 3.0
        },
        spawnData: {
            baseChance: 2,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 3 },
                'reef': { chance: 3 },
                'wooded_shore': { chance: 1 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 4},
                'boat_house': { chance: 2 },
                'old_dock': { chance: 3 },
                'merch_beach': { chance: 3 },
                'open_ocean': { chance: 22 },
            }
        }
    },
    {
        id: 'great_white_shark',
        name: 'Great White Shark',
        rarity: 'legendary',
        minWeight: 1000,
        maxWeight: 4000,
        baseValue: 500,
        modelData: {
            modelUri: 'models/npcs/great_white_shark.gltf',
            baseScale: 1.0,
            maxScale: 3.0
        },
        spawnData: {
            baseChance: 2,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 4 },
                'reef': { chance: 1 },
                'wooded_shore': { chance: 1 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 1},
                'boat_house': { chance: 2 },
                'old_dock': { chance: 3 },
                'merch_beach': { chance: 3 },
                'open_ocean': { chance: 25 },
            }
        }
    }
];

