import { BehaviourType, GameBehaviour } from "../core/game.behaviour";
import { GameObject } from "../core/game.object";
import { GameSystem } from "../core/game.system";
import { Matrix3x3 } from "../core/matrix";
import { Renderer } from "../core/renderer";
import { MovementBehaviour } from "../behaviours/movement.behaviour";

class MovementSystem extends GameSystem {
    override behaviours: MovementBehaviour[];
    constructor() {
        super();
        this.behaviours = [];
        GameSystem.RegisterSystem(BehaviourType.Movement, this);
    }

    update() {
        for (const behaviour of this.behaviours) {
            //TODO
        }
    }

    render(renderer: Renderer, drawFn: (matrix: Matrix3x3) => void) {
        return;
    }

    add(gameObject: GameObject): GameBehaviour {
        const behavior = new MovementBehaviour(gameObject);
        this.behaviours.push(behavior)

        return behavior;
    }
}

export { MovementSystem }