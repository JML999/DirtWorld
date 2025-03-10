import { Entity, PathfindingEntityController, Vector3, World, EntityEvent } from 'hytopia';
import type { EventPayloads } from 'hytopia';
export class ChickenEntity extends Entity {
    private lastPathfindTime: number = 0;
    private readonly PATHFIND_INTERVAL = 5000; // 5 seconds
    private wanderRadius: number = 5;
    private homePosition: Vector3 = new Vector3(0, 0, 0);
    private plazaPoints: Vector3[] = [];
    
    constructor(plazaPoints: Vector3[]) {
        super({
            controller: new PathfindingEntityController(),
            name: 'Chicken',
            modelUri: 'models/npcs/chicken.gltf',
            modelLoopedAnimations: ['walk'],
            modelScale: 0.5,
            rigidBodyOptions: {
                enabledRotations: { x: false, y: true, z: false },
                ccdEnabled: true,
            }
        });
        
        this.plazaPoints = plazaPoints;
        this.lastPathfindTime = Date.now();
        
        // Register for the tick event
        this.on(EntityEvent.TICK, this.onTick);
    }
    
    private onTick = (payload: EventPayloads[EntityEvent.TICK]): void => {
        const now = Date.now();
        if (now - this.lastPathfindTime > this.PATHFIND_INTERVAL) {
            this.calculateNewPath();
            this.lastPathfindTime = now;
        }
    }
    
    private calculateNewPath(): void {
        const pathfindingController = this.controller as PathfindingEntityController;
        if (!pathfindingController) {
            return;
        }
        
        // 70% chance to go to a plaza point, 30% chance to wander randomly
        if (Math.random() < 0.7) {
            const targetPointIndex = Math.floor(Math.random() * this.plazaPoints.length);
            const targetPoint = this.plazaPoints[targetPointIndex];
            const succeeded = pathfindingController.pathfind(
                { x: targetPoint.x, y: targetPoint.y, z: targetPoint.z }, 
                1, // speed
                {
                    debug: false, // Enable debug logging
                    maxFall: 2,
                    maxJump: 0.25,
                    verticalPenalty: 1,
                    maxOpenSetIterations: 200,
                    pathfindAbortCallback: () => {
                       // console.log(`Chicken ${this.id} pathfinding aborted`);
                    },
                    pathfindCompleteCallback: () => {
                       // console.log(`Chicken ${this.id} reached destination`);
                    },
                    waypointMoveCompleteCallback: () => {
                       // console.log(`Chicken ${this.id} reached waypoint`);
                    },
                    waypointMoveSkippedCallback: () => {
                      //  console.log(`Chicken ${this.id} skipped waypoint`);
                    }
                }
            );
        } else {
            // Random wandering near home position
            const randomPos = {
                x: this.homePosition.x + (Math.random() * this.wanderRadius * 2 - this.wanderRadius),
                y: this.homePosition.y,
                z: this.homePosition.z + (Math.random() * this.wanderRadius * 2 - this.wanderRadius)
            };
            
            const succeeded = pathfindingController.pathfind(randomPos, 1, {
                debug: false,
                maxFall: 2,
                maxJump: 0,
                verticalPenalty: 1,
                maxOpenSetIterations: 200,
            });
        }
    }
    
    public setHomePosition(position: Vector3): void {
        this.homePosition = position;
    }
    
    public setWanderRadius(radius: number): void {
        this.wanderRadius = radius;
    }
    
    // Override spawn to immediately calculate a path
    public override spawn(world: World, position: { x: number, y: number, z: number }): void {
        super.spawn(world, position);
        
        // Force an immediate pathfinding calculation after spawning
        setTimeout(() => {
            this.calculateNewPath();
        }, 1000); // Wait 1 second after spawning to start pathfinding
    }
} 