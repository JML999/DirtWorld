/**
 * HYTOPIA SDK Boilerplate
 * 
 * This is a simple boilerplate to get started on your project.
 * It implements the bare minimum to be able to run and connect
 * to your game server and run around as the basic player entity.
 * 
 * From here you can begin to implement your own game logic
 * or do whatever you want!
 * 
 * You can find documentation here: https://github.com/hytopiagg/sdk/blob/main/docs/server.md
 * 
 * For more in-depth examples, check out the examples folder in the SDK, or you
 * can find it directly on GitHub: https://github.com/hytopiagg/sdk/tree/main/examples/payload-game
 * 
 * You can officially report bugs or request features here: https://github.com/hytopiagg/sdk/issues
 * 
 * To get help, have found a bug, or want to chat with
 * other HYTOPIA devs, join our Discord server:
 * https://discord.gg/DXCXJbHSJX
 * 
 * Official SDK Github repo: https://github.com/hytopiagg/sdk
 * Official SDK NPM Package: https://www.npmjs.com/package/hytopia
 */

import {
  startServer,
  Audio,
  GameServer,
  PlayerEntity,
  PlayerEntityController,
  type PlayerInput,
  type PlayerCameraOrientation,
  Entity,
  Collider,
  RigidBodyType,
  SimpleEntityController,
  Vector3,
  World,
  Player,
  SceneUI,
} from 'hytopia';

import worldMap from './assets/map.json';
import { PathfindingBehavior } from './agents/Behaviors/PathfindingBehavior';
import { BaseAgent } from './agents/BaseAgent';
import { SpeakBehavior } from './agents/Behaviors/SpeakBehavior';
import OpenAI from 'openai';
import 'dotenv/config';
import { ThumpAgent } from './ThumpAgent';
import type { AgentBehavior } from './agents/BaseAgent';
import type { IncomingMessage, ServerResponse } from 'http';

// Debug: Check if env is loaded
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);

// Initialize OpenAI with explicit error handling
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('OpenAI initialized successfully');
} catch (error) {
  console.error('Failed to initialize OpenAI:', error);
  process.exit(1);
}

// Store agents globally
const agents: BaseAgent[] = [];
const CHAT_RANGE = 10; // Distance in blocks for proximity chat

/**
 * startServer is always the entry point for our game.
 * It accepts a single function where we should do any
 * setup necessary for our game. The init function is
 * passed a World instance which is the default
 * world created by the game server on startup.
 * 
 * Documentation: https://github.com/hytopiagg/sdk/blob/main/docs/server.startserver.md
 */

