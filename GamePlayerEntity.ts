import { Player, PlayerEntity, Vector3, PlayerUIEvent } from 'hytopia';
import { InventoryManager } from './Inventory/InventoryManager';
import { PlayerStateManager } from './PlayerStateManager';
import { FishingMiniGame } from './Fishing/FishingMiniGame';
import { MerchantManager } from './MerchantManager';
import { BaitBlockManager } from './Bait/BaitBlockManager';
import type { PlayerEntityController, PlayerUI, World } from 'hytopia';
import type { LevelingSystem } from './LevelingSystem';
import { CurrencyManager } from './CurrencyManager';
import mapData from './assets/maps/map_test.json';
import type { InventoryItem } from './Inventory/Inventory';
import { CRAFTING_RECIPES } from './Crafting/CraftingRecipes';
import type { CraftingManager } from './Crafting/CraftingManager';
import { LeaderboardManager } from './LeaderboardManager';

interface InputState {
    ml?: boolean;
    mr?: boolean;
    sp?: boolean;
}

export class GamePlayerEntity extends PlayerEntity {
    private readonly PLAYER_EYE_HEIGHT = 0.1;
    public inventoryManager: InventoryManager;
    public stateManager: PlayerStateManager;
    private fishingMiniGame: FishingMiniGame;
    private merchantManager: MerchantManager;
    private baitBlockManager: BaitBlockManager;
    private currencyManager: CurrencyManager;
    private craftingManager: CraftingManager;
    
    // State properties
    public isSwimming: boolean = false;
    public isFishing: boolean = false;
    private lastInputState: InputState = {};

    public jumping: boolean = false;

    private maxBreath: number = 100;
    private currentBreath: number = 100;
    private breathDrainRate: number = 10; // Points per second
    private breathRechargeRate: number = 20; // Points per second
    private isDrowning: boolean = false;
    private drowningDamageRate: number = 20; // Damage per second when drowning

    private lastWaterCheckPosition?: Vector3;
    private lastWaterCheckResult: boolean = false;
    private readonly WATER_CHECK_INTERVAL = 100;
    private lastWaterCheckTime: number = 0;

    constructor(player: Player, world: World, levelingSystem: LevelingSystem, stateManager: PlayerStateManager, inventoryManager: InventoryManager, fishingMiniGame: FishingMiniGame, merchantManager: MerchantManager, baitBlockManager: BaitBlockManager, currencyManager: CurrencyManager, controller: PlayerEntityController, craftingManager: CraftingManager) {
        super({
            player,
            name: "Player",
            modelUri: "models/players/player.gltf",
            modelScale: 0.5,
            modelLoopedAnimations: ["idle"],
            controller: controller
        });

        // Initialize managers
        this.inventoryManager = inventoryManager;
        this.stateManager = stateManager;
        this.fishingMiniGame = fishingMiniGame;
        this.merchantManager = merchantManager;
        this.baitBlockManager = baitBlockManager;
        this.currencyManager = currencyManager;
        this.craftingManager = craftingManager;
        this.setupInitialState();
        this.setupUIHandlers();
        player.ui.load("ui/index.html");
    }

    private setupInitialState() {
        // Initialize inventory and give starter items
        // Rod is added in the setUpInventory method due to ui contraints 
        this.inventoryManager.initializePlayerInventory(this.player);
        this.stateManager.initializePlayer(this.player);
        this.currencyManager.initializePlayer(this.player);
        this.sendInventoryUIUpdate(this.player);

        // Initialize breath meter
        this.setupBreathMeter();
    }

    private setupBreathMeter(){
        this.currentBreath = this.maxBreath;
        this.isDrowning = false;
        this.player.ui.sendData({
            type: 'breathUpdate',
            percentage: this.getBreathPercentage()
        });
    }

    private setupUIHandlers() {
        this.player.ui.on(PlayerUIEvent.DATA, ({ playerUI, data }) => {
            this.handleUIEvent(this.player, data);
        });
    }

