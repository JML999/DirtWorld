import { Player } from "hytopia";
import { World } from "hytopia";
import { Vector3 } from "hytopia";
import { InventoryManager } from "./Inventory/InventoryManager";
import mapData from './assets/maps/map.json';
import { Entity } from "hytopia";
import type { LevelingSystem } from './LevelingSystem';
import { PIER_FISH_CATALOG } from './fishCatalog';
import type { FishData } from './fishCatalog';
import type { ItemRarity } from './Inventory/Inventory';
import { FishSelector, type CaughtFish } from './FishSelector';

export class FishingMiniGame {
    public reelingGame: ReelingGame;
    public isPlayerFishing = false;
    private isCasting: boolean = false;
    private castPower: number = 0;
    private fishingInterval: NodeJS.Timeout | null = null;
    private fishSelector: FishSelector;
    private currentCatch: CaughtFish | null = null;

    private readonly MAX_POWER = 100;
    private readonly POWER_LOOP_SPEED = 2; // How fast the power increases
    private player: Player | null = null;
    private readonly PLAYER_EYE_HEIGHT = 1.6; // Assuming a default eye height

    private readonly GAME_DURATION = 5000; // 5 seconds instead of 3
    private readonly DEPTH_LEVELS = 3;     // Just 3 depths: shallow, middle, deep
    private fishDepth: number = 0;         // Start at top
    private isJigging: boolean = false;    // Track if game is active
    private readonly GRAVITY = 0.01;          // Reduced for gentler falling
    private readonly BOUNCE_FACTOR = 0.8;    // Keep bounce at 80%
    private readonly JIG_FORCE = -0.1;       // Smaller upward force for gentler nudges
    private fishVelocityY = 0;         
    private uiHeight: number = 300;
    
    constructor(
        private world: World,
        private inventoryManager: InventoryManager,
        private levelingSystem: LevelingSystem
    ) {
        this.reelingGame = new ReelingGame(this.levelingSystem, world, inventoryManager);
        this.fishSelector = new FishSelector(world, inventoryManager, levelingSystem);
    }

    onCastStart(player: Player) {
        if (!this.isCasting) {  // Start the power loop
            this.player = player;
            this.isCasting = true;
            this.castPower = 0;
            player.ui.sendData({
                type: 'castingPowerUpdate',
                power: this.castPower
            });
        } else {  // Stop at current power and cast
            this.isCasting = false;
            const finalPower = this.castPower;
            this.onCastEnd(player);
        }
    }

    onCastEnd(player: Player) {
         this.isPlayerFishing = true;
        const rod = this.inventoryManager.getEquippedRod(player);
        if (!rod) return;

        // Get PlayerEntity for this player
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0];
        if (!playerEntity) return;

        // Get forward direction and negate it to reverse direction
        const rotation = playerEntity.rotation;
        const forwardX = -(2.0 * (rotation.w * rotation.y + rotation.x * rotation.z));
        const forwardZ = -(1.0 - 2.0 * (rotation.x * rotation.x + rotation.y * rotation.y));

        const startPos = {
            x: playerEntity.position.x,
            y: playerEntity.position.y + this.PLAYER_EYE_HEIGHT,
            z: playerEntity.position.z
        };

        const maxDistance = rod.metadata?.rodStats?.maxDistance ?? 10;
        const distance = (this.castPower / 100) * maxDistance;

