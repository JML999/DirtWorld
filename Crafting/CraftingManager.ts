import { Player } from 'hytopia';
import { InventoryManager } from '../Inventory/InventoryManager';
import type { CraftingRecipe } from './CraftingRecipes';
import { CRAFTING_RECIPES } from './CraftingRecipes';
import type { InventoryItem } from '../Inventory/Inventory';

interface Inventory {
  items: InventoryItem[];
}

export class CraftingManager {
  private inventoryManager: InventoryManager;

  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager;
  }

  public handleCraftItem(player: Player, inputIds: string[]): boolean {
    console.log('[Server] Processing craft with items:', inputIds);
    
    // Filter out null inputs
    const validInputIds = inputIds.filter(id => id !== null);
    
    // Find matching recipe using the full item IDs
    const matchingRecipe = this.findMatchingRecipeByIds(validInputIds);
    
    if (matchingRecipe) {
      console.log('[Server] Found matching recipe:', matchingRecipe);
      // Remove input items
      validInputIds.forEach(id => {
        const removed = this.inventoryManager.removeItem(player, id, 1);
        console.log(`[Server] Removed item ${id}: ${removed}`);
      });
      
      // Add output item
      console.log('[Server] Adding output item:', matchingRecipe.output);
      const added = this.inventoryManager.addItem(player, matchingRecipe.output);
      console.log(`[Server] Added output item: ${added}`);
      return true;
    }
    
    console.log('[Server] No matching recipe found');
    return false;
  }

  private findMatchingRecipeByIds(inputIds: string[]): CraftingRecipe | null {
    console.log('[Server] Finding recipe for inputs:', inputIds);
    
    for (const recipe of CRAFTING_RECIPES) {
      console.log('[Server] Checking recipe with inputs:', recipe.inputs);
      
      // Check if the inputs match the recipe
      if (this.areInputsEquivalent(inputIds, recipe.inputs)) {
        return recipe;
      }
    }
    
    return null;
  }

  private areInputsEquivalent(actualInputs: string[], recipeInputs: string[]): boolean {
    if (actualInputs.length !== recipeInputs.length) return false;
    
    // Normalize the inputs for comparison
    const normalizedActual = actualInputs.map(id => this.normalizeItemId(id));
    const normalizedRecipe = recipeInputs.map(id => this.normalizeItemId(id));
    
    
    // Count occurrences of each normalized item
    const countActual: Record<string, number> = {};
    const countRecipe: Record<string, number> = {};
    
    normalizedActual.forEach(item => {
      countActual[item] = (countActual[item] || 0) + 1;
    });
    
    normalizedRecipe.forEach(item => {
      countRecipe[item] = (countRecipe[item] || 0) + 1;
    });
    // Check if counts match for all items
    for (const item in countActual) {
      if (countActual[item] !== countRecipe[item]) {
        return false;
      }
    }
    for (const item in countRecipe) {
      if (countRecipe[item] !== (countActual[item] || 0)) {
        return false;
      }
    }
    console.log('[Server] Recipe match found!');
    return true;
  }

  private normalizeItemId(id: string): string {
    // Convert to lowercase
    let normalized = id.toLowerCase();
    
    // Handle bait items with specific types
    if (normalized.startsWith('bait_')) {
        // Extract the actual bait type instead of just removing the prefix
        normalized = normalized.substring(5); // e.g., 'bait_raw_shrimp' -> 'raw_shrimp'
    }
    
    // Handle fish IDs with timestamps (e.g., sardine_1741482689998_633)
    const fishMatch = normalized.match(/^([a-z_]+)_\d+_\d+$/);
    if (fishMatch) {
        normalized = fishMatch[1]; // Extract just the fish type (e.g., "sardine")
    }
    
    console.log(`[Server] Normalized ${id} to ${normalized}`);
    return normalized;
  }

  public canCraftRecipe(recipe: CraftingRecipe, inventory: Inventory): boolean {
    for (const ingredient of recipe.inputs) {
      const requiredAmount = 1;
      
      // Check for any item type that matches the ingredient ID
      const inventoryItem = inventory.items.find((item: InventoryItem) => 
        item.id === ingredient && (item.type === 'bait' || item.type === 'fish' || item.type === 'item')
      );
      
      // If not found and this is a bait item, check for bait fish
      if (!inventoryItem) {
        // Look for bait fish that could be used instead
        const baitFish = inventory.items.find((item: InventoryItem) => 
          item.type === 'fish' && 
          item.metadata.fishStats?.isBaitFish === true
        );
        
        if (baitFish && baitFish.quantity >= requiredAmount) {
          continue; // We found a suitable bait fish
        }
      }
      
      // If we get here, either we need a regular item or we didn't find a suitable bait fish
      if (!inventoryItem || inventoryItem.quantity < requiredAmount) {
        return false;
      }
    }
    
    return true;
  }

  public craftRecipe(recipe: CraftingRecipe, inventory: Inventory): boolean {
    if (!this.canCraftRecipe(recipe, inventory)) {
      return false;
    }

    // Remove input items
    for (const ingredient of recipe.inputs) {
      const requiredAmount = 1;
      
      // Try to find the regular item first
      let inventoryItem = inventory.items.find((item: InventoryItem) => 
        this.normalizeItemId(item.id) === ingredient
      );
      
      // If not found, check for bait fish
      if (!inventoryItem) {
        const baitFish = inventory.items.find((item: InventoryItem) => 
          item.type === 'fish' && 
          item.metadata.fishStats?.isBaitFish === true &&
          this.normalizeItemId(item.id) === ingredient
        );
        
        if (baitFish) {
          inventoryItem = baitFish;
        }
      }
      
      // Remove the required amount
      if (inventoryItem) {
        inventoryItem.quantity -= requiredAmount;
        if (inventoryItem.quantity <= 0) {
          // Remove item completely if quantity is 0 or less
          const index = inventory.items.indexOf(inventoryItem);
          if (index !== -1) {
            inventory.items.splice(index, 1);
          }
        }
      }
    }

    // Create the crafted item with all necessary properties
    const craftedItem: InventoryItem = {
      id: recipe.output.id,
      name: recipe.output.name,
      type: recipe.output.type,
      rarity: recipe.output.rarity,
      quantity: recipe.output.quantity || 1,
      value: recipe.output.value || 0,
      
      // Include sprite if available
      sprite: recipe.output.sprite || `${recipe.output.id.replace('bait_', '')}.png`,
      
      // Add modelId (required property)
      modelId: recipe.output.modelId || `models/items/${recipe.output.id}.gltf`,
      
      // Ensure metadata is properly copied without adding invalid properties
      metadata: {
        ...recipe.output.metadata
      }
    };

    // For bait items, ensure baitStats are properly set
    if (craftedItem.type === 'bait' && recipe.output.metadata?.baitStats) {
      console.log(`[CRAFTING] Recipe output baitStats: ${JSON.stringify(recipe.output.metadata.baitStats, null, 2)}`);
      console.log(`[CRAFTING] Recipe output description: ${recipe.output.metadata.baitStats.description || 'NO DESCRIPTION IN RECIPE'}`);
      craftedItem.metadata.baitStats = {
        ...recipe.output.metadata.baitStats,
        // Add description to baitStats if it doesn't exist
        description: recipe.output.metadata.baitStats.description || `A crafted ${recipe.output.name} bait`
      };

    }
    // Check if player already has this item
    const existingItem = inventory.items.find(item => 
      item.id === craftedItem.id && item.type === craftedItem.type
    );

    if (existingItem) {
      existingItem.quantity += craftedItem.quantity;
    } else {
      inventory.items.push(craftedItem);
    }

    return true;
  }
}