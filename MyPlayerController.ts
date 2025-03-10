import { PlayerEntityController, Vector3, Audio, ColliderShape, CoefficientCombineRule, CollisionGroup } from "hytopia";
import type { PlayerEntity, PlayerInput, PlayerCameraOrientation, Entity, World, BlockType } from "hytopia";
import { GamePlayerEntity } from "./GamePlayerEntity";
import * as math from './Utils/math';
import type { PlayerState } from "./PlayerStateManager";

export class MyPlayerController extends PlayerEntityController {
    private world: World;
    private lastBreathUpdate = 0;
    private lastBreathPercentage = 100;
    private BREATH_UPDATE_INTERVAL = 250; // Only update UI every 250ms
   
    constructor(world: World) {
        super();
        this.world = world;
        console.log("MyPlayerController initialized");
    }

    /**
     * Ticks the player movement for the entity controller,
     * overriding the default implementation.
     */
    public tickWithPlayerInput(entity: PlayerEntity, input: PlayerInput, cameraOrientation: PlayerCameraOrientation, deltaTimeMs: number) {
        // Save the original input state before the parent method modifies it
        const originalInput = { ...input };
        
        // First call the parent implementation to handle basic movement
        super.tickWithPlayerInput(entity, input, cameraOrientation, deltaTimeMs);
        
        if (!entity.isSpawned || !entity.world) return;
        
        const playerEntity = entity as GamePlayerEntity;
        const state = playerEntity.stateManager?.getState(playerEntity.player);
        if (!state) return;

        // Check for movement input and abort fishing if needed
        if ((input.w || input.a || input.s || input.d) && 
            (state.fishing.isPlayerFishing || 
             state.fishing.isCasting || 
             state.fishing.isJigging || 
             state.fishing.reelingGame?.isReeling)) {
            playerEntity.abortFishing(playerEntity.player);
        }

        const hasRodEquipped = !!playerEntity.getEquippedRod(playerEntity.player);
        
        // Use the original input state for digging
        this.handleDigging(playerEntity, originalInput);
        this.handleFishing(playerEntity, input, state, hasRodEquipped);
        this.handleMerchantInteractions(playerEntity, input, state);

        if (input['sp']) {
            entity.stopModelAnimations([ 'crawling' ]);
            if (state.swimming.isSwimming) {
              entity.startModelLoopedAnimations([ 'idle' ]);
            }
        }

        // Store last input state
        playerEntity.updateLastInputState({ ml: originalInput.ml });
    }

    /**
     * Called when the controller is attached to an entity.
     */
    public attach(entity: Entity) {
        // Call the parent implementation first
        super.attach(entity);
        console.log("MyPlayerController attached to entity");
    }

    /**
     * Called when the controlled entity is spawned.
     */
    public spawn(entity: Entity) {
        // Call the parent implementation first
        super.spawn(entity);
        console.log("MyPlayerController entity spawned");
    }

    /**
     * Called every frame for the entity.
     */
    public tick(entity: Entity, deltaTimeMs: number) {
        // Call the parent implementation first
        super.tick(entity, deltaTimeMs);
        
        if (!entity.isSpawned || !entity.world) return;
        
        
        const playerEntity = entity as GamePlayerEntity;
        if (!playerEntity.world) return;

        // Death check
        if (playerEntity.position.y < 0.9) {
            playerEntity.handleDeath();
            return;
        }
        
        // Swimming and breath check - check multiple points around player
        const isInWaterZone = this.checkWaterZone(playerEntity);
        
        if (isInWaterZone) {
            if (!playerEntity.isSwimming) {
                playerEntity.startSwimming();
            }
            playerEntity.updateBreath(deltaTimeMs);
        } else {
            if (playerEntity.isSwimming) {
                playerEntity.stopSwimming();
            }
            if (!playerEntity.isFishing) {
                playerEntity.updateBreath(deltaTimeMs);
            }
        }

        // Only send breath updates when needed
        const currentBreath = playerEntity.getCurrentBreathPercentage();
        const timeSinceLastUpdate = Date.now() - this.lastBreathUpdate;
        
        // Update UI only if:
        // 1. It's been at least BREATH_UPDATE_INTERVAL ms since last update, AND
        // 2. The breath percentage has changed by at least 1%
        if (timeSinceLastUpdate >= this.BREATH_UPDATE_INTERVAL && 
            Math.abs(currentBreath - this.lastBreathPercentage) >= 1) {
            
            playerEntity.sendBreathUpdate(currentBreath);
            this.lastBreathUpdate = Date.now();
            this.lastBreathPercentage = currentBreath;
        }
        
        
        playerEntity.updateLastInputState({ 
            ml: playerEntity.player.input.ml,
            mr: playerEntity.player.input.mr,  // Add mr tracking
            sp: playerEntity.player.input.sp 
        });
    }

    private handleDigging(playerEntity: GamePlayerEntity, input: PlayerInput): void {
        if (!input.ml) return;
        const aimResult = this.calculateAimDirection(playerEntity, 3.0); // Increase range to 3.0
        if (!aimResult) {
            console.log("No aim result calculated");
            return;
        }
    

        const raycastResult = this.world.simulation.raycast(
            aimResult.origin,
            aimResult.direction,
            3.0, // Increase range to 3.0
            { filterExcludeRigidBody: playerEntity.rawRigidBody }
        );

        if (raycastResult?.hitEntity) {
            const hitPoint = new Vector3(raycastResult.hitPoint.x, raycastResult.hitPoint.y, raycastResult.hitPoint.z);
            playerEntity.handleBlockHit(raycastResult.hitEntity.id?.toString() || '', hitPoint, playerEntity.player);
        } else {
            console.log("No entity hit by raycast");
        }
    }

