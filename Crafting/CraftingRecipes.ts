import type { ItemType, ItemRarity, InventoryItem } from '../Inventory/Inventory';
import { BAIT_CATALOG, type BaitDefinition } from '../Bait/BaitCatalog';

export interface CraftingRecipe {
    inputs: string[];
    output: InventoryItem;
}
  
// Helper function to convert BaitDefinition to InventoryItem
function baitDefToInventoryItem(baitDef: BaitDefinition, quantity: number = 1): InventoryItem {
  if (!baitDef) {
    console.error('Attempted to convert undefined bait definition to inventory item');
    throw new Error('Invalid bait definition');
  }
  
  return {
    id: baitDef.id,
    name: baitDef.name,
    quantity: quantity,
    value: baitDef.value,
    sprite: baitDef.sprite,
    modelId: baitDef.modelId,
    type: 'bait' as ItemType,
    rarity: baitDef.rarity,
    metadata: {
      baitStats: {
        baseLuck: baitDef.baseLuck,
        targetSpecies: baitDef.targetSpecies,
        speciesLuck: baitDef.speciesLuck,
        class: baitDef.class,
        description: baitDef.description,
        resilliance: baitDef.resilliance,
        strength: baitDef.strength
      }
    }
  };
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    inputs: ['fish_head', 'seaweed'],
    output: baitDefToInventoryItem(BAIT_CATALOG['chum_roll'])
  },
  {
    inputs: ['worm', 'seaweed'],
    output: baitDefToInventoryItem(BAIT_CATALOG['bug_roll'])
  },
  {
    inputs: ['worm', 'seaweed', 'rare_roe'],
    output: baitDefToInventoryItem(BAIT_CATALOG['rare_bug_roll'])
  },
  {
    inputs: ['worm', 'seaweed', 'mythic_roe'],
    output: baitDefToInventoryItem(BAIT_CATALOG['mythic_bug_roll'])
  },
  {
    inputs: ['raw_shrimp', 'seaweed'],
    output: baitDefToInventoryItem(BAIT_CATALOG['shrimp_roll'])
  },
  {
    inputs: ['raw_shrimp', 'seaweed', 'rare_roe'],
    output: baitDefToInventoryItem(BAIT_CATALOG['rare_shrimp_roll'])
  },
  {
    inputs: ['raw_shrimp', 'seaweed', 'mythic_roe'],
    output: baitDefToInventoryItem(BAIT_CATALOG['mythic_shrimp_roll'])
  },
  {
    inputs: ['sardine', 'seaweed'],
    output: baitDefToInventoryItem(BAIT_CATALOG['sardine_roll'])
  },
  {
    inputs: ['sardine', 'seaweed', 'rare_roe'],
    output: baitDefToInventoryItem(BAIT_CATALOG['rare_sardine_roll'])
  },
  {
    inputs: ['sardine', 'seaweed', 'mythic_roe'],
    output: baitDefToInventoryItem(BAIT_CATALOG['mythic_sardine_roll'])
  },
  {
    inputs: ['squid'],
    output: baitDefToInventoryItem(BAIT_CATALOG['squid_bits'])
  },
  {
    inputs: ['squid', 'seaweed'],
    output: baitDefToInventoryItem(BAIT_CATALOG['squid_roll'])
  },
  {
    inputs: ['squid', 'seaweed', 'rare_roe'],
    output: baitDefToInventoryItem(BAIT_CATALOG['rare_squid_roll'])
  },
  {
    inputs: ['squid', 'seaweed', 'mythic_roe'],
    output: baitDefToInventoryItem(BAIT_CATALOG['mythic_squid_roll'])
  },
  // Add more recipes here
];

// Check a few entries in your BAIT_CATALOG
console.log("Bug Roll bait definition:", BAIT_CATALOG['bug_roll']);
console.log("Bug Roll sprite:", BAIT_CATALOG['bug_roll'].sprite);
