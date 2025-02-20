import type { InventoryItem, ItemType, ItemRarity } from '../Inventory/Inventory';

export interface BaitDefinition {
    id: string;
    name: string;
    modelId: string;
    rarity: ItemRarity;
    harvestChance: number;
    minHarvestAmount: number;
    maxHarvestAmount: number;
    value: number;
    baseLuck: number;
    targetSpecies?: string[];
    speciesLuck?: { [key: string]: number };
}

export const BAIT_CATALOG: { [key: string]: BaitDefinition } = {
    'worm': {
        id: 'bait_worm',
        name: 'Worm',
        modelId: 'bait/worm',
        rarity: 'common',
        harvestChance: 0.7,
        minHarvestAmount: 1,
        maxHarvestAmount: 3,
        value: 5,
        baseLuck: 1.25,
        targetSpecies: ['sardine', 'mackerel'],
        speciesLuck: {
            'sardine': 1.5,
            'mackerel': 1.5
        }
    },
    'grub': {
        id: 'bait_grub',
        name: 'Grub',
        modelId: 'bait/grub',
        rarity: 'common',
        harvestChance: 0.7,
        minHarvestAmount: 1,
        maxHarvestAmount: 3,
        value: 8,
        baseLuck: 1.33,
        targetSpecies: ['Flounder', 'Pufferfish'],
        speciesLuck: {
            'sardine': 1.6,
            'mackerel': 1.7
        }
    },
    'shrimp': {
        id: 'bait_shrimp',
        name: 'Shrimp',
        modelId: 'bait/shrimp',
        rarity: 'uncommon',
        harvestChance: 0.35,
        minHarvestAmount: 1,
        maxHarvestAmount: 2,
        value: 10,
        baseLuck: 1.35,
        targetSpecies: ['Grouper'],
        speciesLuck: {
            'grouper': 1.85
        }
    },
    'sardine': {
        id: 'bait_sardine',
        name: 'Sardine',
        modelId: 'bait/sardine',
        rarity: 'uncommon',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 1.4,
        targetSpecies: ['Swordfish', 'Sharks'],
        speciesLuck: {
            'grouper': 1.8,
            'swordfish': 1.9,
            'tropical_swordfish': 1.9,
            'golden_swordfish': 1.9,
            'great_white_shark': 1.9
        }
    }
};

