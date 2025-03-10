import type { CaughtFish } from './FishSpawnManager';
import type { GamePlayerEntity } from '../GamePlayerEntity';
import { FISH_CATALOG } from './FishCatalog';
import type { PlayerStateManager } from '../PlayerStateManager';
import type { Player } from 'hytopia';
interface PatternTransition {
    startPattern: MovementPattern;
    endPattern: MovementPattern;
    triggerCount: number;  // Number of bounces before transition
}

export enum MovementPattern {
    DEFAULT = 'default',
    SINE_WAVE = 'sine_wave',
    ERRATIC = 'erratic',
    SINE_ERRATIC = 'sine_erratic',
    DEFAULT_TO_ERRATIC = 'default_to_erratic',
    SINE_TO_ERRATIC = 'sine_to_erratic',
    PULSE = 'pulse',
    ACCELERATING = 'accelerating',
    ZIGZAG = 'zigzag',
    BURST = 'burst'
}

export class ReelingMovementController {
    private readonly BASE_FISH_SPEED = 0.005;
    private readonly VALUE_SPEED_MULTIPLIER = 0.00002;
    private readonly SINE_FREQUENCY = 0.05;
    private readonly SINE_AMPLITUDE = 0.4;
    private readonly JITTER_AMOUNT = 0.05;
    private readonly PULSE_SLOW_FREQUENCY = 0.02;
    private readonly PULSE_FAST_FREQUENCY = 0.025;
    private readonly PULSE_DURATION = 60;  // Ticks before switching speeds
    private readonly ACCELERATION_RATE = 0.00002;  // How fast it speeds up
    private readonly MAX_ACCELERATION = 2.0;       // Maximum speed multiplier
    private readonly ZIGZAG_INTERVAL = 30;        // Ticks between direction changes
    private readonly BURST_SPEED = 1.8;           // Speed multiplier during burst
    private readonly BURST_DURATION = 20;         // Ticks of burst
    private readonly BURST_COOLDOWN = 60;         // Ticks between bursts

    private readonly PATTERN_TRANSITIONS: Partial<Record<MovementPattern, PatternTransition>> = {
        [MovementPattern.SINE_TO_ERRATIC]: {
            startPattern: MovementPattern.SINE_WAVE,
            endPattern: MovementPattern.ERRATIC,
            triggerCount: 2
        },
        [MovementPattern.DEFAULT_TO_ERRATIC]: {
            startPattern: MovementPattern.DEFAULT,
            endPattern: MovementPattern.ERRATIC,
            triggerCount: 3
        }
    };

    private bounceCount: number = 0;
    private currentDynamicPattern: MovementPattern;
    private activeTransition: PatternTransition | null = null;
    private hasTransitioned: boolean = false;
    private leftBounces: number = 0;
    private rightBounces: number = 0;
    private playerStateManager: PlayerStateManager;
    constructor(playerStateManager: PlayerStateManager) {
        this.currentDynamicPattern = MovementPattern.DEFAULT;
        this.playerStateManager = playerStateManager;
    }

