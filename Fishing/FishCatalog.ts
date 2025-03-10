import { Vector3, World } from "hytopia";

// Core fish data structure
interface FishData {
    id: string;
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    minWeight: number;
    maxWeight: number;
    isBait: boolean;
    isLoot: boolean;
    baseValue: number;
    modelData: {
        modelUri: string;
        sprite: string;
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
        rodRestrictions?: string[];
    };
}

export const FISH_CATALOG: FishData[] = [
    {
        id: 'goldfish',
        name: 'Goldfish',
        rarity: 'common',
        minWeight: 1,
        maxWeight: 5,
        baseValue: 10,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/goldfish.gltf',
            sprite: 'goldfish_sprite.png',
            baseScale: 0.6,
            maxScale: 0.8
        },
        spawnData: {
            baseChance: 0,
            zoneChances: {
                'beginner_pond': { chance: 10 },
                'pier': { chance: 0 },
                'reef': { chance: 0 },
                'wooded_shore': { chance: 0 },
                'wooded_pond': { chance: 20 },
                'moon_beach': { chance: 0 },
                'boat_house': { chance: 0 },
                'old_dock': { chance: 0 },
                'merch_beach': { chance: 0 },
                'open_ocean': { chance: 0 },
            }
        }
    },
    {
        id: 'mackerel',
        name: 'Mackerel',
        rarity: 'common',
        minWeight: 1,
        maxWeight: 5,
        baseValue: 10,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/mackerel.gltf',
            sprite: 'mackerel_sprite.png',
            baseScale: 0.8,
            maxScale: 1.0
        },
        spawnData: {
            baseChance: 18,
            zoneChances: {
                'beginner_pond': { chance: 5 },
                'pier': { chance: 27 },
                'reef': { chance: 29 },
                'wooded_shore': { chance: 14 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 24 },
                'boat_house': { chance: 26 },
                'old_dock': { chance: 20 },
                'merch_beach': { chance: 24 },
                'open_ocean': { chance: 20 },
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
        isBait: true,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/sardine.gltf',
            sprite: 'sardine_sprite.png',
            baseScale: 0.5,
            maxScale: 0.8
        },
        spawnData: {
            baseChance: 15,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 29 },
                'reef': { chance: 22 },
                'wooded_shore': { chance: 22 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 35 },
                'boat_house': { chance: 20 },
                'old_dock': { chance: 18 },
                'merch_beach': { chance: 17 },
                'open_ocean': { chance: 27 },
            }
        }
    },
    {
        id: 'cod',
        name: 'Cod',
        rarity: 'rare',
        minWeight: 3,
        maxWeight: 12,
        baseValue: 25,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/cod.gltf',
            sprite: 'cod_sprite.png',
            baseScale: 1.1,
            maxScale: 1.4
        },
        spawnData: {
            baseChance: 17,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 25 },
                'reef': { chance: 15 },
                'wooded_shore': { chance: 10 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 15 },
                'boat_house': { chance: 20 },
                'old_dock': { chance: 12 },
                'merch_beach': { chance: 18 },
                'open_ocean': { chance: 20 },
            }
        }
    },
    {
        id: 'squid',
        name: 'Squid',
        rarity: 'rare',
        minWeight: 3,
        maxWeight: 100,
        baseValue: 30,
        isBait: true,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/squid.gltf',
            sprite: 'squid_sprite.png',
            baseScale: 0.2,
            maxScale: 1.4
        },
        spawnData: {
            baseChance: 15,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 20 },
                'reef': { chance: 15 },
                'wooded_shore': { chance: 10 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 14 },
                'boat_house': { chance: 18 },
                'old_dock': { chance: 10 },
                'merch_beach': { chance: 18 },
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
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/goldfin_mackerel.gltf',
            sprite: 'goldfin_mackerel_sprite.png',
            baseScale: 0.75,
            maxScale: 1.2
        },
        spawnData: {
            baseChance: 12,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 12 },
                'reef': { chance: 27 },
                'wooded_shore': { chance: 20 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 20 },
                'boat_house': { chance: 17 },
                'old_dock': { chance: 17 },
                'merch_beach': { chance: 17 },
                'open_ocean': { chance: 17 },
            }
        }
    },
    {
        id: 'pufferfish',
        name: 'Puffer Fish',
        rarity: 'rare',
        minWeight: 2,
        maxWeight: 8,
        baseValue: 25,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/puffer_fish.gltf',
            sprite: 'puffer_fish_sprite.png',
            baseScale: 0.8,
            maxScale: 1.1
        },
        spawnData: {
            baseChance: 23,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 20 },
                'reef': { chance: 30 },
                'wooded_shore': { chance: 15 },
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
        id: 'salmon',
        name: 'Salmon',
        rarity: 'rare',
        minWeight: 10,
        maxWeight: 150,
        baseValue: 50,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/salmon.gltf',
            sprite: 'salmon_sprite.png',
            baseScale: 1.1,
            maxScale: 2.25
        },
        spawnData: {
            baseChance: 17,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 15 },
                'reef': { chance: 10 },
                'wooded_shore': { chance: 25 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 10 },
                'boat_house': { chance: 13 },
                'old_dock': { chance: 10 },
                'merch_beach': { chance: 13 },
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
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/spotted_flounder.gltf',
            sprite: 'spotted_flounder_sprite.png',
            baseScale: 0.8,
            maxScale: 1.4
        },
        spawnData: {
            baseChance: 17,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 13 },
                'reef': { chance: 28 },
                'wooded_shore': { chance: 15 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 20 },
                'boat_house': { chance: 18 },
                'old_dock': { chance: 12 },
                'merch_beach': { chance: 18 },
                'open_ocean': { chance: 20 },
            }
        }
    },

    {
        id: 'grouper',
        name: 'Grouper',
        rarity: 'rare',
        minWeight: 100,
        maxWeight: 300,
        baseValue: 50,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/grouper.gltf',
            sprite: 'grouper_sprite.png',
            baseScale: 1.2,
            maxScale: 2.0
        },
        spawnData: {
            baseChance: 10,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 18 },
                'reef': { chance: 10 },
                'wooded_shore': { chance: 10 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 12 },
                'boat_house': { chance: 13 },
                'old_dock': { chance: 15 },
                'merch_beach': { chance: 13 },
                'open_ocean': { chance: 20 },
            }
        }
    },
    {
        id: 'tuna',
        name: 'Tuna',
        rarity: 'rare',
        minWeight: 10,
        maxWeight: 300,
        baseValue: 50,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/tuna.gltf',
            sprite: 'tuna_sprite.png',
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
                'boat_house': { chance: 33 },
                'old_dock': { chance: 10 },
                'merch_beach': { chance: 25 },
                'open_ocean': { chance: 35 },
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
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/rainbow_flounder.gltf',
            sprite: 'rainbow_flounder_sprite.png',
            baseScale: 0.8,
            maxScale: 1.4
        },
        spawnData: {
            baseChance: 10,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 15 },
                'reef': { chance: 25 },
                'wooded_shore': { chance: 5 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 5 },
                'boat_house': { chance: 5 },
                'old_dock': { chance: 5 },
                'merch_beach': { chance: 5 },
                'open_ocean': { chance: 15 },
            }
        }
    },

    {
        id: 'swordfish',
        name: 'Swordfish',
        rarity: 'epic',
        minWeight: 50,
        maxWeight: 1000,
        baseValue: 100,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/swordfish.gltf',
            sprite: 'swordfish_sprite.png',
            baseScale: 1.0,
            maxScale: 2.0
        },
        spawnData: {
            baseChance: 2,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 3 },
                'reef': { chance: 2 },
                'wooded_shore': { chance: 1 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 1},
                'boat_house': { chance: 1 },
                'old_dock': { chance: 1 },
                'merch_beach': { chance: 1 },
                'open_ocean': { chance: 8 },
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
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/tropical_swordfish.gltf',
            sprite: 'tropical_swordfish_sprite.png',
            baseScale: 1.0,
            maxScale: 2.2
        },
        spawnData: {
            baseChance: 4,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 1 },
                'reef': { chance: 1 },
                'wooded_shore': { chance: 0.5 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 0.5},
                'boat_house': { chance: 0.5 },
                'old_dock': { chance: 1 },
                'merch_beach': { chance: 1 },
                'open_ocean': { chance: 10 },
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
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/hammerhead_shark.gltf',
            sprite: 'hammerhead_shark_sprite.png',
            baseScale: 1.0,
            maxScale: 2
        },
        spawnData: {
            baseChance: 8,
            zoneChances: {
                'pier': { chance: 8 },
                'old_dock': { chance: 5 },
                'boat_house': { chance: 2 },
                'open_ocean': { chance: 8 }
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
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/gold_swordfish.gltf',
            sprite: 'gold_swordfish_sprite.png',
            baseScale: 1.0,
            maxScale: 2.2
        },
        spawnData: {
            baseChance: 2,
            zoneChances: {
                'beginner_pond': { chance: 0 },
                'pier': { chance: 0 },
                'reef': { chance: 0 },
                'wooded_shore': { chance: 0.5 },
                'wooded_pond': { chance: 0 },
                'moon_beach': { chance: 0.5},
                'boat_house': { chance: 0 },
                'old_dock': { chance: 0 },
                'merch_beach': { chance: 0.5 },
                'open_ocean': { chance: 5 },
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
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/great_white_shark.gltf',
            sprite: 'great_white_shark_sprite.png',
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
                'old_dock': { chance: 2 },
                'merch_beach': { chance: 2 },
                'open_ocean': { chance: 8 },
            }
        }
    },
    {
        id: 'orange_koi',
        name: 'Orange Koi',
        rarity: 'rare',
        minWeight: 2,
        maxWeight: 8,
        baseValue: 50,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/orange_koi.gltf',
            sprite: 'orange_koi_fish_sprite.png',
            baseScale: 1,
            maxScale: 2
        },
        spawnData: {
            baseChance: 1, // 33% base chance
            zoneChances: {
                'beginner_pond': { chance: 20 }, // Higher chance in beginner pond
                'wooded_pond': { chance: 20 },   // Good chance in wooded pond
                'pier': { chance: 0 },
                'reef': { chance: 0 },
                'wooded_shore': { chance: 0 },
                'moon_beach': { chance: 0 },
                'boat_house': { chance: 0 },
                'old_dock': { chance: 0 },
                'merch_beach': { chance: 0 },
                'open_ocean': { chance: 0 },
            },
            rodRestrictions: ['fly_rod'] // Only catchable with these rods
        }
    },
    {
        id: 'red_koi',
        name: 'Red Koi',
        rarity: 'rare',
        minWeight: 2,
        maxWeight: 8,
        baseValue: 50,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/red_koi.gltf',
            sprite: 'red_koi_fish_sprite.png',
            baseScale: 1,
            maxScale: 2.0
        },
        spawnData: {
            baseChance: 1, // 33% base chance
            zoneChances: {
                'beginner_pond': { chance: 10 }, // Higher chance in beginner pond
                'wooded_pond': { chance: 10 },   // Good chance in wooded pond
                'pier': { chance: 0 },
                'reef': { chance: 0 },
                'wooded_shore': { chance: 0 },
                'moon_beach': { chance: 0 },
                'boat_house': { chance: 0 },
                'old_dock': { chance: 0 },
                'merch_beach': { chance: 0 },
                'open_ocean': { chance: 0 },
            },
            rodRestrictions: ['fly_rod'] // Only catchable with these rods
        }
    },
    {
        id: 'red_and_white_koi',
        name: 'Red and White Koi',
        rarity: 'epic',
        minWeight: 2,
        maxWeight: 8,
        baseValue: 100,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/red_and_white_koi.gltf',
            sprite: 'red_and_white_koi_fish_sprite.png',
            baseScale: 1,
            maxScale: 2.0
        },
        spawnData: {
            baseChance: 33, // 33% base chance
            zoneChances: {
                'beginner_pond': { chance: 8 }, // Higher chance in beginner pond
                'wooded_pond': { chance: 8 },   // Good chance in wooded pond
                'pier': { chance: 0 },
                'reef': { chance: 0 },
                'wooded_shore': { chance: 0 },
                'moon_beach': { chance: 0 },
                'boat_house': { chance: 0 },
                'old_dock': { chance: 0 },
                'merch_beach': { chance: 0 },
                'open_ocean': { chance: 0 },
            },
            rodRestrictions: ['fly_rod'] // Only catchable with these rods
        }
    },
    {
        id: 'orange_marbled_koi',
        name: 'Orange Marbled Koi',
        rarity: 'epic',
        minWeight: 2,
        maxWeight: 8,
        baseValue: 220,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/orange_marbled_koi.gltf',
            sprite: 'orange_marbled_koi_fish_sprite.png',
            baseScale: 1,
            maxScale: 2.0
        },
        spawnData: {
            baseChance: 1, // 33% base chance
            zoneChances: {
                'beginner_pond': { chance: 8 }, // Higher chance in beginner pond
                'wooded_pond': { chance: 8 },   // Good chance in wooded pond
                'pier': { chance: 0 },
                'reef': { chance: 0 },
                'wooded_shore': { chance: 0 },
                'moon_beach': { chance: 0 },
                'boat_house': { chance: 0 },
                'old_dock': { chance: 0 },
                'merch_beach': { chance: 0 },
                'open_ocean': { chance: 0 },
            },
            rodRestrictions: ['fly_rod'] // Only catchable with these rods
        }
    },

    {
        id: 'red_marbled_koi',
        name: 'Red Marbled Koi',
        rarity: 'epic',
        minWeight: 2,
        maxWeight: 8,
        baseValue: 200,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/red_marbled_koi.gltf',
            sprite: 'red_marbled_koi_fish_sprite.png',
            baseScale: 1,
            maxScale: 2.0
        },
        spawnData: {
            baseChance: 1, // 33% base chance
            zoneChances: {
                'beginner_pond': { chance: 5 }, // Higher chance in beginner pond
                'wooded_pond': { chance: 5 },   // Good chance in wooded pond
                'pier': { chance: 0 },
                'reef': { chance: 0 },
                'wooded_shore': { chance: 0 },
                'moon_beach': { chance: 0 },
                'boat_house': { chance: 0 },
                'old_dock': { chance: 0 },
                'merch_beach': { chance: 0 },
                'open_ocean': { chance: 0 },
            },
            rodRestrictions: ['fly_rod'] // Only catchable with these rods
        }
    },

    {
        id: 'tricolor_koi',
        name: 'Tricolor Koi',
        rarity: 'legendary',
        minWeight: 2,
        maxWeight: 8,
        baseValue: 400,
        isBait: false,
        isLoot: false,
        modelData: {
            modelUri: 'models/npcs/tricolor_koi.gltf',
            sprite: 'tricolor_koi_fish_sprite.png',
            baseScale: 1,
            maxScale: 2.0
        },
        spawnData: {
            baseChance: 1, // 33% base chance
            zoneChances: {
                'beginner_pond': { chance: 2 }, // Higher chance in beginner pond
                'wooded_pond': { chance: 2 },   // Good chance in wooded pond
                'pier': { chance: 0 },
                'reef': { chance: 0 },
                'wooded_shore': { chance: 0 },
                'moon_beach': { chance: 0 },
                'boat_house': { chance: 0 },
                'old_dock': { chance: 0 },
                'merch_beach': { chance: 0 },
                'open_ocean': { chance: 0 },
            },
            rodRestrictions: ['fly_rod'] // Only catchable with these rods
        }
    },
    
    // Loot items
    {
        id: 'seaweed',
        name: 'Seaweed',
        rarity: 'common',
        minWeight: 1,
        maxWeight: 1,
        baseValue: 5,
        isBait: false,
        isLoot: true,  // Flag to identify as loot
        modelData: {
            modelUri: 'models/environment/waving-grass.gltf',
            sprite: 'seaweed_sprite.png',
            baseScale: 1.0,
            maxScale: 1.0
        },
        spawnData: {
            baseChance: 12,
            zoneChances: {
                'beginner_pond': { chance: 10 },
                'pier': { chance: 15 },
                'reef': { chance: 12 },
                'wooded_shore': { chance: 15 },
                'wooded_pond': { chance: 10 },
                'moon_beach': { chance: 15 },
                'boat_house': { chance: 15 },
                'old_dock': { chance: 15 },
                'merch_beach': { chance: 15 },
                'open_ocean': { chance: 10 },
            }
        }
    },
    {
        id: 'shrimp',
        name: 'Shrimp',
        rarity: 'common',
        minWeight: 0.5,
        maxWeight: 1,
        baseValue: 3,
        isBait: false,
        isLoot: true,
        modelData: {
            modelUri: 'models/npcs/shrimp.gltf',
            sprite: 'raw_shrimp_sprite.png',
            baseScale: 1.0,
            maxScale: 1.0
        },
        spawnData: {
            baseChance: 10,
            zoneChances: {
                'beginner_pond': { chance: 8 },
                'pier': { chance: 12 },
                'reef': { chance: 8 },
                'wooded_shore': { chance: 15 },
                'wooded_pond': { chance: 8 },
                'moon_beach': { chance: 12 },
                'boat_house': { chance: 12 },
                'old_dock': { chance: 12 },
                'merch_beach': { chance: 12 },
                'open_ocean': { chance: 8 },
            }
        }
    },
    {
        id: 'trash',
        name: 'Trash',
        rarity: 'common',
        minWeight: 1,
        maxWeight: 1,
        baseValue: 5,
        isBait: false,
        isLoot: true,  // Flag to identify as loot
        modelData: {
            modelUri: 'models/items/trash.gltf',
            sprite: 'trash_sprite.png',
            baseScale: 1.0,
            maxScale: 1.0
        },
        spawnData: {
            baseChance: 12,
            zoneChances: {
                'beginner_pond': { chance: 10 },
                'pier': { chance: 15 },
                'reef': { chance: 12 },
                'wooded_shore': { chance: 15 },
                'wooded_pond': { chance: 10 },
                'moon_beach': { chance: 15 },
                'boat_house': { chance: 15 },
                'old_dock': { chance: 15 },
                'merch_beach': { chance: 15 },
                'open_ocean': { chance: 10 },
            }
        }
    },
    {
        id: 'fish_head',
        name: 'Fish Head',
        rarity: 'common',
        minWeight: 1,
        maxWeight: 1,
        baseValue: 5,
        isBait: false,
        isLoot: true,  // Flag to identify as loot
        modelData: {
            modelUri: 'models/items/fish_head.gltf',
            sprite: 'fish_head_sprite.png',
            baseScale: 1.0,
            maxScale: 1.0
        },
        spawnData: {
            baseChance: 12,
            zoneChances: {
                'beginner_pond': { chance: 10 },
                'pier': { chance: 15 },
                'reef': { chance: 12 },
                'wooded_shore': { chance: 15 },
                'wooded_pond': { chance: 10 },
                'moon_beach': { chance: 15 },
                'boat_house': { chance: 15 },
                'old_dock': { chance: 15 },
                'merch_beach': { chance: 15 },
                'open_ocean': { chance: 10 },
            }
        }
    },
];

