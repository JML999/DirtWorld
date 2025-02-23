import { PlayerEntityController, Vector3 } from "hytopia";
import type { PlayerEntity, PlayerInput, PlayerCameraOrientation, Entity, World } from "hytopia";
import { GamePlayerEntity } from "./GamePlayerEntity";
import * as math from './Utils/math';
import type { PlayerState } from "./PlayerStateManager";

export class MyPlayerController extends PlayerEntityController {
    private world: World;
   

    constructor(world: World) {
        super();
        this.world = world;
    }

    onTick = (entity: Entity, deltaTimeMs: number): void => {
        const playerEntity = entity as GamePlayerEntity;
        if (!playerEntity.world) return;

        // Death check
        if (playerEntity.position.y < 0.9) {
            playerEntity.handleDeath();
            return;
        }

        // Swimming check
        if (playerEntity.isInWater(playerEntity)) {
            playerEntity.startSwimming();
        } else {
            playerEntity.stopSwimming();
        }

        // Track jump input state
        const wasJumping = playerEntity.getLastInputState()?.sp || false;
        const isJumping = playerEntity.player.input['sp'] || false;
        
        // Only log when jump state changes
        if (wasJumping !== isJumping) {
            console.log('Jump state changed:', {
                wasJumping,
                isJumping,
                isGrounded: this.isGrounded,
                velocity: playerEntity.linearVelocity.y,
                position: playerEntity.position.y,
                animations: Array.from(playerEntity.modelLoopedAnimations)
            });
        }
        
        // Only allow new jumps, not held jumps
        if (isJumping && !wasJumping) {
            playerEntity.player.input['sp'] = true;
        } else {
            playerEntity.player.input['sp'] = false;
        }
        
        playerEntity.updateLastInputState({ ml: playerEntity.player.input.ml, sp: playerEntity.player.input.sp });
    }

    onTickWithPlayerInput = (entity: PlayerEntity, input: PlayerInput, cameraOrientation: PlayerCameraOrientation, deltaTimeMs: number): void => {
        const playerEntity = entity as GamePlayerEntity;
        if (!playerEntity.world) return;
        const state = playerEntity.stateManager.getState(playerEntity.player);
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
        
        if (!hasRodEquipped) {
            this.handleDigging(playerEntity, input);
        } else {
            this.handleFishing(playerEntity, input, state, hasRodEquipped);
        }

        this.handleMerchantInteractions(playerEntity, input, state);

        if (input['sp']) {
            entity.stopModelAnimations([ 'crawling' ]);
            if (state.swimming.isSwimming) {
              entity.startModelLoopedAnimations([ 'idle' ]);
            }
        }

        // Store last input state
        playerEntity.updateLastInputState({ ml: input.ml });
    }

    private handleDigging(playerEntity: GamePlayerEntity, input: PlayerInput): void {
        if (!input.ml) return;
        const aimResult = this.calculateAimDirection(playerEntity, 1.1);
        if (!aimResult) return;

        const raycastResult = this.world.simulation.raycast(
            aimResult.origin,
            aimResult.direction,
            1.1,
            { filterExcludeRigidBody: playerEntity.rawRigidBody }
        );

        if (raycastResult?.hitEntity) {
            const hitPoint = new Vector3(raycastResult.hitPoint.x, raycastResult.hitPoint.y, raycastResult.hitPoint.z);
            playerEntity.handleBlockHit(raycastResult.hitEntity.id?.toString() || '', hitPoint, playerEntity.player);
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
            input.ml = false;
            playerEntity.handleFishing();
        }
        // Restrict movement while fishing
        
        if (this.isInFishingState(state)) {
            console.log("is in fishing state");
            this.restrictMovement(input);
        }
        playerEntity.setFishingTick();
    }
    
    private shouldStartCasting(input: PlayerInput, state: PlayerState): boolean {
        if (!input.ml) return false;
        if (state.fishing.lastInputState?.ml) return false;
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
}