    calculateInitialVelocity(fish: CaughtFish, rod: any, player: Player): number {
        // Fix species rarity lookup
        const fishType = FISH_CATALOG.find(f => f.name === fish.name.split('_')[0]);
        if (!fishType) {
            console.error('Fish type not found in catalog:', fish.id);
            return 0.009; // fallback
        }
        
        // Now fishType.rarity will correctly show 'legendary' for great white shark
        const speciesRarity = fishType.rarity;

        // Base difficulty by species rarity
        const SPECIES_BASE: Record<string, number> = {
            'common': 0.007,
            'uncommon': 0.008,
            'rare': 0.01,
            'epic': 0.012,
            'legendary': 0.014
        };

        // Base multipliers for common/uncommon species
        const CATCH_RARITY_MULTIPLIER: Record<string, number> = {
            'Common': 1.0,
            'Uncommon': 1.4,
            'Rare': 1.7,
            'Epic': 1.9,
            'Legendary': 2.1
        };

        // Custom multipliers for rare species (like grouper)
        const RARE_SPECIES_RARITY_MULTIPLIER: Record<string, number> = {
            'Common': 1.7,
            'Uncommon': 1.725,
            'Rare': 1.75,
            'Epic': 1.775,
            'Legendary': 1.8
        };

        // Custom multipliers for epic species
        const EPIC_SPECIES_RARITY_MULTIPLIER: Record<string, number> = {
            'Common': 1.75,
            'Uncommon': 1.775,
            'Rare': 1.8,
            'Epic': 1.825,
            'Legendary': 1.85
        };

        // Custom multipliers for legendary species
        const LEGENDARY_SPECIES_RARITY_MULTIPLIER: Record<string, number> = {
            'Common': 1.85,
            'Uncommon': 1.9,
            'Rare': 1.925,
            'Epic': 2.0,
            'Legendary': 2.05
        };

        // Combine both rarity factors
        let baseVelocity = SPECIES_BASE[speciesRarity] || 0.005;
        let rarityMultiplier: number;

        // Select the appropriate multiplier scale based on species rarity
        switch (fish.rarity) {
            case 'Rare':
                rarityMultiplier = RARE_SPECIES_RARITY_MULTIPLIER[fish.rarity];
                break;
            case 'Epic':
                rarityMultiplier = EPIC_SPECIES_RARITY_MULTIPLIER[fish.rarity];
                break;
            case 'Legendary':
                rarityMultiplier = LEGENDARY_SPECIES_RARITY_MULTIPLIER[fish.rarity];
                break;
            default:
                rarityMultiplier = CATCH_RARITY_MULTIPLIER[fish.rarity];
                break;
        }
        console.log('Rarity multiplier:', rarityMultiplier, 'for', fish.rarity,  fish.name);

        // Apply the multiplier to the base velocity
        const velocity = baseVelocity * rarityMultiplier;

        // Add small value modifier with cap
        const VALUE_MULTIPLIER = 0.000002;
        const MAX_VALUE_CONTRIBUTION = 0.008;
        let valueContribution = Math.min(fish.value * VALUE_MULTIPLIER, MAX_VALUE_CONTRIBUTION);
        
        const finalVelocity = velocity + valueContribution;

        // Hard cap on final velocity
        const ABSOLUTE_MAX_VELOCITY = 0.0325;
        const playerLevel = this.playerStateManager.getCurrentLevel(player);
        var levelDiscount = 1;
        if (playerLevel > 10) {
            levelDiscount =levelDiscount * 0.98;
        }
        if (playerLevel > 25) {
            levelDiscount =levelDiscount * 0.96;
        }
        if (playerLevel > 30) {
            levelDiscount =levelDiscount * 0.94;
        }
        const equippedBait = this.playerStateManager.getInventory(player)
            ?.items.find(item => 
                item.type === 'bait' && 
                item.equipped === true
            );

        const baitResilliance = equippedBait?.metadata?.baitStats?.resilliance || 1;
        console.log('[FISHING] Found equipped bait:', equippedBait, 'with resilliance:', baitResilliance);
        const fishVelocity = Math.min(finalVelocity, ABSOLUTE_MAX_VELOCITY);
        const v = fishVelocity / baitResilliance * levelDiscount; 
        console.log('Fish:', {
            name: fish.name,
            speciesRarity,
            catchRarity: fish.rarity,
            value: fish.value,
            baseVelocity,
            rarityMultiplier,
            valueContribution,
            finalVelocity: fishVelocity,
            baitResilliance,
            v
        });

        return fishVelocity;
    }

    getMovementPattern(fish: CaughtFish): MovementPattern {
        // Get species rarity
        const fishType = FISH_CATALOG.find(f => f.name === fish.name.split('_')[0]);
        const speciesRarity = fishType?.rarity || 'common';
        const fishSpecies = fish.name.split('_')[0];

        const BASIC_PATTERNS = [
            MovementPattern.DEFAULT,
            MovementPattern.SINE_WAVE,
            MovementPattern.ACCELERATING,
            MovementPattern.ZIGZAG,
            MovementPattern.BURST
        ];

        const ADV_PATTERNS = [
            MovementPattern.PULSE,
            MovementPattern.ZIGZAG,
            MovementPattern.ERRATIC,
            MovementPattern.DEFAULT_TO_ERRATIC,
            MovementPattern.SINE_TO_ERRATIC
        ];

        // List of fish species that should use simpler patterns
        const SIMPLE_FISH = ['sardine', 'mackerel', 'puffer_fish', 'spotted_flounder', 'goldfish', 'cod'];

        // Always use basic patterns for simple fish regardless of rarity
        if (SIMPLE_FISH.includes(fishSpecies)) {
            const randomIndex = Math.floor(Math.random() * BASIC_PATTERNS.length);
            return BASIC_PATTERNS[randomIndex];
        }
        
        // Advanced patterns for rare+ species (that aren't simple fish)
        if (['rare', 'epic', 'legendary'].includes(speciesRarity)) {
            const randomIndex = Math.floor(Math.random() * ADV_PATTERNS.length);
            return ADV_PATTERNS[randomIndex];
        }
        
        // Check fish weight rarity for non-simple fish
        if (fish.rarity === 'Legendary' || fish.rarity === 'Epic') {
            const randomIndex = Math.floor(Math.random() * ADV_PATTERNS.length);
            return ADV_PATTERNS[randomIndex];
        }

        // Basic patterns for all other cases
        const randomIndex = Math.floor(Math.random() * BASIC_PATTERNS.length);
        return BASIC_PATTERNS[randomIndex];
    }

