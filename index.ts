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

import 'dotenv/config';
import { InventoryManager } from './Inventory/InventoryManager';
import { LevelingSystem } from './LevelingSystem';
import { FishingMiniGame } from './Fishing/FishingMiniGame';
import { MerchantManager } from './MerchantManager';
import { CurrencyManager } from './CurrencyManager';
import { MessageManager } from './MessageManager';
import { MyPlayerController } from './MyPlayerController';
import { FishSpawnManager } from './Fishing/FishSpawnManager';
import { BaitBlockManager } from './Bait/BaitBlockManager';
import { GamePlayerEntity } from './GamePlayerEntity';


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
    const fishSpawnManager = new FishSpawnManager(stateManager, world);
    const fishingMiniGame = new FishingMiniGame(world, inventoryManager, levelingSystem, stateManager, messageManager, fishSpawnManager);
    const baitBlockManager = new BaitBlockManager(world, stateManager);

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
      // Clean up any orphaned merchant UIs before setting up new ones
      merchantManager.cleanupExistingMerchantUIs();

      // Initialize controller with the new entity
      const myController = new MyPlayerController(world);
      const playerEntity = new GamePlayerEntity(
        player,
        world,
        levelingSystem,
        stateManager,
        inventoryManager,
        fishingMiniGame,
        merchantManager,
        baitBlockManager,
        currencyManager,
        myController
    );
        playerEntity.spawn(world, { x: -2, y: 10, z: 27 });  
      //  messageManager.sendGameMessage("Welcome to phsh! Select your beginner rod in equipment and get fishing!", player);
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
  uri: "audio/music/hytopia-main.mp3",
  loop: true,
  volume: 0.1,
}).play(world);



});


