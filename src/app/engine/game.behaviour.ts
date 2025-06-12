import { GameObject } from "./game.object";

enum BehaviourType {
    None,
    Sprite
}

abstract class GameBehaviour {
    type: BehaviourType = BehaviourType.None;
    gameObject: GameObject;

    constructor(gameObject: GameObject) {
        this.gameObject = gameObject;
    }
}

export { BehaviourType, GameBehaviour }