import { Sprite, SpriteBehaviour } from "../behaviours/sprite.behaviour";
import { BehaviourType, GameBehaviour } from "../core/game.behaviour";
import { GameObject } from "../core/game.object";
import { GameSystem } from "../core/game.system";
import { Matrix3x3, Matrix4x4 } from "../core/matrix";
import { Renderer } from "../core/renderer";
import { Resources } from "../core/resources";
import { Texture } from "../core/texture";
import { Time } from "../core/time";

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

    override render = (renderer: Renderer, drawFn: (matrix: Matrix4x4) => void) => {
        for (const behaviour of this.behaviours) {
            if (!behaviour.gameObject)
                continue;

            const matrix = new Matrix4x4();
            this.mutateSprite(renderer, matrix, behaviour);

            drawFn(matrix);
        }
    }

    newBehaviour(gameObject: GameObject): GameBehaviour {
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

    mutateSprite(renderer: Renderer, matrix: Matrix4x4, behaviour: SpriteBehaviour, scale: number = 1) {
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
                .scale([behaviour.flipX ? -scale : scale, scale, 1])
                .translate([gameObject.transform.position.x, gameObject.transform.position.y, -1]);
        }
        else {
            matrix
                .scale([scale, scale, 1])
                .translate([gameObject.transform.position.x, gameObject.transform.position.y, -1]);
        }

        return matrix;
    }
}

export { SpriteSystem };
