import type { InventoryItem, ItemType, ItemRarity } from '../Inventory/Inventory';

export interface BaitDefinition {
    id: string;
    name: string;
    modelId: string;
    sprite: string;
    rarity: ItemRarity;
    class: string;
    description: string;
    harvestChance: number;
    minHarvestAmount: number;
    maxHarvestAmount: number;
    value: number;
    baseLuck: number;
    targetSpecies?: string[];
    speciesLuck?: { [key: string]: number };
    resilliance?: number;
    strength?: number;
}

// BaitService.ts
export class BaitService {
    public static createBaitItem(baitId: string, quantity: number = 1): InventoryItem | null {
        // Strip 'bait_' prefix if present
        const catalogId = baitId.replace(/^bait_/, '');
        const baitDef = BAIT_CATALOG[catalogId];
        
        if (!baitDef) {
            console.error(`Bait definition not found for ID: ${baitId}`);
            return null;
        }
        
        return {
            id: baitDef.id,
            modelId: baitDef.modelId,
            sprite: baitDef.sprite,
            name: baitDef.name,
            type: 'bait',
            rarity: baitDef.rarity,
            value: baitDef.value,
            quantity: quantity,
            metadata: {
                baitStats: {
                    baseLuck: baitDef.baseLuck,
                    class: baitDef.class,
                    targetSpecies: baitDef.targetSpecies || [],
                    speciesLuck: baitDef.speciesLuck || {},
                    description: baitDef.description,
                    resilliance: baitDef.resilliance,
                    strength: baitDef.strength
                }
            }
        };
    }
}

