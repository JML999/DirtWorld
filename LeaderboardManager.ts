import { PersistenceManager } from 'hytopia';
import { Player } from 'hytopia';

interface LeaderboardEntry {
    playerName: string;
    playerId: string;
    weight: number;
    value: number;
    timestamp: number;
    location?: string;
}

interface SpeciesLeaderboard {
    byWeight: LeaderboardEntry[];
    byValue: LeaderboardEntry[];
}

export class LeaderboardManager {
    private static _instance: LeaderboardManager;
    private leaderboards: Map<string, SpeciesLeaderboard> = new Map();
    private readonly MAX_ENTRIES = 3; // Top 3 entries per category
    
    private constructor() {
        console.log('[LEADERBOARD] Initializing LeaderboardManager');
    }
    
    public static get instance(): LeaderboardManager {
        if (!LeaderboardManager._instance) {
            LeaderboardManager._instance = new LeaderboardManager();
        }
        return LeaderboardManager._instance;
    }
    
    public async initialize(): Promise<void> {
        try {
            console.log('[LEADERBOARD] Loading leaderboards from global data');
            const leaderboardData = await PersistenceManager.instance.getGlobalData('fishLeaderboards');
            
            if (leaderboardData) {
                // Convert from object to Map
                for (const [species, leaderboard] of Object.entries(leaderboardData)) {
                    this.leaderboards.set(species, leaderboard as SpeciesLeaderboard);
                }
                console.log(`[LEADERBOARD] Loaded leaderboards for ${this.leaderboards.size} species`);
                console.log('[LEADERBOARD] Current leaderboard data:', JSON.stringify(Object.fromEntries(this.leaderboards), null, 2));
            } else {
                console.log('[LEADERBOARD] No existing leaderboards found');
            }
        } catch (e) {
            console.error('[LEADERBOARD] Error loading leaderboards:', e);
        }
    }
    
    private async saveLeaderboards(): Promise<void> {
        try {
            // Convert Map to object for storage
            const leaderboardData: Record<string, SpeciesLeaderboard> = {};
            for (const [species, leaderboard] of this.leaderboards.entries()) {
                leaderboardData[species] = leaderboard;
            }
            
            await PersistenceManager.instance.setGlobalData('fishLeaderboards', leaderboardData);
            console.log('[LEADERBOARD] Leaderboards saved to global data');
            console.log('[LEADERBOARD] Updated leaderboard data:', JSON.stringify(leaderboardData, null, 2));
        } catch (e) {
            console.error('[LEADERBOARD] Error saving leaderboards:', e);
        }
    }
    
    public async recordCatch(
        player: Player, 
        species: string, 
        weight: number, 
        value: number, 
        location?: string
    ): Promise<boolean> {
        try {
            console.log(`[LEADERBOARD] Recording catch: ${species}, ${weight}kg, $${value} by ${player.username}`);
            
            // Get or create leaderboard for this species
            let speciesLeaderboard = this.leaderboards.get(species);
            if (!speciesLeaderboard) {
                speciesLeaderboard = {
                    byWeight: [],
                    byValue: []
                };
                this.leaderboards.set(species, speciesLeaderboard);
            }
            
            const newEntry: LeaderboardEntry = {
                playerName: player.username || player.id,
                playerId: player.id,
                weight,
                value,
                timestamp: Date.now(),
                location
            };
            
            let recordBroken = false;
            
            // Check if this catch makes it into the weight leaderboard
            if (speciesLeaderboard.byWeight.length < this.MAX_ENTRIES || 
                weight > speciesLeaderboard.byWeight[speciesLeaderboard.byWeight.length - 1].weight) {
                
                // Add the new entry
                speciesLeaderboard.byWeight.push(newEntry);
                
                // Sort by weight (descending)
                speciesLeaderboard.byWeight.sort((a, b) => b.weight - a.weight);
                
                // Trim to max entries
                if (speciesLeaderboard.byWeight.length > this.MAX_ENTRIES) {
                    speciesLeaderboard.byWeight = speciesLeaderboard.byWeight.slice(0, this.MAX_ENTRIES);
                }
                
                recordBroken = true;
                console.log(`[LEADERBOARD] New weight record set for ${species}:`, JSON.stringify(speciesLeaderboard.byWeight, null, 2));
            }
            
            // Check if this catch makes it into the value leaderboard
            if (speciesLeaderboard.byValue.length < this.MAX_ENTRIES || 
                value > speciesLeaderboard.byValue[speciesLeaderboard.byValue.length - 1].value) {
                
                // Add the new entry
                speciesLeaderboard.byValue.push(newEntry);
                
                // Sort by value (descending)
                speciesLeaderboard.byValue.sort((a, b) => b.value - a.value);
                
                // Trim to max entries
                if (speciesLeaderboard.byValue.length > this.MAX_ENTRIES) {
                    speciesLeaderboard.byValue = speciesLeaderboard.byValue.slice(0, this.MAX_ENTRIES);
                }
                
                recordBroken = true;
                console.log(`[LEADERBOARD] New value record set for ${species}:`, JSON.stringify(speciesLeaderboard.byValue, null, 2));
            }
            
            // Save if a record was broken
            if (recordBroken) {
                await this.saveLeaderboards();
                console.log(`[LEADERBOARD] New record set for ${species}!`);
            }
            
            return recordBroken;
        } catch (e) {
            console.error('[LEADERBOARD] Error recording catch:', e);
            return false;
        }
    }
    
    public getLeaderboardForSpecies(species: string): SpeciesLeaderboard | null {
        return this.leaderboards.get(species) || null;
    }
    
    public getAllLeaderboards(): Map<string, SpeciesLeaderboard> {
        return new Map(this.leaderboards);
    }
    
    public async sendLeaderboardToPlayer(player: Player, species?: string): Promise<void> {
        try {
            if (species) {
                // Send leaderboard for specific species
                const leaderboard = this.getLeaderboardForSpecies(species);
                if (leaderboard) {
                    player.ui.sendData({
                        type: 'leaderboardUpdate',
                        species,
                        leaderboard
                    });
                    console.log(`[LEADERBOARD] Sent ${species} leaderboard to ${player.id}:`, JSON.stringify(leaderboard, null, 2));
                }
            } else {
                // Send all leaderboards
                const allLeaderboards: Record<string, SpeciesLeaderboard> = {};
                for (const [species, leaderboard] of this.leaderboards.entries()) {
                    allLeaderboards[species] = leaderboard;
                }
                
                player.ui.sendData({
                    type: 'leaderboardUpdate',
                    allLeaderboards
                });
                console.log(`[LEADERBOARD] Sent all leaderboards to ${player.id}:`, JSON.stringify(allLeaderboards, null, 2));
            }
        } catch (e) {
            console.error('[LEADERBOARD] Error sending leaderboard to player:', e);
        }
    }
    
    // Debug method to print all leaderboard data
    public printAllLeaderboards(): void {
        console.log('[LEADERBOARD] === CURRENT LEADERBOARD DATA ===');
        if (this.leaderboards.size === 0) {
            console.log('[LEADERBOARD] No leaderboard data available');
        } else {
            for (const [species, leaderboard] of this.leaderboards.entries()) {
                console.log(`[LEADERBOARD] Species: ${species}`);
                console.log('[LEADERBOARD] By Weight:', JSON.stringify(leaderboard.byWeight, null, 2));
                console.log('[LEADERBOARD] By Value:', JSON.stringify(leaderboard.byValue, null, 2));
            }
        }
        console.log('[LEADERBOARD] === END OF LEADERBOARD DATA ===');
    }
}