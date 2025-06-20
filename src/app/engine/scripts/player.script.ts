import { ScriptBehaviour } from "../behaviours/script.behaviour";
import { SpriteBehaviour } from "../behaviours/sprite.behaviour";
import { Constants } from "../core/constants";
import { BehaviourType } from "../core/game.behaviour";
import { GameObject } from "../core/game.object";
import { GameSystem } from "../core/game.system";
import { Input } from "../core/input";
import { Time } from "../core/time";
import { Vector2 } from "../core/vector";
import { SpriteSystem } from "../systems/sprite.system";

class PlayerScript extends ScriptBehaviour {

    runSprite?: SpriteBehaviour;
    idleSprite?: SpriteBehaviour;

    constructor(gameObject: GameObject | null) {
        super(gameObject);

        this.start = () => {
            this.loadPlayerSprite().then();
        };

        this.update = () => {
            this.updatePlayer();
        }
    }

    async loadPlayerSprite() {
        if (!this.gameObject)
            return;

        const runAnim = this.gameObject.NewBehaviour(BehaviourType.Sprite) as SpriteBehaviour;
        const idleAnim = this.gameObject.NewBehaviour(BehaviourType.Sprite) as SpriteBehaviour;

        const spriteSystem = GameSystem.GetSystem<SpriteSystem>(BehaviourType.Sprite);

        if (!spriteSystem)
            return;

        await spriteSystem.loadTextureIntoSprite(runAnim.sprite, '/resources/images/textures/doro/sprites/run/doro-run.png');
        await spriteSystem.loadTextureIntoSprite(idleAnim.sprite, '/resources/images/textures/doro/sprites/idle/doro.png');

        runAnim.sprite.frameCount = 2;
        runAnim.sprite.animated = true;
        runAnim.sprite.framesPerSecond = 5;

        idleAnim.sprite.animated = false;

        this.runSprite = runAnim;
        this.idleSprite = idleAnim;
    }

    updatePlayer() {
        if (!this.runSprite || !this.idleSprite)
            return;

        if (!this.gameObject)
            return;

        const speed = Constants.UnitSize * 3;
        const moveAmount = speed * Time.deltaTime;

        let moveX = 0;
        let moveY = 0;

        Input.GetKey(Input.Key.W) && (moveY++);
        Input.GetKey(Input.Key.S) && (moveY--);

        if (Input.GetKey(Input.Key.A)) {
            moveX--;
            this.runSprite.flipX = false;
            this.idleSprite.flipX = false;
        }

        if (Input.GetKey(Input.Key.D)) {
            moveX++;
            this.runSprite.flipX = true;
            this.idleSprite.flipX = true;
        }

        const velocity = new Vector2(moveX, moveY);
        if (velocity.Length() > 0) {
            this.gameObject.SetBehaviour(BehaviourType.Sprite, this.runSprite);
            this.runSprite.sprite.texture!.changed = true;
            velocity.Normalize();
        }
        else {
            this.gameObject.SetBehaviour(BehaviourType.Sprite, this.idleSprite);
            this.idleSprite.sprite.texture!.changed = true;
        }

        this.gameObject.transform.position.Add(velocity.Multiply(moveAmount));
    }
}

export { PlayerScript }