import { BehaviourType, GameBehaviour } from "./game.behaviour";
import { GameObject } from "./game.object";
import { GameSystem } from "./game.system";
import { Renderer } from "./renderer";
import { SpriteBehaviour } from "./sprite.behaviour";
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
        for (const sprite of this.behaviours) {
            if (!sprite.animated)
                continue;

            if (!sprite.gameObject)
                continue;

            sprite.elapsedTime += Time.deltaTime;
            sprite.frameIndex = (sprite.elapsedTime / (1 / sprite.framesPerSecond)) % sprite.frameCount;
            
            if (sprite.frameIndex >= sprite.frameCount)
                sprite.elapsedTime = 0;
        }
    }

    add(gameObject: GameObject) : GameBehaviour {
        const behavior = new SpriteBehaviour(gameObject);
        this.behaviours.push(behavior)

        return behavior;
    }

    async loadTextureIntoSprite(sprite: SpriteBehaviour, url: string) {
        const handle = await Renderer.instance.loadTexture(url);
        sprite.texture = new Texture(handle);
    }
}

export { SpriteSystem }