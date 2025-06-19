import { BehaviourType, GameBehaviour } from "../game.behaviour";
import { GameObject } from "../game.object";
import { GameSystem } from "../game.system";
import { Matrix3x3 } from "../matrix";
import { Renderer } from "../renderer";
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