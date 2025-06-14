import { BehaviourType, GameBehaviour } from "./game.behaviour";
import { GameObject } from "./game.object";
import { GameSystem } from "./game.system";
import { Renderer } from "./renderer";
import { Sprite, SpriteBehaviour } from "./sprite.behaviour";
import { Texture } from "./texture";
import { Time } from "./time";

class SpriteSystem extends GameSystem{
    override behaviours: SpriteBehaviour[];
    constructor() {
        super();
        this.behaviours = [];
        GameSystem.RegisterSystem(BehaviourType.Sprite, this);
    }

    update() {
        for (const behaviour of this.behaviours) {
            const sprite = behaviour.sprite;
            if (!sprite.animated)
                continue;

            if (!behaviour.gameObject)
                continue;

            behaviour.elapsedTime += Time.deltaTime;
            behaviour.frameIndex = (behaviour.elapsedTime / (1 / sprite.framesPerSecond)) % sprite.frameCount;
            
            if (behaviour.frameIndex >= sprite.frameCount)
                behaviour.elapsedTime = 0;
        }
    }

    add(gameObject: GameObject) : GameBehaviour {
        const behavior = new SpriteBehaviour(gameObject);
        this.behaviours.push(behavior)

        return behavior;
    }

    async loadTextureIntoSprite(sprite: Sprite, url: string) {
        const handle = await Renderer.instance.loadTexture(url);
        sprite.texture = new Texture(handle, url);
    }
}

export { SpriteSystem }