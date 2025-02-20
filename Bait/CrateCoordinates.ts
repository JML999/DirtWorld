import { Vector3 } from "hytopia";
export const BEGINNER_CRATE_SPAWN_LOCATIONS = [
    {
        id: 'beginner_pond_spawns',
        name: 'Beginner Pond Bait',
        coordinates: [
            new Vector3(-7, 15.5, -2),
            new Vector3(-6, 15.5, 1),
            new Vector3(-6, 15.5, -6),
            new Vector3(-4, 15.5, 10),
            new Vector3(-4, 15.5, 10),
            new Vector3(1, 15.5, -3),
            new Vector3(2, 15.5, -2),
            new Vector3(2, 15.5, 0),
            new Vector3(3, 15.5, 2),
            new Vector3(3, 15.5, 1),
        ],
        baitTypes: ['worm', 'grub'],
        difficulty: 'beginner'
    },
    {
        id: 'moon_beach_spawns',
        name: 'Moon Beach Bait',
        coordinates: [
            new Vector3(-11, 15.5, -13),
            new Vector3(-12, 15.5, -12),
            new Vector3(-15, 15.5, -11),
            new Vector3(-16, 15.5, -12),
            new Vector3(-17, 15.5, -14),
            new Vector3(-18, 15.5, -13),
            new Vector3(-18, 15.5, -12),
            new Vector3(-19, 15.5, -11),
            new Vector3(-20, 15.5, -14),
            new Vector3(-20, 15.5, -12),
        ],
        baitTypes: ['sand_flea', 'crab'],
        difficulty: 'medium'
    },
    {
        id: 'boat_house_spawns',
        name: 'Boat House Bait',
        coordinates: [
            new Vector3(3, 15.5, -20),
            new Vector3(0, 15.5, -25),
            new Vector3(4, 15.5, -26),

        ],
        baitTypes: ['worm', 'cricket'],
        difficulty: 'beginner'
    },
    {
        id: 'old_dock_spawns',
        name: 'Old Dock Bait',
        coordinates: [
            new Vector3(9, 15.5, 0),
            new Vector3(11, 15.5, 0),
            new Vector3(12, 15.5, -1),
            new Vector3(14, 15.5, -3),
            new Vector3(13, 15.5, -4),
            new Vector3(12, 15.5, -5),
            new Vector3(10, 15.5, -6),
            new Vector3(11, 15.5, -7),
            new Vector3(12, 15.5, -7),
            new Vector3(12, 15.5, -8),
        ],
        baitTypes: ['worm', 'cricket'],
        difficulty: 'beginner'
    },
    {
        id: 'pier_spawns',
        name: 'Pier Bait',
        coordinates: [
            new Vector3(5, 15.5, 21),
            new Vector3(4, 15.5, 22),
            new Vector3(3, 15.5, 21),
            new Vector3(-2, 15.5, 15),
            new Vector3(-2, 15.5, 18),
            new Vector3(-4, 15.5, 16),
            new Vector3(-1, 15.5, 24),
            new Vector3(-1, 15.5, 25),
            new Vector3(-2, 15.5, 28),
        ],
        baitTypes: ['shrimp', 'crab'],
        difficulty: 'medium'
    },
    {
        id: 'reef_spawns',
        name: 'Reef Bait',
        coordinates: [
            new Vector3(-24, 15.5, 19),
            new Vector3(-27, 15.5, 16),
            new Vector3(-28, 15.5, 15),
            new Vector3(-13, 15.5, 24),
            new Vector3(-11, 15.5, 25),
            new Vector3(-20, 15.5, 15),
            new Vector3(-18, 5.5, 17),
            new Vector3(-19, 5.5, 18),
            new Vector3(-18, 15.5, 19),
            new Vector3(-17, 15.5, 20),
        ],
        baitTypes: ['shrimp', 'clam'],
        difficulty: 'medium'
    },
    {
        id: 'wooded_spawns',
        name: 'Wooded Bait',
        coordinates: [
            new Vector3(-24, 15.5, 5),
            new Vector3(-25, 15.5, 8),
            new Vector3(-22, 15.5, 9),
            new Vector3(-23, 15.5, 3),
            new Vector3(-22, 15.5, -4),
            new Vector3(-25, 15.5, -7),
            new Vector3(-24, 5.5, -6),
            new Vector3(-23, 5.5, -5),
            new Vector3(-20, 15.5, -2),
            new Vector3(-22, 15.5, 0),
        ],
        baitTypes: ['shrimp', 'clam'],
        difficulty: 'medium'
    }
];

export const CRATE_SPAWN_LOCATIONS = {
    beginner: BEGINNER_CRATE_SPAWN_LOCATIONS,
    // ... future spawn location sets
}; 