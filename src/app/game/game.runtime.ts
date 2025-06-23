import { GameObject } from "../engine/core/game.object";
import { Runtime } from "../engine/runtime/runtime";

import { BehaviourType } from "../engine/core/game.behaviour";
import { Input } from "../engine/core/input";

import { GameSystem } from "../engine/core/game.system";
import { Time } from "../engine/core/time";
import { PlayerScript } from "../engine/scripts/player.script";
import { PlayerSystem } from "../engine/systems/player.system";
import { ScriptSystem } from "../engine/systems/script.system";
import { SpriteSystem } from "../engine/systems/sprite.system";
import { DoroDriveSystem, DoroPlayer } from "./tower-of-doro";

class GameRuntime extends Runtime {
    player: DoroPlayer;

    elapsedTime = 0;
    lastTimestamp: DOMHighResTimeStamp | null = null;

    constructor() {
        super();

        this.systems.push(new PlayerSystem());
        this.systems.push(new ScriptSystem());
        this.systems.push(new SpriteSystem());

        this.systems.push(new DoroDriveSystem());

        this.player = this.scene.AddObject(new DoroPlayer("DoroZero")) as DoroPlayer;
        this.player.SetBehaviour(BehaviourType.Script, new PlayerScript(this.player)); //temp, scuffed

        const doroSystem = GameSystem.GetSystem<DoroDriveSystem>(BehaviourType.DoroDrive);
        doroSystem.addPlayer(this.player);

        Input.setupInput();
    }

    override async init() {
        const scriptSystem = GameSystem.GetSystem<ScriptSystem>(BehaviourType.Script);

        super.init(
            () => scriptSystem.start(),
            this.runGameLoop
        );

        for (const system of this.systems) {
            system.onInit();
        }
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

    onDestroy() {
        for (const system of this.systems) {
            system.onExit();
        }
    }

    runGameLoop(timestamp?: DOMHighResTimeStamp) {
        this.update(timestamp);
        this.renderer.render(this.systems);

        requestAnimationFrame(this.runGameLoop.bind(this));
    }
}

export { GameRuntime };

