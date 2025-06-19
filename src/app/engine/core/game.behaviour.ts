import { GameObject } from "./game.object";

enum BehaviourType {
    None,
    Sprite,
    Player,
    Script
}

abstract class GameBehaviour {
    type: BehaviourType = BehaviourType.None;
    gameObject: GameObject | null;

    constructor(gameObject: GameObject | null) {
        this.gameObject = gameObject;
    }
}

export { BehaviourType, GameBehaviour }