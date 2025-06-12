import { GameObject } from "./game.object";

enum BehaviourType {
    None,
    Sprite
}

abstract class GameBehaviour {
    static readonly type: BehaviourType = BehaviourType.None;
    gameObject: GameObject;

    constructor(gameObject: GameObject) {
        this.gameObject = gameObject;
    }
}

export { BehaviourType, GameBehaviour }