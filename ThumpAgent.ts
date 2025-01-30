import { Entity, SimpleEntityController, RigidBodyType, Collider, Vector3, World, SceneUI, Player } from 'hytopia';
import { PathfindingBehavior } from './node_modules/hytopia/examples/ai-agents/src/behaviors/PathfindingBehavior';
import { SpeakBehavior } from './node_modules/hytopia/examples/ai-agents/src/behaviors/SpeakBehavior';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/src/resources/index.js';

export class ThumpAgent {
  entity: Entity;
  behaviors: any[] = [];
  name: string;
  systemPrompt: string;
  private chatHistory: ChatCompletionMessageParam[] = [];
  private openai: OpenAI;
  private internalMonologue: string[] = [];
  private chatUI: SceneUI;
  private lastActionTime: number = Date.now();

  constructor() {
    this.name = "Thump";
    this.systemPrompt = `You are Thump, a strong and protective creature in Hytopia.
    You are generally quiet but very alert to your surroundings.
    When you speak, you use short, simple phrases.
    You act like a guard, patrolling and watching for danger.`;
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.entity = new Entity({ 
      controller: new SimpleEntityController(),
      modelUri: 'models/players/thump_test.gltf',
      modelScale: 1,
      modelLoopedAnimations: ['idle', 'Walk'],
      rigidBodyOptions: { 
        type: RigidBodyType.DYNAMIC,
        enabledRotations: { x: false, y: true, z: false },
        colliders: [
          Collider.optionsFromModelUri('models/players/thump_test.gltf', 1)
        ],
      }
    });

    this.chatUI = new SceneUI({
      templateId: "agent-chat",
      attachedToEntity: this.entity,
      offset: { x: 0, y: 1, z: 0 },
      state: {
        message: "",
        agentName: this.name
      }
    });
  }

  spawn(world: World, position: Vector3) {
    this.entity.spawn(world, position);
    this.chatUI.load(world);
  }

  addBehavior(behavior: any) {
    this.behaviors.push(behavior);
  }

  async chat(options: { type: string, message: string, player?: Player }) {
    if (this.chatHistory.length === 0) {
      this.chatHistory.push({
        role: "system",
        content: this.systemPrompt
      });
    }

    this.chatHistory.push({
      role: "user",
      content: options.message
    });

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: this.chatHistory
    });

    const response = completion.choices[0]?.message;
    if (response?.content) {
      this.parseResponse(response.content);
      this.chatHistory.push({
        role: "assistant",
        content: response.content
      });
    }
  }

  private parseResponse(text: string) {
    // Parse for monologue tags
    const monologueMatch = /<monologue>(.*?)<\/monologue>/g.exec(text);
    if (monologueMatch) {
      this.internalMonologue.push(monologueMatch[1]);
    }

    // Parse for action tags
    const actionMatch = /<action type="([^"]+)">(.*?)<\/action>/g.exec(text);
    if (actionMatch) {
      const [_, actionType, args] = actionMatch;
      this.handleAction(actionType, args ? JSON.parse(args) : {});
    }
  }

  private handleAction(actionType: string, args: any) {
    this.behaviors.forEach(behavior => {
      if (behavior.onToolCall) {
        behavior.onToolCall(this, actionType, args);
      }
    });
  }

  getLastMonologue(): string | undefined {
    return this.internalMonologue[this.internalMonologue.length - 1];
  }

  onTick() {
    // Update behaviors
    this.behaviors.forEach(behavior => {
      if (behavior.onUpdate) {
        behavior.onUpdate(this);
      }
    });
  }

  setRotation(rotation: { x: number; y: number; z: number; w: number }) {
    this.entity.setRotation(rotation);
  }

  get position() {
    return this.entity.position;
  }
}