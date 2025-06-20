import { BehaviourType, GameBehaviour } from "../core/game.behaviour";
import { GameObject } from "../core/game.object";
import { GameSystem } from "../core/game.system";
import { Matrix3x3, Matrix4x4 } from "../core/matrix";
import { Renderer } from "../core/renderer";
import { PlayerBehaviour } from "../behaviours/player.behaviour";

class PlayerSystem extends GameSystem {
    override behaviours: PlayerBehaviour[];
    constructor() {
        super();
        this.behaviours = [];
        GameSystem.RegisterSystem(BehaviourType.Player, this);
    }

    update() {
        for (const behaviour of this.behaviours) {
            //TODO
        }
    }

    newBehaviour(gameObject: GameObject): GameBehaviour {
        const behavior = new PlayerBehaviour(gameObject);
        this.behaviours.push(behavior)

        return behavior;
    }
}

export { PlayerSystem }