        // Check if landing position is in water
        const result = this.findFishingSpot(startPos, { x: forwardX, z: forwardZ }, distance);
        if (result.found && result.position) {
            const marker = new Entity({
                name: 'CastMarker',
                modelUri: 'models/npcs/mackerel.gltf',
                modelScale: 0.5
            });
            marker.spawn(this.world, {
                x: result.position.x + 0.5,
                y: result.position.y + 2.5,
                z: result.position.z + 0.5
            });
            // Add debug logs and make sure game starts
            setTimeout(() => {
                marker.despawn();
                this.startFishing(player, result.position!);
            }, 2000);
        } else {
            this.isPlayerFishing = false;
        }
        // Clear UI
        player.ui.sendData({
            type: 'castingPowerUpdate',
            power: null
        });
        this.player = null;
    }

    private findFishingSpot(startPos: { x: number, y: number, z: number }, 
                           forwardDir: { x: number, z: number }, 
                           distance: number): { found: boolean, position?: { x: number, y: number, z: number } } {
        // Calculate end point of cast
        const landingPos = {
            x: startPos.x + forwardDir.x * distance,
            y: startPos.y,
            z: startPos.z + forwardDir.z * distance
        };
        
        console.log("Landing spot (eye level):", landingPos);
        
        // Cast downward from that point
        for (let y = landingPos.y; y > 0; y--) {
            const checkPos = {
                x: Math.floor(landingPos.x),
                y: Math.floor(y),
                z: Math.floor(landingPos.z)
            };
            console.log("Checking for water at:", checkPos);
            
            if (this.isWaterBlock(checkPos)) {
                console.log("Found water at:", checkPos);
                return { found: true, position: checkPos };
            }
        }
        return { found: false };
    }

    private isWaterBlock(position: { x: number, y: number, z: number }): boolean {
        console.log("testing for water block");
        console.log(position);
        const blockKey = `${Math.floor(position.x)},${Math.floor(position.y)},${Math.floor(position.z)}`;
        console.log(blockKey);
        const blockTypeId = (mapData.blocks as Record<string, number>)[blockKey];
        console.log(blockTypeId);
        return blockTypeId === 22;  // Water blocks have ID 22
    }

    private startFishing(player: Player, landingPos: { x: number, y: number, z: number }) {
        console.log("Starting fishing mini-game");
        this.isJigging = true;
        this.fishDepth = 1;  // Start in middle
        this.fishVelocityY = 0;  // Start with no velocity
        this.player = player;
        
        // Show the game UI with new instructions
        player.ui.sendData({
            type: 'startFishing',
            fishDepth: 0.5,  // Start in middle (1/2)
            message: 'Press SPACE to keep the fish from falling! Keep it in the middle zone!'
        });

        setTimeout(() => {
            console.log("Fishing game complete");
            this.isJigging = false;
            this.tryToFish(player);
        }, this.GAME_DURATION);
    }

    // Handle Q/E key presses
    public onTick(player: Player | null) {
        // Handle casting power
        if (this.isCasting && this.player) {
            this.castPower = (this.castPower + this.POWER_LOOP_SPEED) % this.MAX_POWER;
            this.player.ui.sendData({
                type: 'castingPowerUpdate',
                power: this.castPower
            });
        }

        // Handle fish physics
        if (this.isJigging && player?.input) {
            // Apply gravity
            this.fishVelocityY += this.GRAVITY;
            this.fishDepth += this.fishVelocityY;

            // Handle spacebar jig - gentler upward force
            if (player.input['q']) {
                console.log("SPACE pressed!");
                this.fishVelocityY = this.JIG_FORCE;
                player.input['q'] = false;
            }

            // Bounce off walls with full range
            if (this.fishDepth <= 0) {
                this.fishDepth = 0;
                this.fishVelocityY = Math.abs(this.fishVelocityY) * this.BOUNCE_FACTOR;
            } else if (this.fishDepth >= 2) {
                this.fishDepth = 2;
                this.fishVelocityY = -Math.abs(this.fishVelocityY) * this.BOUNCE_FACTOR;
            }

            // Update JIG UI with new fish position
            if (this.player) {
                this.player.ui.sendData({
                    type: 'startFishing',
                    fishDepth: this.fishDepth * 1.25  // Extend range to reach bottom
                });
            }
        }

        // Add reeling game tick
        if (this.reelingGame) {
            this.reelingGame.onTick(player);
        }
    }


    getCastingPower(): number {
        return this.castPower;
    }

    public updateUIHeight(height: number) {
        this.uiHeight = height;
        console.log("Updated UI height:", height);
    }

    // Add method to check if reeling is active
    isReeling(): boolean {
        return this.reelingGame.isReeling;
    }

    private tryToFish(player: Player) {
        this.currentCatch = this.fishSelector.getFish(player, this.fishDepth);
        const success = this.currentCatch !== null;

        // Clear jigging state
        this.isJigging = false;
        if (this.fishingInterval) {
            clearInterval(this.fishingInterval);
        }

        // Always send fishingComplete to dismiss the jig UI
        this.player?.ui.sendData({
            type: 'fishingComplete'
        });

        if (this.currentCatch) {
            console.log("Fish caught: ", this.currentCatch);
            console.log("Success: ", success);
            // Start reeling game
            this.reelingGame.startReeling(player, this.currentCatch);
            this.isPlayerFishing = false;
        } else {
            // Show "no fish" message
            this.isPlayerFishing = false;
            player.ui.sendData({
                type: "fishingStatus",
                message: "No fish took the bait!"
            });
            console.log("No fish took the bait!");
        }
    }


}

