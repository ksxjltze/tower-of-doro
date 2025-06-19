import { BehaviourType, GameBehaviour } from "../core/game.behaviour";
import { GameObject } from "../core/game.object";

class MovementBehaviour extends GameBehaviour {
    speed: number = 4;

    override type: BehaviourType = BehaviourType.Movement;
    constructor(gameObject: GameObject | null) {
        super(gameObject);
    }
}

export { MovementBehaviour }