    // State Management Methods
    public startSwimming() {
        this.isSwimming = true;
        this.startModelOneshotAnimations(['crawling']);
        this.rawRigidBody?.setGravityScale(-1.5);
        this.rawRigidBody?.setLinearDamping(5.0);
    }

    public stopSwimming() {
        this.isSwimming = false;
        this.startModelLoopedAnimations(['idle']);
        this.rawRigidBody?.setGravityScale(1.0);
        this.rawRigidBody?.setLinearDamping(0.0);
    }

    public handleFishing() {
        this.isFishing = true;
        this.fishingMiniGame.onCastStart(this.player);
    }

    public stopFishing() {
        this.isFishing = false;
    }

    public handleMerchantOption(player: Player, merchantId: string, option: number) {
        this.merchantManager.handleMerchantOption(player, merchantId, option);
    }

    public setFishingTick(){
        this.fishingMiniGame.onTick(this.player);
    }

    public handleBlockHit(blockId: string, hitPoint: Vector3, player: Player) {
        this.baitBlockManager.handleBlockHit(blockId, hitPoint, player);
    }

    // UI Event Handling
    private handleUIEvent(player: Player, data: Record<string, any>): void {
        console.log('[Server] Received UI action:', data);

        switch (data.type) {
            case 'disablePlayerInput':
                console.log('[Server] Disabling player input');
                player.ui.lockPointer(false);
                break;
            case 'enablePlayerInput':
                console.log('[Server] Enabling player input');
                player.ui.lockPointer(true);
                break;
            case 'updateGameHeight':
                this.fishingMiniGame.updateUIHeight(data.height);
                break;
            case 'equipItem':
                if (data.itemId) {
                    this.handleEquipItem(player, data.itemId);
                }
                break;
            case 'equipBait':
                console.log("Equipping bait:", data.itemId);
                if (data.itemId) {
                    console.log("Equipping item2:", data.itemId);
                    this.handleEquipItem(player, data.itemId);
                    this.inventoryManager.hookBait(player, data.itemId);
                }
                break;          
            case 'unequipItem':
                if (data.itemType) {
                    this.handleUnequipItem(player, data.itemType);
                }
                break;
            case 'purchaseRod':
                console.log('Purchasing rod:', data.rodId);
                this.stateManager.buyRod(player, data.rodId);
                break;

            case 'useBait':
                console.log('Using bait:', data.itemId);
                this.inventoryManager.hookBait(player, data.itemId);
                break;
            case 'tutorialCompleted':
                console.log('[Server] Tutorial completed');
                // Could update player state to mark tutorial as completed
                // this.stateManager.setTutorialCompleted(player);
                player.ui.lockPointer(true);
                break;
            case 'requestHelp':
                console.log('[Server] Help requested');
                this.showTutorial();
                break;
            case 'welcomeReady':
                console.log('Welcome ready');
              //  this.stateManager.sendGameMessage(player, "Welcome to Fishing Adventure! Select your beginner rod in equipment and get fishing!");
                this.setUpInventory();
                // KEY CHANGE: Show tutorial after UI signals it's ready
                this.checkAndShowTutorial();
                break;
            case 'openCrafting':
                console.log('[Server] Opening crafting menu');
                player.ui.lockPointer(false);
                break;
            
            case 'closeCrafting':
                console.log('[Server] Closing crafting menu');
                player.ui.lockPointer(true);
                break;
            
            case 'requestCraftingRecipes':
                console.log('[Server] Sending crafting recipes to client');
                this.sendCraftingRecipesToClient(player);
                break;
                
            case 'craftItem':
                console.log('[Server] Crafting item with inputs:', data.inputs);
                this.handleCraftItem(player, data.inputs);
                break;
                
            case 'uiReady':
                console.log('[Server] UI components ready, sending initial data');
                // Get the player state manager and update all UI
                const playerStateManager = this.stateManager;
                if (playerStateManager) {
                    playerStateManager.updateAllUI(player);
                } else {
                    console.error('[Server] PlayerStateManager instance not available');
                }
                break;

            case 'requestLeaderboard':
                console.log('[Server] Player requested leaderboard');
                const species = data.species; // Optional, specific species
                LeaderboardManager.instance.sendLeaderboardToPlayer(player, species);
                break;

            case 'dropItem':
                this.handleDropItem(player, data);
                break;
        }
    }

