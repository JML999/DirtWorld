import { Player } from 'hytopia';

interface FishingLevel {
    level: number;
    xpRequired: number;
    rewards: {
        tileSlots?: number;
        newFishTypes?: string[];
        newAreas?: string[];
        rodTypes?: string[];
    };
}

export class LevelingSystem {
    private static readonly FISHING_LEVELS: FishingLevel[] = [
        {
            level: 1,
            xpRequired: 0,
            rewards: { 
                tileSlots: 1,
                newFishTypes: ['mackerel'],
                newAreas: ['pier']
            }
        },
        {
            level: 2,
            xpRequired: 100,
            rewards: { 
                tileSlots: 2,
                newFishTypes: ['pufferfish'],
                rodTypes: ['bamboo_rod']
            }
        },
        {
            level: 3,
            xpRequired: 250,
            rewards: { 
                tileSlots: 3,
                newFishTypes: ['grouper'],
                newAreas: ['reef']
            }
        },
        {
            level: 4,
            xpRequired: 500,
            rewards: { 
                tileSlots: 4,
                newFishTypes: ['squid'],
                rodTypes: ['fiber_rod']
            }
        },
        // Add more levels as needed
    ];

    private playerLevels: Map<string, { level: number, xp: number }> = new Map();

    constructor() {}

    public getCurrentLevel(player: Player): number {
        return this.getPlayerData(player).level;
    }

    public getCurrentXP(player: Player): number {
        return this.getPlayerData(player).xp;
    }

    public getXPToNextLevel(player: Player): number {
        const currentLevel = this.getCurrentLevel(player);
        const nextLevel = LevelingSystem.FISHING_LEVELS.find(l => l.level === currentLevel + 1);
        if (!nextLevel) return 0; // Max level reached
        return nextLevel.xpRequired - this.getCurrentXP(player);
    }

    public addXP(player: Player, xp: number): void {
        const playerData = this.getPlayerData(player);
        const oldLevel = playerData.level;
        
        playerData.xp += xp;
        
        // Check for level ups
        while (true) {
            const nextLevel = LevelingSystem.FISHING_LEVELS.find(l => l.level === playerData.level + 1);
            if (!nextLevel || playerData.xp < nextLevel.xpRequired) break;
            
            playerData.level++;
            this.handleLevelUp(player, playerData.level);
        }

        this.savePlayerData(player, playerData);

        // Notify player of XP gain
        player.ui.sendData({
            type: 'xpGain',
            xpGained: xp,
            currentXP: playerData.xp,
            currentLevel: playerData.level,
            xpToNext: this.getXPToNextLevel(player)
        });

        // Send UI update after XP changes
        this.sendLevelUIUpdate(player);
    }

    public calculateFishXP(fish: { rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary', weight: number, minWeight: number, isFirstCatch?: boolean }): number {
        let baseXP = 10;
        
        const rarityMultipliers = {
            common: 1,
            uncommon: 1.5,
            rare: 2,
            epic: 3,
            legendary: 5
        };

        const weightBonus = (fish.weight / fish.minWeight) * 5;
        const firstCatchBonus = fish.isFirstCatch ? 50 : 0;

        return Math.floor(baseXP * rarityMultipliers[fish.rarity] + weightBonus + firstCatchBonus);
    }

    private handleLevelUp(player: Player, newLevel: number): void {
        const levelData = LevelingSystem.FISHING_LEVELS.find(l => l.level === newLevel);
        if (!levelData) return;

        // Notify player of level up and rewards
        player.ui.sendData({
            type: 'levelUp',
            newLevel: newLevel,
            rewards: levelData.rewards
        });

        // Apply rewards
        if (levelData.rewards.tileSlots) {
            // Update tile capacity
            // This would be handled by your inventory/tile system
        }

        if (levelData.rewards.newFishTypes) {
            // Unlock new fish types
            // This would be handled by your fishing system
        }

        if (levelData.rewards.newAreas) {
            // Unlock new fishing areas
            // This would be handled by your area system
        }

        if (levelData.rewards.rodTypes) {
            // Unlock new rod types
            // This would be handled by your inventory system
        }

        // Send UI update after level up
        this.sendLevelUIUpdate(player);
    }

    private getPlayerData(player: Player) {
        const data = this.playerLevels.get(player.id);
        if (!data) {
            const initialData = { level: 1, xp: 0 };
            this.playerLevels.set(player.id, initialData);
            return initialData;
        }
        return data;
    }

    private savePlayerData(player: Player, data: { level: number, xp: number }) {
        this.playerLevels.set(player.id, data);
        // Here you would also save to persistent storage if needed
    }

    // Helper method to get available fish types for current level
    public getAvailableFishTypes(player: Player): string[] {
        const currentLevel = this.getCurrentLevel(player);
        const availableFish = new Set<string>();

        LevelingSystem.FISHING_LEVELS
            .filter(level => level.level <= currentLevel)
            .forEach(level => {
                level.rewards.newFishTypes?.forEach(fish => availableFish.add(fish));
            });

        return Array.from(availableFish);
    }

    // Helper method to get available fishing areas for current level
    public getAvailableAreas(player: Player): string[] {
        const currentLevel = this.getCurrentLevel(player);
        const availableAreas = new Set<string>();

        LevelingSystem.FISHING_LEVELS
            .filter(level => level.level <= currentLevel)
            .forEach(level => {
                level.rewards.newAreas?.forEach(area => availableAreas.add(area));
            });

        return Array.from(availableAreas);
    }

    // Add this method to send UI updates
    private sendLevelUIUpdate(player: Player) {
        const currentLevel = this.getCurrentLevel(player);
        const currentXP = this.getCurrentXP(player);
        const nextLevel = LevelingSystem.FISHING_LEVELS.find(l => l.level === currentLevel + 1);
        const requiredXP = nextLevel ? nextLevel.xpRequired : currentXP;

        player.ui.sendData({
            type: 'levelUpdate',
            level: currentLevel,
            currentXP: currentXP,
            requiredXP: requiredXP
        });
    }

    public onPlayerJoin(player: Player) {
        // Send initial UI update when player joins
        this.sendLevelUIUpdate(player);
    }

    public onPlayerDataLoad(player: Player) {
        // Send UI update when player data is loaded from save
        this.sendLevelUIUpdate(player);
    }
}