class ReelingGame {
    public isReeling = false;
    private player: Player | null = null;
    private fishPosition = 0.5;
    private barPosition = 0.5;
    private fishVelocity = 0.005;  // Original fish movement speed
    private readonly BAR_SPEED = 0.015;  // Original bar speed
    private readonly BAR_WIDTH = 0.2;
    private progress = 25;
    private levelingSystem: LevelingSystem;
    private world: World;
    private inventoryManager: InventoryManager;
    
    // Progress tracking
    private readonly PROGRESS_GAIN = 0.5;
    private readonly PROGRESS_LOSS = 0.3;
    private readonly MAX_PROGRESS = 100;
    private readonly MIN_PROGRESS = 0;
    private currentCatch: CaughtFish | null = null;
    private readonly BASE_FISH_SPEED = 0.005;
    private readonly VALUE_SPEED_MULTIPLIER = 0.00002; // Adjust this value to tune difficulty

    constructor(levelingSystem: LevelingSystem, world: World, inventoryManager: InventoryManager) {
        this.levelingSystem = levelingSystem;
        this.world = world;
        this.inventoryManager = inventoryManager;
    }

    startReeling(player: Player, fish: CaughtFish) {
        this.isReeling = true;
        this.player = player;
        this.currentCatch = fish;
        
        // Reset game state
        this.fishPosition = 0.5;
        this.barPosition = 0.5;
        this.progress = 25;
        
        // Adjust fish velocity based on value
        this.fishVelocity = this.BASE_FISH_SPEED + 
            (this.currentCatch.value * this.VALUE_SPEED_MULTIPLIER);

        console.log(`Starting reeling game with fish speed: ${this.fishVelocity}`);
        
        player.ui.sendData({
            type: 'startReeling'
        });
    }

