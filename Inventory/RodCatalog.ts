import type { InventoryItem } from './Inventory';

export const FISHING_RODS: InventoryItem[] = [
    {
        id: 'beginner-rod',
        modelId: 'beginner-rod',
        sprite: 'beginner_rod_sprite.png',
        name: 'Beginner Rod',
        type: 'rod',
        rarity: 'common',
        value: 0,
        quantity: 1,
        metadata: {
            rodStats: {
                rarityBonus: 0,
                sizeBonus: 0,
                maxDistance: 3,
                luck: 0.3,
                maxCatchWeight: 10,
                custom: true,
                health: 100,
                damage: 0
            }
        }
    },
    {
        id: 'oak_rod',
        modelId: 'oak-rod',
        sprite: 'oak_rod_sprite.png',
        name: 'Oak Rod',
        type: 'rod',
        rarity: 'common',
        value: 175,
        quantity: 1,
        metadata: {
            rodStats: {
                rarityBonus: 0.1,
                sizeBonus: 0.1,
                maxDistance: 8,
                luck: 1.2,
                maxCatchWeight: 100,
                custom: true,
                health: 100,
                damage: 1
            }
        }
    },
    {
        id: 'fly_rod',
        modelId: 'fishing-rod',
        sprite: 'fly_rod_sprite.png',
        name: 'Fly Rod',
        type: 'rod',
        rarity: 'uncommon',
        value: 500,
        quantity: 1,
        metadata: {
            rodStats: {
                rarityBonus: 0,
                sizeBonus: 0,
                maxDistance: 10,
                luck: 1,
                maxCatchWeight: 100,
                custom: false,
                health: 100,
                damage: 20
            }
        }
    },
    {
        id: 'carbon_fiber_rod',
        modelId: 'carbon-rod',
        sprite: 'carbon_fiber_rod_sprite.png',
        name: 'Carbon Fiber Rod',
        type: 'rod',
        rarity: 'rare',
        value: 1000,
        quantity: 1,
        metadata: {
            rodStats: {
                rarityBonus: 0.2,
                sizeBonus: 0.2,
                maxDistance: 10,
                luck: 1.5,
                maxCatchWeight: 550,
                custom: true,
                health: 100,
                damage: 5
            }
        }
    },
    {
        id: 'deep_sea_rod',
        modelId: 'deep-sea-rod',
        sprite: 'deep_sea_rod_sprite.png',
        name: 'Deep Sea Rod',
        type: 'rod',
        rarity: 'rare',
        value: 2000,
        quantity: 1,
        metadata: {
            rodStats: {
                rarityBonus: 0.3,
                sizeBonus: 0.3,
                maxDistance: 25,
                luck: 1.7,
                maxCatchWeight: 350,
                custom: true,
                health: 100,
                damage: 5
            }
        }
    },
    {
        id: 'onyx_rod',
        modelId: 'onyx-rod',
        sprite: 'onyx_rod_sprite.png',
        name: 'Onyx Rod',
        type: 'rod',
        rarity: 'epic',
        value: 10000,
        quantity: 1,
        metadata: {
            rodStats: {
                rarityBonus: 0.4,
                sizeBonus: 0.4,
                maxDistance: 35,
                luck: 5.0,
                maxCatchWeight: 750,
                custom: true,
                health: 100,
                damage: 2
            }
        }
    },
    {
        id: 'fire_rod',
        modelId: 'fire-rod',
        sprite: 'fire_rod_sprite.png',
        name: 'Fire Rod',
        type: 'rod',
        rarity: 'epic',
        value: 3000,
        quantity: 1,
        metadata: {
            rodStats: {
                rarityBonus: 0.7,
                sizeBonus: 0.5,
                maxDistance: 35,
                specialAbility: "Fire",
                luck: 2.5,
                maxCatchWeight: 650,
                custom: true,
                health: 100,
                damage: 5
            }
        }
    },
    {
        id: 'ice_rod',
        modelId: 'ice-rod',
        sprite: 'ice_rod_sprite.png',
        name: 'Ice Rod',
        type: 'rod',
        rarity: 'epic',
        value:  3000,
        quantity: 1,
        metadata: {
            rodStats: {
                rarityBonus: 0.7,
                sizeBonus: 0.6,
                maxDistance: 35,
                specialAbility: "Ice",
                luck: 3.0,
                maxCatchWeight: 650,
                custom: true,
                health: 100,
                damage: 5
            }
        }
    },
    {
        id: 'hytopian_rod',
        modelId: 'hytopian-rod',
        sprite: 'hytopian_rod_sprite.png',
        name: 'Hytopian Rod',
        type: 'rod',
        rarity: 'legendary',
        value:  25000,
        quantity: 1,
        metadata: {
            rodStats: {
                rarityBonus: 1.0,
                sizeBonus: 1.0,
                maxDistance: 45,
                luck: 5.0,
                maxCatchWeight: 99999999999,
                custom: true,
                health: 100,
                damage: 20
            }
        }
    }
];