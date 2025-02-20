export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'rod' | 'bait' | 'fish' | 'boat' | 'accessory';

export interface FishingStats {
    catchSpeed: number;
    catchRate: number;
    rarityBonus: number;
    sizeBonus: number;
    maxDistance: number;
    luck: number;
    durability?: number;
}

export interface InventoryItem {
    id: string;             // Unique identifier for game logic
    modelId: string;        // ID for the 3D model file
    name: string;
    type: ItemType;
    rarity: ItemRarity;
    value: number;
    quantity: number;
    equipped?: boolean;
    metadata: {
        rodStats?: FishingStats & {
            style?: string;
            specialAbility?: string;
            maxCatchWeight: number;
            custom?: boolean;
        };
        fishStats?: {
            size: number;
            weight: number;
            species: string;
            location?: string;
            timestamp?: number;
            baited?: boolean;
        };
        baitStats?: {
            baseLuck: number;
            targetSpecies?: string[];
            speciesLuck?: {
                [key: string]: number;
            };
            specialEffect?: string;
        };
    }
}

export interface PlayerInventory {
    items: InventoryItem[];
    maxSlots: number;
    equippedRod?: string;  // ID of equipped rod
    equippedBait?: string; // ID of equipped bait
    equippedFish?: string; // ID of equipped fish
}