    onTick(player: Player | null) {
        if (!this.isReeling || !player?.input) return;

        // Update fish and bar positions (existing code)
        this.fishPosition += this.fishVelocity;
        if (this.fishPosition <= 0.1 || this.fishPosition >= 0.9) {
            this.fishVelocity *= -1;
        }

        // Handle space bar input and prevent jump
        if (player.input['q']) {
            this.barPosition = Math.min(1 - this.BAR_WIDTH, this.barPosition + this.BAR_SPEED);
          //  player.input['sp'] = false;  
        } else {
            this.barPosition = Math.max(0, this.barPosition - this.BAR_SPEED);
        }

        // Check if fish is in the target zone
        const fishInZone = this.fishPosition >= this.barPosition && 
                          this.fishPosition <= (this.barPosition + this.BAR_WIDTH);

        // Update progress based on fish position
        if (fishInZone) {
            this.progress = Math.min(this.MAX_PROGRESS, this.progress + this.PROGRESS_GAIN);
        } else {
            this.progress = Math.max(this.MIN_PROGRESS, this.progress - this.PROGRESS_LOSS);
        }

        // Check win/lose conditions
        if (this.progress >= this.MAX_PROGRESS && this.currentCatch) {
            console.log("Fish caught!");
            this.isReeling = false;
            
            // Hide reeling UI first
            player.ui.sendData({
                type: 'hideReeling'
            });

            const fishDetails = this.getFishDetails(this.currentCatch);
            if (fishDetails) {
                this.inventoryManager.addItem(player, {
                    id: this.currentCatch.id,
                    modelId: fishDetails.modelUri,
                    type: 'fish',
                    name: this.currentCatch.name,
                    rarity: this.currentCatch.rarity as ItemRarity,
                    value: this.currentCatch.value,
                    quantity: 1,
                    metadata: {
                        fishStats: {
                            weight: this.currentCatch.weight,
                            size: 0,
                            species: this.currentCatch.name
                        }
                    }
                });

                if (this.levelingSystem?.calculateFishXP) {
                    const xpGained = this.levelingSystem.calculateFishXP({
                        ...this.currentCatch,
                        rarity: this.currentCatch.rarity.toLowerCase() as "common" | "uncommon" | "rare" | "epic" | "legendary",
                        minWeight: fishDetails.minWeight
                    });
                    console.log("XP gained: ", xpGained);
                    console.log("XP gained: ", xpGained);
                    console.log("XP gained: ", xpGained);
                    this.levelingSystem.addXP(player, xpGained);
                }
            }

            player.ui.sendData({
                type: "fishingStatus",
                message: `Caught a ${this.currentCatch.rarity} ${this.currentCatch.name} weighing ${this.currentCatch.weight}lb!`
            });

            // Update inventory UI
            player.ui.sendData({
                type: 'inventoryUpdate',
                inventory: this.inventoryManager.getInventory(player)
            });

            // Display the caught fish
            this.displayFish(player, this.currentCatch);

             // Hide status after delay
            setTimeout(() => {
                player.ui.sendData({
                    type: "fishingStatus",
                    message: null
                });
            }, 2000);
            
        } else if (this.progress <= this.MIN_PROGRESS) {
            console.log("Fish got away!");
            this.isReeling = false;
            
            // Hide reeling UI
            player.ui.sendData({
                type: 'hideReeling'
            });
            player.ui.sendData({
                type: "fishingStatus",
                message: "The fish got away!"
            });
        }
        // Send updates to UI
        player.ui.sendData({
            type: 'updateReeling',
            fishPosition: this.fishPosition,
            barPosition: this.barPosition,
            progress: this.progress
        });
    }

    private getFishDetails(caughtFish: CaughtFish) {
        // Look up the base fish data from catalog
        const fishData = PIER_FISH_CATALOG.fish.find(f => f.name === caughtFish.name);
        if (!fishData) {
            console.error(`Could not find fish data for id: ${caughtFish.id}`);
            return null;
        }
    
        return {
            ...caughtFish,
            modelUri: fishData.modelData.modelUri,
            modelScale: fishData.modelData.baseScale,
            minWeight: fishData.minWeight
            // Add any other static properties we need from the catalog
        };
    }
    
    private displayFish(player: Player, fish: CaughtFish) {
        const playerEntity = this.world.entityManager.getPlayerEntitiesByPlayer(player)[0];
        
        // Remove existing display fish
        const existingDisplays = this.world.entityManager.getAllEntities().filter(
            entity => entity.name === 'displayFish'
        );
        existingDisplays.forEach(entity => entity.despawn());

        // Get fish data from catalog
        const fishData = PIER_FISH_CATALOG.fish.find(f => f.name === fish.name);
        if (!fishData) return;

        // Calculate display scale
        const weightRatio = (fish.weight - fishData.minWeight) / (fishData.maxWeight - fishData.minWeight);
        const scaleMultiplier = fishData.modelData.baseScale + 
            (weightRatio * (fishData.modelData.maxScale - fishData.modelData.baseScale));

        // Create display entity
        const displayEntity = new Entity({
            name: 'displayFish',
            modelUri: fishData.modelData.modelUri,
            modelScale: scaleMultiplier,
           // modelLoopedAnimations: ['swim'],
            parent: playerEntity,
            rigidBodyOptions: {
                angularVelocity: { x: 0, y: Math.PI / 1.5, z: 0 }
            }
        });
        
        displayEntity.spawn(this.world, { x: 0, y: 3, z: 0 });

        // Rotate animation
        let startTime = Date.now();
        const duration = 3000;
        
        const rotateInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                clearInterval(rotateInterval);
                displayEntity.despawn();
                return;
            }
            displayEntity.rotation.y = progress * Math.PI * 2;
        }, 16);
    }

}