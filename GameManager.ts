import { Entity, Vector3, World, RigidBodyType } from 'hytopia';
import { PathfindingEntityController } from 'hytopia';
import { ChickenEntity } from './npcs/ChickenEnttity';
import { LeaderboardManager } from './LeaderboardManager';
import type { MerchantManager } from './MerchantManager';
import type { BaitBlockManager } from './Bait/BaitBlockManager';

interface CloudConfig {
    position: Vector3;
    speed: number;
    direction: Vector3;
    size: number;
}

interface NPCConfig {
    type: 'chicken' | 'fish' | 'other';
    position: Vector3;
    wanderRadius: number;
    modelUri: string;
}

export default class GameManager {
    public static readonly instance = new GameManager();
    
    private world: World | undefined;
    private clouds: Entity[] = [];
    private npcs: Entity[] = [];
    
    private readonly CLOUD_COUNT = 25; // More clouds
    private readonly CLOUD_Y_HEIGHT = 100;
    private readonly CLOUD_SPEED = 0.1;
    private readonly CLOUD_RESPAWN_X = -100;
    private readonly CLOUD_MAX_X = 100;
    private readonly CHICKEN_COUNT = 3;
    private readonly POND_CENTER = new Vector3(-2, 4, 5);
    private readonly POND_RADIUS = 4;
    private chickens: Entity[] = [];
    private readonly PATHFIND_INTERVAL = 10000; // 1 second

    private readonly PLAZA_POINTS = [
        { x: -2.92, y: 4.75, z: 14.68 },
        { x: 6.38, y: 4.75, z: 10.47 },
        { x: 5.75, y: 4.75, z: -1.15 },
        { x: -3.65, y: 4.75, z: -5.61 },
        { x: -11.09, y: 4.75, z: -2.36 },
        { x: -11.52, y: 4.75, z: 10.38 }
    ];

    private constructor() {} // Private constructor for singleton

    public async setupGame(world: World) {
        this.world = world;
        
        // Initialize game systems
        await this.initializeGameSystems();
        

    }


    private async initializeGameSystems() {
        // Initialize core game mechanics
        this.initializeChickens();
        
        // Initialize leaderboards
        await LeaderboardManager.instance.initialize();
        
        // TODO: Add future initialization calls here
        // Example: this.initializeClouds();
        // Example: this.initializeQuests();
    }

    public startRecurringTimers(merchantManager: MerchantManager, baitBlockManager: BaitBlockManager) {
        var time = 5 * 60 * 1000;
        // Start merchant refresh timer
        setInterval(() => merchantManager.refreshCatchOfTheDay(), time);
        setInterval(() => baitBlockManager.cleanupOldBlocks(), time);
        
        // TODO: Add future recurring timers here
        // Example: setInterval(() => this.weatherSystem.update(), WEATHER_UPDATE_INTERVAL);
        // Example: setInterval(() => this.questManager.refreshDailyQuests(), DAILY_QUEST_REFRESH_INTERVAL);
    }


    private initializeChickens() {
        if (!this.world) return;    
        // Convert plaza points to Vector3 objects
        const plazaPointsVectors = this.PLAZA_POINTS.map(p => new Vector3(p.x, p.y, p.z));
        
        for (let i = 0; i < this.CHICKEN_COUNT; i++) {
            // Pick a random plaza point to spawn at
            const spawnPointIndex = Math.floor(Math.random() * this.PLAZA_POINTS.length);
            const spawnPoint = this.PLAZA_POINTS[spawnPointIndex];
            
            // Create chicken entity with plaza points
            const chicken = new ChickenEntity(plazaPointsVectors);
            
            // Set home position to spawn point
            chicken.setHomePosition(new Vector3(spawnPoint.x, spawnPoint.y, spawnPoint.z));
            
            // Spawn the chicken
            chicken.spawn(this.world, spawnPoint);
            
            // Add to chickens array
            this.chickens.push(chicken);
        }
    }

    private isInPond(position: { x: number, y: number, z: number }): boolean {
        const dx = position.x - this.POND_CENTER.x;
        const dz = position.z - this.POND_CENTER.z;
        const distanceSquared = dx * dx + dz * dz;
        return distanceSquared <= (this.POND_RADIUS * this.POND_RADIUS);
    }

    public update() {
        if (!this.world) return;

        // Check cloud positions and reset them if they've gone too far
        this.clouds.forEach(cloud => {
            const pos = cloud.position;
            
            if (pos.x > this.CLOUD_MAX_X) {
                // Reset cloud to starting area with new random Z position
                cloud.setPosition({
                    x: this.CLOUD_RESPAWN_X,
                    y: this.CLOUD_Y_HEIGHT + (Math.random() * 10 - 5),
                    z: Math.random() * 200 - 100
                });
            }
        });

        // Update NPC behaviors (like chicken wandering)
        this.updateNPCs();
    }

    private updateNPCs() {
        this.npcs.forEach(npc => {
            // Add wandering behavior, animations, etc.
            // This could be expanded into a more complex AI system
        });
    }

    // In your message handler

}