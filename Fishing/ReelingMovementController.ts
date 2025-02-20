import type { CaughtFish } from './FishSpawnManager';
import type { GamePlayerEntity } from '../GamePlayerEntity';
import { FISH_CATALOG } from './FishCatalog';

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

    constructor() {
        this.currentDynamicPattern = MovementPattern.DEFAULT;
    }

    calculateInitialVelocity(fish: CaughtFish, rod: any): number {
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
            'common': 0.009,
            'uncommon': 0.010,
            'rare': 0.011,
            'epic': 0.012,
            'legendary': 0.013
        };

        // Additional modifier for caught fish rarity
        const CATCH_RARITY_MULTIPLIER: Record<string, number> = {
            'Common': 1.0,
            'Uncommon': 1.4,
            'Rare': 1.7,
            'Epic': 1.9,
            'Legendary': 2.1
        };

        // Combine both rarity factors
        let baseVelocity = SPECIES_BASE[speciesRarity] || 0.005;
        let rarityMultiplier = CATCH_RARITY_MULTIPLIER[fish.rarity] || 1.0;
        
        let fishVelocity = baseVelocity * rarityMultiplier;

        // Add small value modifier with cap
        const VALUE_MULTIPLIER = 0.000002;
        const MAX_VALUE_CONTRIBUTION = 0.008;
        let valueContribution = Math.min(fish.value * VALUE_MULTIPLIER, MAX_VALUE_CONTRIBUTION);
        
        fishVelocity += valueContribution;

        // Hard cap on final velocity
        const ABSOLUTE_MAX_VELOCITY = 0.0325;
        fishVelocity = Math.min(fishVelocity, ABSOLUTE_MAX_VELOCITY);

        console.log('Fish:', {
            name: fish.name,
            speciesRarity,
            catchRarity: fish.rarity,
            value: fish.value,
            baseVelocity,
            rarityMultiplier,
            valueContribution,
            finalVelocity: fishVelocity
        });

        return fishVelocity;
    }

    getMovementPattern(fish: CaughtFish): MovementPattern {
        // Get species rarity
        const fishType = FISH_CATALOG.find(f => f.name === fish.name.split('_')[0]);
        const speciesRarity = fishType?.rarity || 'common';

        const BASIC_PATTERNS = [
            MovementPattern.DEFAULT,
            MovementPattern.SINE_WAVE,
            MovementPattern.PULSE,
            MovementPattern.ACCELERATING,
            MovementPattern.ZIGZAG,
            MovementPattern.BURST
        ];

        const ADV_PATTERNS = [
            MovementPattern.PULSE,
            MovementPattern.ERRATIC,
            MovementPattern.DEFAULT_TO_ERRATIC,
            MovementPattern.SINE_TO_ERRATIC
        ];

        // Always use advanced patterns for rare+ species
        if (['rare', 'epic', 'legendary'].includes(speciesRarity)) {
            const randomIndex = Math.floor(Math.random() * ADV_PATTERNS.length);
            return ADV_PATTERNS[randomIndex];
        }
        
        // Use advanced patterns for rare+ catches of common species
        if (['Rare', 'Epic', 'Legendary'].includes(fish.rarity)) {
            const randomIndex = Math.floor(Math.random() * ADV_PATTERNS.length);
            return ADV_PATTERNS[randomIndex];
        }

        // Basic patterns for common/uncommon catches of common species
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