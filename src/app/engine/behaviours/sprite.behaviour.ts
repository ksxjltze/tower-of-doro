import { BehaviourType, GameBehaviour } from "../core/game.behaviour";
import { GameObject } from "../core/game.object";
import { Texture } from "../core/texture"

class Sprite {
    texture: Texture | null = null;
    frameCount: number = 0;
    animated: boolean = false;
    framesPerSecond: number = 1;
}

class SpriteBehaviour extends GameBehaviour {
    sprite: Sprite;
    frameIndex: number = 0;
    elapsedTime: number = 0;
    flipX: boolean = false;

    override type: BehaviourType = BehaviourType.Sprite;
    constructor(gameObject: GameObject | null) {
        super(gameObject);
        this.sprite = new Sprite();
    }
}

export { Sprite, SpriteBehaviour }