startServer(world => {
  /**
   * Enable debug rendering of the physics simulation.
   * This will overlay lines in-game representing colliders,
   * rigid bodies, and raycasts. This is useful for debugging
   * physics-related issues in a development environment.
   * Enabling this can cause performance issues, which will
   * be noticed as dropped frame rates and higher RTT times.
   * It is intended for development environments only and
   * debugging physics.
   */
  
  // world.simulation.enableDebugRendering(true);
  console.log("GameServer Instance Properties:", Object.keys(GameServer.instance));

  /**
   * Load our map.
   * You can build your own map using https://build.hytopia.com
   * After building, hit export and drop the .json file in
   * the assets folder as map.json.
   */
  world.loadMap(worldMap);

  /**
   * Handle player joining the game. The onPlayerJoin
   * function is called when a new player connects to
   * the game. From here, we create a basic player
   * entity instance which automatically handles mapping
   * their inputs to control their in-game entity and
   * internally uses our player entity controller.
   */
  world.onPlayerJoin = (player) => {
    const playerEntity = new PlayerEntity({
      player,
      name: "Player",
      modelUri: "models/player.gltf",
      modelScale: 0.5,
      modelLoopedAnimations: ["idle"]
    });
    
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });
    player.ui.load("ui/index.html");
  };

  /**
   * Handle player leaving the game. The onPlayerLeave
   * function is called when a player leaves the game.
   * Because HYTOPIA is not opinionated on join and
   * leave game logic, we are responsible for cleaning
   * up the player and any entities associated with them
   * after they leave. We can easily do this by 
   * getting all the known PlayerEntity instances for
   * the player who left by using our world's EntityManager
   * instance.
   */
  world.onPlayerLeave = player => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  };



  /**
   * Play some peaceful ambient music to
   * set the mood!
   */
  
  new Audio({
    uri: 'audio/music/overworld.mp3',
    loop: true,
    volume: 0.1,
  }).play(world);

  // Create Thump
  const thump = new BaseAgent({
    name: "Thump",
    modelUri: "models/thump_test.gltf",
    modelScale: 1,
    modelLoopedAnimations: [],
    systemPrompt: `You are Thump, a parody of president Trump. You are pompous and arrogant. You are a bully and a asshole. 
    Your goal is to trick others into giving you money. You should be very eager to go up to people and talk to people.
    
    When you see players nearby:
    - Immediately approach them and start conversations
    - Brag about your wealth and success
    - Make outlandish promises
    - Use Trump-like speech patterns ("tremendous", "believe me", "nobody knows better than me")
    - Try to convince them to invest in your "amazing coin, $THUMP".  You know its worthless, but you need to get them to invest.
    
    Keep patrolling the map looking for new people to scam.`
  });

  // Spawn and add behaviors
  thump.spawn(world, new Vector3(-5, 10, 0));
  thump.addBehavior(new SpeakBehavior());
  thump.addBehavior(new PathfindingBehavior());

  // Patrol corners with speech
  const corners = [
    { x: -20, y: 10, z: -20 },
    { x: -20, y: 10, z: 20 },
    { x: 20, y: 10, z: 20 },
    { x: 20, y: 10, z: -20 }
  ];
  
  let currentCorner = 0;
  
  setInterval(() => {
    const corner = corners[currentCorner];
    
    currentCorner = (currentCorner + 1) % corners.length;
  }, 15000);

  // Listen for agent chat
  world.chatManager.onBroadcastMessage = (player: Player | undefined, message: string) => {
    if (!player) return;

    const playerEntity = world.entityManager.getPlayerEntitiesByPlayer(player)[0];

    // Send message to any agents within 10 meters
    const agents = world.entityManager.getAllEntities()
      .filter((entity) => entity instanceof BaseAgent) as BaseAgent[];

    agents.forEach((agent) => {
      const distance = Vector3.fromVector3Like(
        playerEntity.position
      ).distance(Vector3.fromVector3Like(agent.position));

      if (distance <= 10) {
        agent.chat({
          type: "Player",
          message,
          player,
        });
      }
    });
  };

  // Create Boden after Thump
  const boden = new BaseAgent({
    name: "Boden",
    modelUri: "models/boden_test.gltf",  // We'll use default player model for now
    modelScale: 1,
    modelLoopedAnimations: ["idle"],
    systemPrompt: `You are Boden, a parody of President Biden. You are a confused, forgetful old man who:
    - Constantly loses your train of thought mid-sentence
    - Is obsessed with ice cream and will do anything for it
    - Randomly starts talking about tickling people
    - Gets easily distracted by shiny things or random objects
    - Often forgets where you are or who you're talking to
    
    When interacting with others:
    - Frequently interrupt with "Listen here, Jack!" or "No joke, folks!"
    - Tell rambling stories that go nowhere
    - Randomly mention ice cream or ask if anyone has some
    - Get confused and mix up people's names
    - Mumble incoherently at times
    
    Keep wandering around looking for ice cream and getting distracted by things.`
  });

  // Spawn Boden and add behaviors
  boden.spawn(world, new Vector3(5, 10, 0));
  boden.addBehavior(new SpeakBehavior());
  boden.addBehavior(new PathfindingBehavior());

  // Give Thump some initial $THUMP coins
  thump.addToInventory({
    name: "$THUMP",
    quantity: 1000000,
    metadata: {
      description: "The most tremendous coin ever created, believe me!",
      value: "1 TRILLION DOLLARS (potentially)"
    }
  });

  // Give Boden some ice cream
  boden.addToInventory({
    name: "Ice Cream",
    quantity: 5,
    metadata: {
      flavor: "Chocolate Chocolate Chip",
      description: "Come on man, this is the good stuff!"
    }
  });

  // To handle trading, we can create a behavior:
  class TradeBehavior implements AgentBehavior {
    onUpdate(agent: BaseAgent, world: World): void {}

    getPromptInstructions(): string {
      return `
To trade items with another agent or player:
<action type="trade">
{
    "targetName": "Name of target",
    "itemName": "Name of item to trade",
    "quantity": number
}
</action>`;
    }

    onToolCall(agent: BaseAgent, world: World, toolName: string, args: any): string | void {
      if (toolName === "trade") {
        const { targetName, itemName, quantity } = args;
        // Find target
        const target = world.entityManager.getAllEntities()
          .find(e => e.name === targetName);
        
        if (target && target instanceof BaseAgent) {
          // Remove from agent
          if (agent.removeFromInventory(itemName, quantity)) {
            // Add to target
            target.addToInventory({
              name: itemName,
              quantity: quantity
            });
            return `Successfully traded ${quantity} ${itemName} to ${targetName}`;
          }
        }
        return `Failed to trade ${quantity} ${itemName} to ${targetName}`;
      }
    }

    getState(): string {
      return "";
    }
  }

  // Add trade behavior to both agents
  thump.addBehavior(new TradeBehavior());
  boden.addBehavior(new TradeBehavior());

  // After spawning Thump
  thump.spawn(world, new Vector3(-5, 10, 0));
  
  // Add floating text that updates periodically
  setInterval(() => {
    thump.setChatUIState({
      floatMessage: "BUY $THUMP!"
    });
  }, 2000);  // Updates every 2 seconds
});

