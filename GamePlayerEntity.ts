import { Player, PlayerEntity, Vector3 } from 'hytopia';
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

interface InputState {
    ml?: boolean;
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
    
    // State properties
    public isSwimming: boolean = false;
    public isFishing: boolean = false;
    private lastInputState: InputState = {};

    public jumping: boolean = false;

    constructor(player: Player, world: World, levelingSystem: LevelingSystem, stateManager: PlayerStateManager, inventoryManager: InventoryManager, fishingMiniGame: FishingMiniGame, merchantManager: MerchantManager, baitBlockManager: BaitBlockManager, currencyManager: CurrencyManager, controller: PlayerEntityController) {
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
    }

    private setupUIHandlers() {
        this.player.ui.onData = (playerUI: PlayerUI, data: Record<string, any>) => {
            this.handleUIEvent(this.player, data);
        };
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
            case 'welcomeReady':
                console.log('Welcome ready');
                this.stateManager.sendGameMessage(player, "Welcome to phsh! Select your beginner rod in equipment and get fishing!");
                this.setUpInventory()
                break;
        }
    }

    private setUpInventory(){
        this.inventoryManager.addRodById(this.player, 'beginner-rod');
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

    private sendInventoryUIUpdate(player: Player): void {
        const inventory = this.inventoryManager.getInventory(player);
        player.ui.sendData({
            type: 'inventoryUpdate',
            inventory: inventory
        });
    }

    // Utility Methods
    public handleDeath() {
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

}