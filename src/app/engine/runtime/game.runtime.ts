import { GameObject } from "../core/game.object";
import { Runtime } from "./runtime";

import { BehaviourType } from "../core/game.behaviour";
import { Input } from "../core/input";

import { GameSystem } from "../core/game.system";
import { Time } from "../core/time";
import { PlayerScript } from "../scripts/player.script";
import { PlayerSystem } from "../systems/player.system";
import { ScriptSystem } from "../systems/script.system";
import { SpriteSystem } from "../systems/sprite.system";

class GameRuntime extends Runtime {
    player: GameObject;

    elapsedTime = 0;
    lastTimestamp: DOMHighResTimeStamp | null = null;

    constructor() {
        super();

        this.systems.push(new PlayerSystem());
        this.systems.push(new ScriptSystem());
        this.systems.push(new SpriteSystem());

        this.player = this.scene.AddObject(new GameObject("Player"));
        this.player.SetBehaviour(BehaviourType.Script, new PlayerScript(this.player));

        Input.setupInput();
    }

    override init() {
        const scriptSystem = GameSystem.GetSystem<ScriptSystem>(BehaviourType.Script);

        super.init(
            () => scriptSystem.start(),
            this.runGameLoop
        );
    }

    update(timestamp?: DOMHighResTimeStamp) {
        if (this.lastTimestamp === null) {
            this.lastTimestamp = timestamp || performance.now();
        }

        const time = timestamp || performance.now();
        Time.deltaTime = (time - this.lastTimestamp) / 1000; // convert to seconds

        this.elapsedTime += Time.deltaTime;
        this.lastTimestamp = timestamp || performance.now();

        //TODO: frame management

        // Update input state for the current frame
        Input.frameKeyMap.clear();
        
        for (const system of this.systems) {
            system.update();
        }
    }

    runGameLoop(timestamp?: DOMHighResTimeStamp) {
        this.update(timestamp);
        this.renderer.render(this.systems);

        requestAnimationFrame(this.runGameLoop.bind(this));
    }
}

export { GameRuntime };