export const BAIT_CATALOG: { [key: string]: BaitDefinition } = {
    'worm': {
        id: 'bait_worm',
        name: 'Worm',
        modelId: 'bait/worm',
        sprite: 'worm_sprite.png',
        rarity: 'common',
        class: 'Basic',
        description: 'Basic bait that can be used to catch a variety of fish.',
        harvestChance: 0.7,
        minHarvestAmount: 1,
        maxHarvestAmount: 3,
        value: 5,
        baseLuck: 1.20,
        targetSpecies: [],
        speciesLuck: {},
        resilliance: 1,
        strength: 1,
    },
    'raw_shrimp': {
        id: 'bait_raw_shrimp',
        name: 'Raw Shrimp',
        modelId: 'models/npcs/shrimp.gltf',
        sprite: 'raw_shrimp_sprite.png',
        rarity: 'common',
        class: 'Basic',
        description: 'Basic bait preferred by larger fish like grouper and tuna.',
        harvestChance: 0.95,
        minHarvestAmount: 1,
        maxHarvestAmount: 2,
        value: 10,
        baseLuck: 0.65,
        targetSpecies: ['Grouper'],
        speciesLuck: {
            'grouper': 1.85,
        },
        resilliance: 1,
        strength: 1,
    },
    'squid_bits': {
        id: 'bait_squid_bits',
        name: 'Squid Bits',
        modelId: 'bait/squid_bits',
        sprite: 'squid_bits.png',
        rarity: 'rare',
        class: 'Specialized',
        description: 'Deep sea bait preferred by large predator fish.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Great White Shark'],
        speciesLuck: {
            'great_white_shark': 1.5,
            'hammerhead_shark': 1.8,
        },
        resilliance: 1,
        strength: 1,
    },
    'bug_roll': {
        id: 'bait_bug_roll',
        name: 'Bug Roll',
        modelId: 'bait/bug_roll',
        sprite: 'bug_roll.png',
        rarity: 'rare',
        class: 'Specialized',
        description: 'Crafted bug bait that boosts rod strength.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Koi Fish'],
        speciesLuck: {
            'orange_koi': 1.9,
            'red_koi': 1.9,
            'red_and_white_koi': 1.9,
            'red_marbled_koi': 1.9,
            'orange_marbled_koi': 1.9,
            'tricolor_koi': 1.9,
        },
        resilliance: 1.00,
        strength: 1.10,
    },
    'rare_bug_roll': {
        id: 'bait_rare_bug_roll',
        name: 'Rare Bug Roll',
        modelId: 'bait/rare_bug_roll',
        sprite: 'rare_bug_roll.png',
        rarity: 'rare',
        class: 'Specialized',
        description: 'Enchanted bait especially effective for freshwater fish.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Koi Fish'],
        speciesLuck: {
            'orange_koi': 1.9,
            'red_koi': 1.9,
            'red_and_white_koi': 1.9,
            'red_marbled_koi': 1.9,
            'orange_marbled_koi': 1.9,
            'tricolor_koi': 1.9,
        },
        resilliance: 1.10,
        strength: 1.10,
    },
    'mythic_bug_roll': {
        id: 'bait_mythic_bug_roll',
        name: 'Mythic Bug Roll',
        modelId: 'bait/mythic_bug_roll',
        sprite: 'mythic_bug_roll.png',
        rarity: 'legendary',
        class: 'Specialized',
        description: 'Enchanted bait especially effective for freshwater fish.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Koi Fish'],
        speciesLuck: {
            'orange_koi': 1.9,
            'red_koi': 1.9,
            'red_and_white_koi': 2.0,
            'red_marbled_koi': 2.0,
            'orange_marbled_koi': 2.0,
            'tricolor_koi': 2.1,
        },
        resilliance: 1.15,
        strength: 1.15,
    },

    'shrimp_roll': {
        id: 'bait_shrimp_roll',
        name: 'Shrimp Roll',
        modelId: 'bait/shrimp_roll',
        sprite: 'shrimp_roll.png',
        rarity: 'rare',
        class: 'Specialized',
        description: 'Crafted shrimp bait that boosts rod strength.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 1.10,
        targetSpecies: ['Tuna', 'Grouper'],
        speciesLuck: {
            'tuna': 1.9,
            'grouper': 1.45,
        },
        resilliance: 1.00,
        strength: 1.10,
    },

    'rare_shrimp_roll': {
        id: 'bait_rare_shrimp_roll',
        name: 'Rare Shrimp Roll',
        modelId: 'bait/rare_shrimp_roll',
        sprite: 'rare_shrimp_roll.png',
        rarity: 'rare',
        class: 'Specialized',
        description: 'Enchanted bait that boosts rod strength and slows fish speed.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Tuna', 'Grouper'],
        speciesLuck: {
            'tuna': 1.9,
            'grouper': 1.45,
        },
        resilliance: 1.10,
        strength: 1.10,
    },
    
    'mythic_shrimp_roll': {
        id: 'bait_mythic_shrimp_roll',
        name: 'Mythic Shrimp Roll',
        modelId: 'bait/mythic_shrimp_roll',
        sprite: 'mythic_shrimp_roll.png',
        rarity: 'legendary',
        class: 'Specialized',
        description: 'Enchanted bait that boosts rod strength and slows fish speed.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Tuna', 'Grouper'],
        speciesLuck: {
            'tuna': 1.9,
            'grouper': 1.45,
        },
        resilliance: 1.15,
        strength: 1.15,
    },


    'sardine_roll': {
        id: 'bait_sardine_roll',
        name: 'Sardine Roll',
        modelId: 'bait/sardine_roll',
        sprite: 'sardine_roll.png',
        rarity: 'rare',
        class: 'Specialized',
        description: 'Crafted deep sea bait that boosts rod strength',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Swordfish'],
        speciesLuck: {
            'swordfish': 1.15,
            'tropical_swordfish': 1.10,
            'gold_swordfish': 1.08,
        },
        resilliance: 1.10,
        strength: 1.10,
    },

    'rare_sardine_roll': {
        id: 'bait_rare_sardine_roll',
        name: 'Rare Sardine Roll',
        modelId: 'bait/rare_sardine_roll',
        sprite: 'rare_sardine_roll.png',
        rarity: 'rare',
        class: 'Specialized',
        description: 'Enchanted deep sea bait that boosts rod strength and slows fish speed.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Swordfish'],
        speciesLuck: {
            'swordfish': 1.15,
            'tropical_swordfish': 1.12,
            'gold_swordfish': 1.10,
        },
        resilliance: 1.10,
        strength: 1.10,
    },

    'mythic_sardine_roll': {
        id: 'bait_mythic_sardine_roll',
        name: 'Mythic Sardine Roll',
        modelId: 'bait/mythic_sardine_roll',
        sprite: 'mythic_sardine_roll.png',
        rarity: 'legendary',
        class: 'Specialized',
        description: 'Enchanted deep sea bait that boosts rod strength and slows fish speed.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Swordfish'],
        speciesLuck: {
            'swordfish': 1.16,
            'tropical_swordfish': 1.13,
            'gold_swordfish': 1.12,
        },
        resilliance: 1.15,
        strength: 1.15,
    },

    'squid_roll': {
        id: 'bait_squid_roll',
        name: 'Squid Roll',
        modelId: 'bait/squid_roll',
        sprite: 'squid_roll.png',
        rarity: 'rare',
        class: 'Specialized',
        description: 'Enchanted deep sea bait that boosts rod strength and slows fish speed.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Sharks'],
        speciesLuck: {
            'hammerhead_shark': 1.10,
            'great_white_shark': 1.08,
        },
        resilliance: 1.05,
        strength: 1.10,
    },

    'rare_squid_roll': {
        id: 'bait_rare_squid_roll',
        name: 'Rare Squid Roll',
        modelId: 'bait/rare_squid_roll',
        sprite: 'rare_squid_roll.png',
        rarity: 'rare',
        class: 'Specialized',
        description: 'Enchanted deep sea bait that boosts rod strength and slows fish speed.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Sharks'],
        speciesLuck: {
            'hammerhead_shark': 1.12,
            'great_white_shark': 1.09,
        },
        resilliance: 1.00,
        strength: 1.00,
    },

    'mythic_squid_roll': {
        id: 'bait_rare_squid_roll',
        name: 'Rare Squid Roll',
        modelId: 'bait/rare_squid_roll',
        sprite: 'rare_squid_roll.png',
        rarity: 'rare',
        class: 'Specialized',
        description: 'Enchanted deep sea bait that boosts rod strength and slows fish speed.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Sharks'],
        speciesLuck: {
            'hammerhead_shark': 1.13,
            'great_white_shark': 1.10,
        },
        resilliance: 1.00,
        strength: 1.00,
    },

    'chum_roll': {
        id: 'bait_chum_roll',
        name: 'Chum Roll',
        modelId: 'bait/chum_roll',
        sprite: 'chum_roll.png',
        rarity: 'rare',
        class: 'Specialized',
        description: 'Enchanted deep sea bait that boosts rod strength and slows fish speed.',
        harvestChance: 0.33,
        minHarvestAmount: 1,
        maxHarvestAmount: 1,
        value: 12,
        baseLuck: 0.85,
        targetSpecies: ['Sharks'],
        speciesLuck: {
            'hammerhead_shark': 1.20,
            'great_white_shark': 1.08,
        },
        resilliance: 1.05,
        strength: 1.05,
    },



};