    private handleFishing(
        playerEntity: GamePlayerEntity, 
        input: PlayerInput, 
        state: PlayerState,
        hasRodEquipped: boolean
    ): void {
        if (!hasRodEquipped) return;
        // Handle casting start
        if (this.shouldStartCasting(input, state)) {
            input.mr = false;
            playerEntity.handleFishing();
        }
        // Restrict movement while fishing
        
        if (this.isInFishingState(state)) {
            this.restrictMovement(input);
        }
        playerEntity.setFishingTick();
    }
    
    private shouldStartCasting(input: PlayerInput, state: PlayerState): boolean {
        if (!input.mr) return false;
        if (state.fishing.lastInputState?.mr) return false;
        if (state.fishing.isPlayerFishing) return false;
        if (state.fishing.reelingGame?.isReeling) return false;
        if (state.fishing.lastInputState?.ml) return false; 
        return true;
    }

    private isInFishingState(state: PlayerState): boolean {
        return state.fishing.isCasting || 
               state.fishing.isReeling || 
               state.fishing.isPlayerFishing;
    }

    private restrictMovement(input: PlayerInput): void {
        input.w = false;
        input.a = false;
        input.s = false;
        input.d = false;
    }

    private handleMerchantInteractions(
        playerEntity: GamePlayerEntity, 
        input: PlayerInput, 
        state: PlayerState
    ): void {
        if (!state.merchant?.isInteracting || !state.merchant.currentMerchant) return;
        for (let i = 1; i <= 5; i++) {
            if (playerEntity.player.input[i.toString()]) {
                playerEntity.handleMerchantOption(playerEntity.player, state.merchant.currentMerchant, i - 1);
            }
        }
    }

    protected calculateAimDirection(entity: PlayerEntity, maxDistance: number) { 
        // Get camera orientation
        const camera = entity.player.camera;
        const cameraPos = camera.attachedToEntity?.position;
        const cameraForward = Vector3.fromVector3Like(camera.facingDirection).normalize();

        // Get the vertical angle (pitch) of the camera
        const pitch = camera.orientation.pitch;


        // Project camera forward onto horizontal plane for consistent rotation
        const horizontalForward = new Vector3(
            cameraForward.x,
            0,  // Zero out Y component
            cameraForward.z
        );

        // Calculate right vector for camera offset
        const rightVector = new Vector3(
            -cameraForward.z,
            0,
            cameraForward.x
        ).normalize();

        // Use world up vector to rotate left
        const angleInRadians = -0.23 - pitch*pitch*0.15; 
        const rotatedHorizontal = math.rotateForwardVector(horizontalForward, angleInRadians);
        // Apply the same pitch to our rotated direction

        const finalDirection = new Vector3(
            rotatedHorizontal.x * Math.cos(pitch),
            Math.sin(pitch),
            rotatedHorizontal.z * Math.cos(pitch)
        ).normalize();

        if (!cameraPos) return;

        // Apply right offset only to camera/raycast position
        const rightOffset = camera.filmOffset * 0.038;
        const heightOffset = camera.offset.y ;
        let raycastPos = new Vector3(
            cameraPos.x + rightVector.x * rightOffset,
            cameraPos.y + heightOffset,
            cameraPos.z + rightVector.z * rightOffset
        );

        // Add forward offset based on zoom
        const forwardOffset = -camera.zoom/2;  // Adjust multiplier as needed
        raycastPos.add(Vector3.fromVector3Like(cameraForward).scale(forwardOffset));

        
        // Original projectile origin without right offset
        const originForwardOffset = 0.15;
        const origin = new Vector3(
            entity.position.x + finalDirection.x * originForwardOffset,
            entity.position.y + 0.35 + finalDirection.y * originForwardOffset,
            entity.position.z + finalDirection.z * originForwardOffset
        );
       
        const originOffset = 0.35;
        origin.x += rightVector.x * originOffset;
        origin.z += rightVector.z * originOffset;

        // Raycast from offset camera position
        const raycastResult = this.world?.simulation.raycast(
            raycastPos,
            finalDirection,
            maxDistance,
            { filterExcludeRigidBody: entity.rawRigidBody }
        );

        // If we hit nothing return the max distance point
        const targetPoint = raycastResult?.hitPoint ||
            new Vector3(raycastPos.x, raycastPos.y, raycastPos.z)
                .add(new Vector3(finalDirection.x, finalDirection.y, finalDirection.z).scale(maxDistance));

        // Projectiles Direction from player towards the target point
        const direction = new Vector3(
            targetPoint.x - origin.x,
            targetPoint.y - origin.y,
            targetPoint.z - origin.z
        );

        return { origin, direction };
    }

    private checkWaterZone(playerEntity: GamePlayerEntity): boolean {
        // Check multiple points around the player's head
        const checkPoints = [
            { x: 0, y: 0.3, z: 0 },    // Center
            { x: 0.2, y: 0.3, z: 0 },  // Right
            { x: -0.2, y: 0.3, z: 0 }, // Left
            { x: 0, y: 0.3, z: 0.2 },  // Front
            { x: 0, y: 0.3, z: -0.2 }  // Back
        ];

        // Count how many points are in water
        let waterPoints = 0;
        for (const offset of checkPoints) {
            const pos = {
                x: playerEntity.position.x + offset.x,
                y: playerEntity.position.y + offset.y,
                z: playerEntity.position.z + offset.z
            };
            if (playerEntity.isWaterBlock(pos)) {
                waterPoints++;
            }
        }

        // Consider in water if majority of points are in water
        return waterPoints >= 3;
    }
}
