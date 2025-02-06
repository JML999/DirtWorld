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
  PlayerUI,
} from 'hytopia';

import { PlayerStateManager } from './PlayerStateManager';
import worldMap from './assets/maps/map_test.json';
import { PathfindingBehavior } from './agents/Behaviors/PathfindingBehavior';
import { BaseAgent } from './agents/BaseAgent';
import { SpeakBehavior } from './agents/Behaviors/SpeakBehavior';
import OpenAI from 'openai';
import 'dotenv/config';
import { ThumpAgent } from './ThumpAgent';
import type { AgentBehavior } from './agents/BaseAgent';
import type { IncomingMessage, ServerResponse } from 'http';
import { InventoryManager } from './Inventory/InventoryManager';
import type { InventoryItem } from './Inventory/Inventory';
import { LevelingSystem } from './LevelingSystem';
import { FishingMiniGame } from './FishingMiniGame';
import { MerchantManager } from './MerchantManager';
import { CurrencyManager } from './CurrencyManager';
import { FISHING_RODS } from './Inventory/RodCatalog';
import { MessageManager } from './MessageManager';

// Initialize OpenAI with explicit error handling

let openai: OpenAI;
/*
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('OpenAI initialized successfully');
} catch (error) {
  console.error('Failed to initialize OpenAI:', error);
  process.exit(1);
}
*/

