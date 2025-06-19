import { BehaviourType, GameBehaviour } from "./game.behaviour";
import { GameObject } from "./game.object";
import { GameSystem } from "./game.system";
import { Matrix3x3 } from "./matrix";
import { Renderer } from "./renderer";
import { Resources } from "./resources";
import { Sprite, SpriteBehaviour } from "./sprite.behaviour";
import { Texture } from "./texture";
import { TileDescriptor } from "./tile";
import { Time } from "./time";

class SpriteSystem extends GameSystem {
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

    render(renderer: Renderer, drawFn: (matrix: Matrix3x3) => void) {
        for (const behaviour of this.behaviours) {
            if (!behaviour.gameObject)
                continue;
            
            const matrix = new Matrix3x3();
            this.mutateSprite(renderer, matrix, behaviour);

            drawFn(matrix);
        }
    }

    add(gameObject: GameObject): GameBehaviour {
        const behavior = new SpriteBehaviour(gameObject);
        this.behaviours.push(behavior)

        return behavior;
    }

    async loadTextureIntoSprite(sprite: Sprite, url: string) {
        const device = Renderer.instance.device;
        if (!device)
            return;

        const handle = await Resources.loadTexture(url, device);
        sprite.texture = new Texture(handle, url);
    }

    mutateSprite(renderer: Renderer, matrix: Matrix3x3, behaviour: SpriteBehaviour, scale: number = 1) {
        const sprite = behaviour.sprite;
        const gameObject = behaviour.gameObject;

        if (!gameObject)
            return;

        if (sprite) {
            if (sprite.texture?.changed) {
                renderer.setTexture(sprite.texture?.handle!);
                sprite.texture.changed = false;
            }

            if (sprite.animated) {
                renderer.uniform_Sprite_UV_Size_X.set([1 / sprite.frameCount]);
                renderer.uniform_Sprite_UV_Offset_X.set([Math.floor(behaviour.frameIndex) / sprite.frameCount]);
            }
            else {
                renderer.uniform_Sprite_UV_Size_X.set([1]);
                renderer.uniform_Sprite_UV_Offset_X.set([0]);
            }

            matrix
                .translate([gameObject.transform.position.x, gameObject.transform.position.y])
                .scale([behaviour.flipX ? -scale : scale, scale]);
        }
        else {
            matrix
                .translate([gameObject.transform.position.x, gameObject.transform.position.y])
                .scale([scale, scale]);
        }

        return matrix;
    }
}

export { SpriteSystem }