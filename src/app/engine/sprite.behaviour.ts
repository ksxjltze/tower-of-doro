import { BehaviourType, GameBehaviour } from "./game.behaviour";
import { GameObject } from "./game.object";
import { Texture } from "./texture"

class SpriteBehaviour extends GameBehaviour {
    texture: Texture | null = null;
    frameCount: number = 0;
    frameIndex: number = 0;
    animated: boolean = false;
    framesPerSecond: number = 1;
    elapsedTime: number = 0;

    static override type: BehaviourType = BehaviourType.Sprite;
    constructor(gameObject: GameObject) {
        super(gameObject);
    }
}

export { SpriteBehaviour }