    private setUpInventory(){
        this.inventoryManager.addRodById(this.player, 'beginner-rod');
        this.inventoryManager.equipItem(this.player, 'beginner-rod');
        this.sendInventoryUIUpdate(this.player);
    }

    private handleEquipItem(player: Player, itemId: string): void {
        if (this.isFishing) {
            this.fishingMiniGame.abortFishing(player);
            this.isFishing = false;  // Update local state after abort
        }
        this.inventoryManager.equipItem(player, itemId);
        this.sendInventoryUIUpdate(player);
    }

    private handleUnequipItem(player: Player, itemType: string): void {
        if (this.isFishing) {
            this.fishingMiniGame.abortFishing(player);
            this.isFishing = false;  // Update local state after abort
        }
        this.inventoryManager.unequipItem(player, itemType);
        this.sendInventoryUIUpdate(player);
    }

    private handleDropItem(player: Player, data: Record<string, any>): void {
        if (!data.itemId) {
            console.error('Missing itemId in dropItem request');
            return;
        }
        
        console.log(`Player ${player.id} is dropping item: ${data.itemId}`);
        
        // Get the item from inventory first
        const inventory = this.inventoryManager.getInventory(player);
        const item = inventory?.items.find(i => i.id === data.itemId);
        if (!item) {
            console.error(`Item ${data.itemId} not found in player's inventory`);
            return;
        }
        // Remove the item from inventory
        const success = this.inventoryManager.removeItem(player, data.itemId, 1);
        if (success) {
            // Send confirmation message to player
            this.stateManager.sendGameMessage(player, `You dropped ${item.name}.`);
            this.inventoryManager.updateInventoryUI(player);
            
            // Optionally spawn the item in the world
            // this.spawnDroppedItem(player, item);
        } else {
            console.error(`Failed to remove item ${data.itemId} from inventory`);
        }
    }

    // Optional: Spawn the dropped item in the world
    private spawnDroppedItem(player: Player, item: any): void {
        // Get player position
        const playerEntity = this.world?.entityManager.getPlayerEntitiesByPlayer(player)[0];
        if (!playerEntity) return;
        
        const position = playerEntity.position;
        
        // Create a dropped item entity in the world
        // This is optional and depends on your game mechanics
        // You might want to create a DroppedItemEntity class for this
        
        console.log(`Spawned dropped item ${item.name} at position:`, position);
    }

    private sendInventoryUIUpdate(player: Player): void {
        const inventory = this.inventoryManager.getInventory(player);
        player.ui.sendData({
            type: 'inventoryUpdate',
            inventory: inventory
        });
    }

