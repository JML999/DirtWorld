export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'rod' | 'bait' | 'fish' | 'boat' | 'accessory' |'item';

export interface FishingStats {
    rarityBonus: number;
    sizeBonus: number;
    maxDistance: number;
    luck: number;
    health?: number;
    damage?: number;
}

export interface InventoryItem {
    id: string;             // Unique identifier for game logic
    modelId: string;  
    sprite: string;
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
            isBaitFish?: boolean;
        };
        baitStats?: {
            baseLuck: number;
            class: string;
            targetSpecies?: string[];
            speciesLuck?: {
                [key: string]: number;
            };
            specialEffect?: string;
            description?: string;
            resilliance?: number;
            strength?: number;
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