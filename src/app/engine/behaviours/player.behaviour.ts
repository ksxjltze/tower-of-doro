import { BehaviourType, GameBehaviour } from "../core/game.behaviour";
import { GameObject } from "../core/game.object";

class PlayerBehaviour extends GameBehaviour {
    speed: number = 4;

    override type: BehaviourType = BehaviourType.Player;
    constructor(gameObject: GameObject | null) {
        super(gameObject);
    }
}

export { PlayerBehaviour }