    private handleCraftItem(player: Player, inputIds: string[]): void {
        console.log("=== SERVER CRAFT REQUEST ===");
        console.log("Input IDs received:", inputIds);
        
        // Filter out null inputs
        const validInputIds = inputIds.filter(id => id !== null);
        
        // Get player inventory for inspection
        const inventory = this.inventoryManager.getInventory(player);
        if (inventory) {
            console.log("Player inventory items:", inventory.items.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                rarity: item.rarity
            })));
        }
        
        // Check if we have a crafting manager
        if (!this.craftingManager) {
            console.error('[Server] Crafting manager not initialized');
            player.ui.sendData({
                type: 'craftingResult',
                success: false,
                result: null
            });
            return;
        }
        
        // For each input ID, get the base item type
        const baseItemTypes = validInputIds.map(id => id.split('_')[0]);
        console.log("Base item types:", baseItemTypes);
        
        // Attempt to craft using the item IDs
        const success = this.craftingManager.handleCraftItem(player, validInputIds);
        console.log('[Server] Crafting result:', success ? 'Success' : 'Failed');
        
        // Send the result back to the client
        player.ui.sendData({
            type: 'craftingResult',
            success,
            result: success ? { name: 'Crafted Item' } : null
        });
    }


    // Utility Methods
    public handleDeath() {
        // Reset breath and notify UI immediately that all bubbles are gone
        this.currentBreath = 0;
        this.player.ui.sendData({
            type: 'breathUpdate',
            percentage: 0
        });

        // After a short delay, reset breath and animate bubbles back
        setTimeout(() => {
            this.currentBreath = this.maxBreath;
            this.isDrowning = false;
            this.player.ui.sendData({
                type: 'breathUpdate',
                percentage: 100,
                animate: true // Add animation flag for UI
            });
        }, 1000); // 1 second delay before reset

        // Existing death handling
        this.stopModelAnimations(['crawling']);
        this.startModelLoopedAnimations(['idle']);
        this.setPosition({ x: 0, y: 10, z: 0 });
        this.rawRigidBody?.setLinearVelocity({ x: 0, y: 0, z: 0 });
        this.rawRigidBody?.setGravityScale(1.0);
        this.rawRigidBody?.setLinearDamping(0.0);
    }

    public updateLastInputState(input: InputState) {
        this.lastInputState = input;
    }

    public getLastInputState() {
        return this.lastInputState;
    }

    getEquippedRod(player: Player) {
        return this.inventoryManager.getEquippedRod(player);
    }

    getEquippedBait(player: Player) {
        return this.inventoryManager.checkBait(player);
    }

    useBait(player: Player, bait: InventoryItem | null) {
        if (!bait) { return; }
        this.inventoryManager.useBait(player, bait.id);
    }

    abortFishing(player: Player) {
        this.fishingMiniGame.abortFishing(player);
        this.isFishing = false;
    }

    isInWater(entity: any) {
        // Create a new object for position to avoid reference issues
        const position = {
            x: entity.position.x,
            y: entity.position.y + this.PLAYER_EYE_HEIGHT,
            z: entity.position.z
        };
        return this.isWaterBlock(position);
    }

    isWaterBlock(position: { x: number, y: number, z: number }): boolean {
        // Create local copy of coordinates
        const x = Math.floor(position.x);
        const y = Math.floor(position.y);
        const z = Math.floor(position.z);
        const blockKey = `${x},${y},${z}`;
        
        // Create local reference to blocks
        const blocks = mapData.blocks as Record<string, number>;
        const blockTypeId = blocks[blockKey];
        
        return blockTypeId === 43 || blockTypeId === 42 || blockTypeId === 100;
    }

    isWaterBelow(entity: any): boolean {
        const startPos = {
            x: Math.floor(entity.position.x),
            y: Math.floor(entity.position.y),
            z: Math.floor(entity.position.z)
        };

        // Loop downward until we hit first block
        for (let y = startPos.y; y > 0; y--) {
            const blockKey = `${startPos.x},${y},${startPos.z}`;
            const blockTypeId = (mapData.blocks as Record<string, number>)[blockKey];
            
            // Skip if air block (undefined)
            if (!blockTypeId) continue;

            // Return true if first block found is water
            return blockTypeId === 43 || blockTypeId === 42 || blockTypeId === 100;
        }

        return false;
    }

    // Then combine both checks
    isInOrOnWater(entity: any): boolean {
        return this.isInWater(entity) || this.isWaterBelow(entity);
    }

    private checkAndShowTutorial() {
        console.log('[Server] Checking if tutorial should be shown...');
        const playerState = this.stateManager.getState(this.player);
        console.log('[Server] Player state:', playerState);
        console.log('[Server] Player level:', this.stateManager.getCurrentLevel(this.player));
        
        if (playerState && this.stateManager.getCurrentLevel(this.player) === 1) {
            console.log('[Server] Showing tutorial for new player');
            this.showTutorial();
        }
    }
    
    private showTutorial() {
        console.log('[Server] Sending tutorial data to UI');
        // Disable player control during tutorial
        this.player.ui.lockPointer(false);
        let username = this.player.username;
        username = username?.trim() || "Player";
        
        // Send tutorial content to UI
        this.player.ui.sendData({
            type: 'showTutorial',
            steps: [
                {
                    title: `Welcome ${this.player.username}!`,
                    text: "Let's learn the basics of phshing! Hit next to begin.",
                    image: "assets/ui/icons/welcome.png"
                },
                {
                    title: "Step 1: Casting",
                    text: "Begin your cast by clicking the right mouse button. Time the meter at the top to get the farthest distance.",
                    image: "assets/ui/icons/casting.png",
                    type: "casting"
                },
                {
                    title: "Step 2: Jigging",
                    text: "Once your line is in the water, TAP 'Q' to jig your line.  Keep your jig around the center for your best chance of luring a fish.",
                    image: "assets/ui/icons/jigging.png",
                    type: "jigging"
                },
                {
                    title: "Step 3: Reeling",
                    text: "When you get a bite, HOLD Q to move your white catch meter to the right. Let go, and it will move left.  Trapping the yellow fish line in the bar fills your progres meter. Once its full, you caught your fish!",
                    image: "assets/ui/icons/reeling.png",
                    type: "reeling"
                },
                {
                    title: "Bait Blocks",
                    text: "Using bait will increase your catch rate. Find a bait block and click left mouse button to break the block. Basic bait provides a modest catch boost for all species, while specialized bait is for specific species. You can equip bait in your inventory.",
                    image: "assets/ui/icons/bait_block.png",
                    type: "bait_block"
                },
                {
                    title: "Go PHSH!",
                    text: "Head to the Beginner's Pond in the middle of the island where catches are guaranteed for new players!",
                    image: "assets/ui/icons/beginners_pond.png"
                }
            ]
        });
    }

    public updateBreath(deltaTimeMs: number): void {
        const deltaTimeSeconds = deltaTimeMs / 1000;
        const inWater = this.isInOrOnWater(this);

        // Only drain if both swimming and in water
        if (inWater) {
            const newBreath = Math.max(0, this.currentBreath - (this.breathDrainRate * deltaTimeSeconds));            
            this.currentBreath = newBreath;
            if (this.currentBreath <= 0) {
                this.isDrowning = true;
                this.handleDrowning(deltaTimeSeconds);
            }
        } else {
            const newBreath = Math.min(this.maxBreath, this.currentBreath + (this.breathRechargeRate * deltaTimeSeconds));
            this.currentBreath = newBreath;
            this.isDrowning = false;
        }

        this.player.ui.sendData({
            type: 'breathUpdate',
            percentage: this.getBreathPercentage()
        });
    }

    private getBreathPercentage(): number {
        // If breath is very low (5% or less), return 0 to show all bubbles empty
        if (this.currentBreath <= 5) {
            return 0;
        }
        return (this.currentBreath / this.maxBreath) * 100;
    }

    private handleDrowning(deltaTimeSeconds: number): void {
        if (this.isDrowning) {
            this.handleDeath();
        }
    }

    private sendCraftingRecipesToClient(player: Player): void {
        // Import the recipes and type from your CraftingRecipes file
        // Send all recipes to the client
        player.ui.sendData({
            type: 'craftingRecipes',
            recipes: CRAFTING_RECIPES.map((recipe: any) => ({
                inputs: recipe.inputs,
                output: {
                    id: recipe.output.id,
                    name: recipe.output.name,
                    type: recipe.output.type,
                    rarity: recipe.output.rarity,
                    quantity: recipe.output.quantity || 1,
                    metadata: recipe.output.metadata
                }
            }))
        });
    }

    public getCurrentBreathPercentage(): number {
        return (this.currentBreath / this.maxBreath) * 100;
    }

    public sendBreathUpdate(percentage: number): void {
        this.player.ui.sendData({
            type: 'breathUpdate',
            percentage: percentage
        });
    }
}