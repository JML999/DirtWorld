import type { InventoryItem } from './Inventory';

export const FISHING_RODS: InventoryItem[] = [
    {
        id: 'beginner-rod',
        modelId: 'beginner-rod',
        name: 'Beginner Rod',
        type: 'rod',
        rarity: 'common',
        value: 0,
        quantity: 1,
        metadata: {
            rodStats: {
                catchSpeed: 0.1,
                catchRate: 0.1,
                rarityBonus: 0,
                sizeBonus: 0,
                maxDistance: 3,
                luck: 0.3,
                maxCatchWeight: 10,
                custom: true
            }
        }
    },
    {
        id: 'oak_rod',
        modelId: 'oak-rod',
        name: 'Oak Rod',
        type: 'rod',
        rarity: 'uncommon',
        value: 50,
        quantity: 1,
        metadata: {
            rodStats: {
                catchSpeed: 1.2,
                catchRate: 1.2,
                rarityBonus: 0.1,
                sizeBonus: 0.1,
                maxDistance: 12,
                luck: 1.2,
                maxCatchWeight: 25,
                custom: true
            }
        }
    },
    {
        id: 'bamboo_rod_basic',
        modelId: 'fishing-rod',
        name: 'Bamboo Rod',
        type: 'rod',
        rarity: 'uncommon',
        value: 100,
        quantity: 1,
        metadata: {
            rodStats: {
                catchSpeed: 1,
                catchRate: 1,
                rarityBonus: 0,
                sizeBonus: 0,
                maxDistance: 10,
                luck: 1,
                maxCatchWeight: 20,
                custom: false
            }
        }
    },

    {
        id: 'carbon_fiber_rod',
        modelId: 'carbon-rod',
        name: 'Carbon Fiber Rod',
        type: 'rod',
        rarity: 'rare',
        value: 2000,
        quantity: 1,
        metadata: {
            rodStats: {
                catchSpeed: 1.5,
                catchRate: 1.5,
                rarityBonus: 0.2,
                sizeBonus: 0.2,
                maxDistance: 15,
                luck: 1.5,
                maxCatchWeight: 350,
                custom: true
            }
        }
    },
    {
        id: 'deep_sea_rod',
        modelId: 'deep-sea-rod',
        name: 'Deep Sea Rod',
        type: 'rod',
        rarity: 'rare',
        value: 2500,
        quantity: 1,
        metadata: {
            rodStats: {
                catchSpeed: 1.3,
                catchRate: 1.3,
                rarityBonus: 0.3,
                sizeBonus: 0.3,
                maxDistance: 25,
                luck: 1.7,
                maxCatchWeight: 500,
                custom: true
            }
        }
    },
    {
        id: 'onyx_rod',
        modelId: 'onyx-rod',
        name: 'Onyx Rod',
        type: 'rod',
        rarity: 'epic',
        value: 1000,
        quantity: 1,
        metadata: {
            rodStats: {
                catchSpeed: 1.8,
                catchRate: 1.8,
                rarityBonus: 0.4,
                sizeBonus: 0.4,
                maxDistance: 35,
                luck: 5.0,
                maxCatchWeight: 5000,
                custom: true
            }
        }
    },
    {
        id: 'fire_rod',
        modelId: 'fire-rod',
        name: 'Fire Rod',
        type: 'rod',
        rarity: 'epic',
        value: 5000,
        quantity: 1,
        metadata: {
            rodStats: {
                catchSpeed: 3.0,
                catchRate: 3.0,
                rarityBonus: 0.7,
                sizeBonus: 0.5,
                maxDistance: 50,
                specialAbility: "Fire",
                luck: 2.5,
                maxCatchWeight: 650,
                custom: true
            }
        }
    },
    {
        id: 'ice_rod',
        modelId: 'ice-rod',
        name: 'Ice Rod',
        type: 'rod',
        rarity: 'epic',
        value:  5000,
        quantity: 1,
        metadata: {
            rodStats: {
                catchSpeed: 2.5,
                catchRate: 2.5,
                rarityBonus: 0.7,
                sizeBonus: 0.6,
                maxDistance: 45,
                specialAbility: "Ice",
                luck: 3.0,
                maxCatchWeight: 650,
                custom: true
            }
        }
    },
    {
        id: 'royal_rod',
        modelId: 'royal-rod',
        name: 'Royal Rod',
        type: 'rod',
        rarity: 'legendary',
        value:  100000,
        quantity: 1,
        metadata: {
            rodStats: {
                catchSpeed: 3.0,
                catchRate: 3.0,
                rarityBonus: 0.8,
                sizeBonus: 0.8,
                maxDistance: 75,
                luck: 4.0,
                maxCatchWeight: 900,
                custom: true
            }
        }
    },
    {
        id: 'hytopian_rod',
        modelId: 'hytopian-rod',
        name: 'Hytopian Rod',
        type: 'rod',
        rarity: 'legendary',
        value:  250000,
        quantity: 1,
        metadata: {
            rodStats: {
                catchSpeed: 4.0,
                catchRate: 4.0,
                rarityBonus: 1.0,
                sizeBonus: 1.0,
                maxDistance: 100,
                luck: 5.0,
                maxCatchWeight: 99999999999,
                custom: true
            }
        }
    }
];