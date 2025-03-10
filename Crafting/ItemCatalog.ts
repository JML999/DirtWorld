import { Vector3, World } from "hytopia";

// Core fish data structure
interface ItemData {
    id: string;
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    minWeight: number;
    maxWeight: number;
    isBait: boolean;
    description: string;
    baseValue: number;
    modelData: {
        modelUri: string;
        sprite: string;
        baseScale: number;
        maxScale: number;
    };
}

export const ITEM_CATALOG: ItemData[] = [
    {
        id: 'Seaweed',
        name: 'Seaweed',
        rarity: 'common',
        minWeight: 0.1,
        maxWeight: 0.5, 
        isBait: false,
        description: 'A sticky, green seaweed used to make bait.',
        baseValue: 1,
        modelData: {
            modelUri: 'models/environment/waving-grass.gltf',
            sprite: 'seaweed_sprite.png',
            baseScale: 1,
            maxScale: 2.0
        }
    },
    {
        id: 'trash',
        name: 'Trash',
        rarity: 'common',
        minWeight: 0.1,
        maxWeight: 0.5, 
        isBait: false,
        description: 'A sticky, green seaweed. Combine with basic bait to slow down the fish\'s resillance.',
        baseValue: 1,
        modelData: {
            modelUri: 'models/items/trash.gltf',
            sprite: 'trash_sprite.png',
            baseScale: 1,
            maxScale: 2.0
        }
    },
    {
        id: 'fish_head',
        name: 'Fish Head',
        rarity: 'common',
        minWeight: 0.1,
        maxWeight: 0.5, 
        isBait: false,
        description: 'Fish part used to create bait.',
        baseValue: 1,
        modelData: {
            modelUri: 'models/items/fish_head.gltf',
            sprite: 'fish_head_sprite.png',
            baseScale: 1,
            maxScale: 2.0
        }
    },

];