// Store agents globally
const agents: BaseAgent[] = [];
const CHAT_RANGE = 10; // Distance in blocks for proximity chat
let wasPressed = false; 
let isCasting = false;  // Add at file level with other globals
let lastInputState: PlayerInput = { ml: false };  // At top with globals

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
    // Pass stateManager to all systems
    const inventoryManager = new InventoryManager(world);
    const levelingSystem = new LevelingSystem();
    const currencyManager = new CurrencyManager();
    // Initialize state manager first
    const messageManager = new MessageManager();
    const stateManager = new PlayerStateManager(inventoryManager, levelingSystem, currencyManager, messageManager);
    const merchantManager = new MerchantManager(world, stateManager);
    const fishingMiniGame = new FishingMiniGame(world, inventoryManager, levelingSystem, stateManager, messageManager);
   

    merchantManager.initialize();


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
      currencyManager.initializePlayer(player);
      stateManager.initializePlayer(player);
      // Clean up any orphaned merchant UIs before setting up new ones
      merchantManager.cleanupExistingMerchantUIs();


        const playerEntity = new PlayerEntity({
            player,
            name: "Player",
            modelUri: "models/players/player.gltf",
            modelScale: 0.5,
            modelLoopedAnimations: ["idle"]
        });

        console.log("Player entity status:", {
          isSpawned: playerEntity.isSpawned,
          hasModel: !!playerEntity.modelUri,
          position: playerEntity.position,
          parent: !!playerEntity.parent,
          world: !!playerEntity.world,
          animations: playerEntity.modelLoopedAnimations,
          scale: playerEntity.modelScale,
          rigidBody: !!playerEntity.rawRigidBody,
          controller: !!playerEntity.controller,
          id: playerEntity.id
      });

        playerEntity.controller!.onTick = (entity: Entity, deltaTimeMs: number) => {
          const playerEntity = entity as PlayerEntity;
          if (!playerEntity.world) return;
          const state = stateManager.getState(player);
          if (!state) return;

                      // Death check - if player falls below y=0
          if (playerEntity.position.y < 0.9) {
            playerEntity.stopModelAnimations(['crawling']);
            playerEntity.startModelLoopedAnimations([ 'idle' ]);
            // Respawn at spawn point
            playerEntity.setPosition({ x: 0, y: 10, z: 0 });
            // Reset physics
            playerEntity.rawRigidBody?.setLinearVelocity({ x: 0, y: 0, z: 0 });
            playerEntity.rawRigidBody?.setGravityScale(1.0);
            playerEntity.rawRigidBody?.setLinearDamping(0.0);
            return; // Skip water check if dead
          }
          
          if (stateManager.isInWater(playerEntity)) {
              state.swimming.isSwimming = true;
              playerEntity.startModelOneshotAnimations([ 'crawling' ]);
              playerEntity.rawRigidBody?.setGravityScale(-1.5);
              playerEntity.rawRigidBody?.setLinearDamping(5.0);
          } else {
              state.swimming.isSwimming = false;
              playerEntity.startModelLoopedAnimations([ 'idle' ]);
              playerEntity.rawRigidBody?.setGravityScale(1.0);
              playerEntity.rawRigidBody?.setLinearDamping(0.0);
          }
      };


      function onTickWithPlayerInput(this: PlayerEntityController, entity: PlayerEntity, input: PlayerInput, cameraOrientation: PlayerCameraOrientation, deltaTimeMs: number) {
            if (!entity.world) return;
            const state = stateManager.getState(player);
            if (!state) return;

            //fishingMiniGame.handleInput(player, input);
            
            // Add at start of onTickWithPlayerInput
            const hasRodEquipped = inventoryManager.getEquippedRod(entity.player);

            if (input.ml) {
              console.log("ml");
              entity.stopModelAnimations(['simple_interact']);
            }
            
            if (hasRodEquipped) {
                // Toggle casting state on mouse click
                if (input.ml && !lastInputState.ml && !state.fishing.isPlayerFishing && !state.fishing.reelingGame.isReeling) {
                  console.log("casting");
                  input.ml = false;
                    fishingMiniGame.onCastStart(entity.player);
                } 
                
                if (state.fishing.isCasting || state.fishing.isReeling || state.fishing.isPlayerFishing) {
                    input.w = false;
                    input.a = false;
                    input.s = false;
                    input.d = false;
                }
                
                // Update while casting
                fishingMiniGame.onTick(entity.player);
            }

            // Handle merchant dialog inputs
            if (state.merchant?.isInteracting && state.merchant.currentMerchant) {
                if (player.input['1']) merchantManager.handleMerchantOption(entity.player, state.merchant.currentMerchant, 0);
                if (player.input['2']) {
                  console.log("b");
                  merchantManager.handleMerchantOption(entity.player, state.merchant.currentMerchant, 1)
                }
                if (player.input['3']) {
                  console.log("c");
                  merchantManager.handleMerchantOption(entity.player, state.merchant.currentMerchant, 2);
                }
                if (player.input['4']) {
                  console.log("d");
                  merchantManager.handleMerchantOption(entity.player, state.merchant.currentMerchant, 3);
                }
                if (player.input['5']) merchantManager.handleMerchantOption(entity.player, state.merchant.currentMerchant, 4);
            }

            if (player.input['sp']) {
              if (state.swimming.isSwimming) {
                console.log("stop swimming");
                playerEntity.stopModelAnimations([ 'crawling' ]);
                playerEntity.startModelLoopedAnimations([ 'idle' ]);
              }
            }
            // Store last input state in player's state instead of globally
            state.fishing.lastInputState = { ml: input.ml };
        }

        playerEntity.controller!.onTickWithPlayerInput = onTickWithPlayerInput;
        playerEntity.spawn(world, { x: -2, y: 10, z: 27 });

          // Initialize inventory and give starter rods
        inventoryManager.initializePlayerInventory(player);
        console.log("inventory", inventoryManager.getInventory(player));
        const entities = world.entityManager.getEntitiesByTag('fishingRod');
        console.log("rods entities", entities);

        // Give the starter rod
        inventoryManager.addRodById(player, 'beginner-rod');
        console.log("inventory2", inventoryManager.getInventory(player));
        const entities2 = world.entityManager.getEntitiesByTag('fishingRod');
        console.log("rods entities2", entities2);


        player.ui.load("ui/index.html");
        messageManager.sendGameMessage("Welcome to phsh! Select your beginner rod in equipment and get fishing!", player);


        // Initialize fishing mini-game system
       // const fishingMiniGame = new FishingMiniGame(world, inventoryManager, levelingSystem, player);

        // Listen for UI events
        player.ui.onData = (playerUI: PlayerUI, data: Record<string, any>) => {
          console.log('[Server] Received UI action:', data);
          
          if (data.type === 'disablePlayerInput') {
              console.log('[Server] Disabling player input due to UI interaction');
              player.ui.lockPointer(false);
          } else if (data.type === 'enablePlayerInput') {
              console.log('[Server] Enabling player input');
              player.ui.lockPointer(true);
          } else if (data.type === 'updateGameHeight') {
              fishingMiniGame.updateUIHeight(data.height);
          }
          if (data.type === 'equipItem' && data.itemId) {
              console.log('Equipping item:', data.itemId);
              inventoryManager.equipItem(player, data.itemId);
              
              const inventory = inventoryManager.getInventory(player);
              console.log('Sending updated inventory:', inventory);
              player.ui.sendData({
                  type: 'inventoryUpdate',
                  inventory: inventory
              });
          } else if (data.type === 'unequipItem' && data.itemType) {
              console.log('Unequipping item type:', data.itemType);
              inventoryManager.unequipItem(player, data.itemType);
              
              const inventory = inventoryManager.getInventory(player);
              console.log('Sending updated inventory:', inventory);
              player.ui.sendData({
                  type: 'inventoryUpdate',
                  inventory: inventory
              });
          } else if (data.type === 'purchaseRod') {
              console.log('Purchasing rod:', data.rodId);
              stateManager.buyRod(player, data.rodId);
          } else if (data.type === 'useBait') {
              console.log('Using bait:', data.itemId);
              inventoryManager.hookBait(player, data.itemId);
          }
      };

      // Initial inventory state
      player.ui.sendData({
        type: 'inventoryUpdate',
        inventory: inventoryManager.getInventory(player)
      });
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
world.onPlayerLeave = (player) => {
    console.log("player left", player.id);
    stateManager.cleanup(player);
    merchantManager.forceCleanup(player);
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
};

world.chatManager.onBroadcastMessage = (player, message) => {
    if (!player) return;
    
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



});


