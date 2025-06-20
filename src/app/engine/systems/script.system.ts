import { BehaviourType, GameBehaviour } from "../core/game.behaviour";
import { GameObject } from "../core/game.object";
import { GameSystem } from "../core/game.system";
import { Matrix3x3, Matrix4x4 } from "../core/matrix";
import { Renderer } from "../core/renderer";
import { ScriptBehaviour } from "../behaviours/script.behaviour";

class ScriptSystem extends GameSystem {
    override behaviours: ScriptBehaviour[];
    constructor() {
        super();

        this.behaviours = [];
        GameSystem.RegisterSystem(BehaviourType.Script, this);
    }

    start() {
        for (const behaviour of this.behaviours) {
            behaviour.start();
        }
    }

    update() {
        for (const behaviour of this.behaviours) {
            behaviour.update();
        }
    }

    newBehaviour(gameObject: GameObject): GameBehaviour {
        const behavior = new ScriptBehaviour(gameObject);
        this.behaviours.push(behavior)

        return behavior;
    }
}

export { ScriptSystem }