    updateFishPosition(currentPosition: number, velocity: number, pattern: MovementPattern, time: number): {position: number, velocity: number} {
        // Check if this is a transition pattern
        if (this.PATTERN_TRANSITIONS[pattern]) {
            if (!this.activeTransition) {
                const transition = this.PATTERN_TRANSITIONS[pattern];
                if (transition) {
                    this.activeTransition = transition;
                    this.currentDynamicPattern = this.activeTransition.startPattern;
                }
            }

            // Check for transition trigger
            if (!this.hasTransitioned) {
                if (currentPosition <= 0.2) {
                    this.leftBounces++;
                } else if (currentPosition >= 0.8) {
                    this.rightBounces++;
                }
                
                const totalBounces = Math.min(this.leftBounces, this.rightBounces);
                if (this.activeTransition && totalBounces >= this.activeTransition.triggerCount) {
                    this.currentDynamicPattern = this.activeTransition.endPattern;
                    this.hasTransitioned = true;
                }
            }
            pattern = this.currentDynamicPattern;
        }

        switch (pattern) {
            case MovementPattern.SINE_WAVE:
                const newPosition = 0.5 + Math.sin(time * this.SINE_FREQUENCY) * this.SINE_AMPLITUDE;
                // Reduced threshold to make bounce detection more reliable
                if (Math.abs(Math.sin(time * this.SINE_FREQUENCY)) > 0.9) {
                    if (newPosition > 0.8) {
                        this.rightBounces++;                    }
                    if (newPosition < 0.2) {
                        this.leftBounces++;
                    }
                }
                return {
                    position: newPosition,
                    velocity: velocity
                };
                
            case MovementPattern.ERRATIC:
                if (Math.random() < 0.05) velocity *= -1;
                return {
                    position: Math.max(0.1, Math.min(0.9, currentPosition + velocity)),
                    velocity: velocity
                };
                
            case MovementPattern.SINE_ERRATIC:
                const basePos = 0.5 + Math.sin(time * this.SINE_FREQUENCY) * this.SINE_AMPLITUDE;
                
                if (Math.random() < 0.15) {
                    velocity *= (Math.random() < 0.5) ? -1 : (0.5 + Math.random());
                }
                
                const jitter = 0;
                const combinedPos = basePos + (velocity * 0.5) + jitter;
                
                return {
                    position: Math.max(0.1, Math.min(0.9, combinedPos)),
                    velocity: velocity
                };
                
            case MovementPattern.PULSE:
                // Switch frequency based on time
                const isPulseFast = Math.floor(time / this.PULSE_DURATION) % 2 === 0;
                const currentFrequency = isPulseFast ? this.PULSE_FAST_FREQUENCY : this.PULSE_SLOW_FREQUENCY;
                
                const pulsePosition = 0.5 + Math.sin(time * currentFrequency) * this.SINE_AMPLITUDE;
                
                // Add bounce detection for transitions
                if (Math.abs(Math.sin(time * currentFrequency)) > 0.9) {
                    if (pulsePosition > 0.8) {
                        this.rightBounces++;
                    }
                    if (pulsePosition < 0.2) {
                        this.leftBounces++;                    }
                }
                
                return {
                    position: pulsePosition,
                    velocity: velocity
                };
                
            case MovementPattern.ACCELERATING:
                const accelerationMultiplier = Math.min(1 + (time * this.ACCELERATION_RATE), this.MAX_ACCELERATION);
                if (currentPosition <= 0.05 || currentPosition >= 0.95) {
                    velocity *= -1;
                }
                return {
                    position: Math.max(0.05, Math.min(0.95, currentPosition + (velocity * accelerationMultiplier))),
                    velocity: velocity
                };

            case MovementPattern.ZIGZAG:
                if (time % this.ZIGZAG_INTERVAL === 0) {
                    velocity *= -1;
                }
                return {
                    position: Math.max(0.05, Math.min(0.95, currentPosition + velocity)),
                    velocity: velocity
                };

            case MovementPattern.BURST:
                const isBursting = Math.floor(time / this.BURST_DURATION) % 3 === 0;
                const burstMultiplier = isBursting ? this.BURST_SPEED : 1.0;
                if (currentPosition <= 0.05 || currentPosition >= 0.95) {
                    velocity *= -1;
                }
                return {
                    position: Math.max(0.05, Math.min(0.95, currentPosition + (velocity * burstMultiplier))),
                    velocity: velocity
                };
                
            default:
                if (currentPosition <= 0.05 || currentPosition >= 0.95) {
                    velocity *= -1;
                }
                return {
                    position: Math.max(0.05, Math.min(0.95, currentPosition + velocity)),
                    velocity: velocity
                };
        }
    }

    resetState() {
        this.bounceCount = 0;
        this.activeTransition = null;
        this.currentDynamicPattern = MovementPattern.DEFAULT;
        this.hasTransitioned = false;
        this.leftBounces = 0;
        this.rightBounces = 0;
    }
}