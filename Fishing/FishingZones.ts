import { Vector3 } from "hytopia";

export interface FishingZone {
    id: string;
    name: string;
    position: Vector3;
    radius: number;
    depth: number;
    difficulty: 'beginner' | 'medium' | 'advanced';
    restrictedTo: string[];
}

// Base layer - covers entire map
export const OCEAN_ZONE: FishingZone = {
    id: 'open_ocean',
    name: 'Deep Ocean',
    position: new Vector3(0, 0, 0),
    radius: 0,  // Infinite radius
    depth: 100,
    difficulty: 'advanced',
    restrictedTo: []
};

// Geographic zones that overlay the ocean
export const GEOGRAPHIC_ZONES: FishingZone[] = [
    {
        id: 'beginner_waters',
        name: 'Calm Waters',
        position: new Vector3(0, 0, 0),
        radius: 40,
        depth: 50,
        difficulty: 'beginner',
        restrictedTo: []
    }
];

// Local zones that override geographic zones
export const LOCAL_ZONES: FishingZone[] = [
    {
        id: 'beginner_pond',
        name: 'Beginner\'s Pond',
        position: new Vector3(-2, 4, 5),
        radius: 4,
        depth: 1,
        difficulty: 'beginner',
        restrictedTo: ['goldfish', 'orange_koi', 'red_koi', 'red_and_white_koi', 'red_marbled_koi', 'orange_marbled_koi', 'tricolor_koi']
    },
    {
        id: 'moon_beach',
        name: 'Moon Beach',
        position: new Vector3(-18, 3, -18),
        radius: 12,
        depth: 2,
        difficulty: 'medium',
        restrictedTo: []
    },
    {
        id: 'boat_house',
        name: 'Boat House',
        position: new Vector3(1, 3, -28),
        radius: 5,
        depth: 5,
        difficulty: 'beginner',
        restrictedTo: []
    },
    {
        id: 'old_dock',
        name: 'Old Dock',
        position: new Vector3(14, 3, -22),
        radius: 15,
        depth: 20,
        difficulty: 'beginner',
        restrictedTo: []
    },
    {
        id: 'merch_beach',
        name: 'Merchant Beach',
        position: new Vector3(19, 3, 5),
        radius: 5,
        depth: 10,
        difficulty: 'beginner',
        restrictedTo: []
    },
    {
        id: 'pier',
        name: 'Fishing Pier',
        position: new Vector3(-2, 3, 37),
        radius: 10,
        depth: 30,
        difficulty: 'medium',
        restrictedTo: []
    },
    {
        id: 'reef',
        name: 'Coral Reef',
        position: new Vector3(-30, 3, 25),
        radius: 8,
        depth: 20,
        difficulty: 'medium',
        restrictedTo: []
    },
    {
        id: 'wooded_shore',
        name: 'Wooded Shore',
        position: new Vector3(-32, 3, 1),
        radius: 5,
        depth: 5,
        difficulty: 'medium',
        restrictedTo: []
    }, 

    {
        id: 'wooded_pond',
        name: 'Wooded Pond',
        position: new Vector3(-21, 6, 0),
        radius: 2,
        depth: 1,
        difficulty: 'medium',
        restrictedTo: ['goldfish', 'orange_koi', 'red_koi', 'red_and_white_koi', 'red_marbled_koi', 'orange_marbled_koi', 'tricolor_koi']
    },

];