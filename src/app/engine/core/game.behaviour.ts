import { GameObject } from "./game.object";

enum BehaviourType {
    None,
    Sprite,
    Player,
    Script,
    DoroDrive
}

abstract class GameBehaviour {
    type: BehaviourType = BehaviourType.None;
    gameObject: GameObject | null;

    constructor(gameObject: GameObject | null) {
        this.gameObject = gameObject;
    }
}

class EmptyBehaviour extends GameBehaviour{
    override type: BehaviourType = BehaviourType.None;
}

export { BehaviourType, GameBehaviour, EmptyBehaviour }