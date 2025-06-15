import { GameObject } from "./game.object";
import { Runtime } from "./runtime";

import { Camera2D } from "./camera2d";
import { BehaviourType } from "./game.behaviour";
import { Input } from "./input";

import { SpriteBehaviour } from "./sprite.behaviour";
import { Time } from "./time";
import { Vector2 } from "./vector";

class GameRuntime extends Runtime {
    player: GameObject;

    runSprite?: SpriteBehaviour;
    idleSprite?: SpriteBehaviour;

    elapsedTime = 0;
    lastTimestamp: DOMHighResTimeStamp | null = null;

    constructor() {
        super();
        this.player = this.scene.AddObject(new GameObject("Player"));
        this.setupInput();
    }

    override init() {
        super.init(
            () => this.setupPlayer().then(() => this.initialized = true),
            this.runGameLoop
        );
    }

    async setupPlayer() {
        const runSprite = this.player.AddBehaviour(BehaviourType.Sprite) as SpriteBehaviour;
        const idleSprite = this.player.AddBehaviour(BehaviourType.Sprite) as SpriteBehaviour;

        await this.spriteSystem.loadTextureIntoSprite(runSprite, '/resources/images/textures/doro/sprites/run/doro-run.png');
        await this.spriteSystem.loadTextureIntoSprite(idleSprite, '/resources/images/textures/doro/sprites/idle/doro.png');

        runSprite.frameCount = 2;
        runSprite.animated = true;
        runSprite.framesPerSecond = 5;

        idleSprite.animated = false;

        this.runSprite = runSprite;
        this.idleSprite = idleSprite;
    }

    setupInput() {
        document.addEventListener("keydown", this.keyDownHandler.bind(this), false);
        document.addEventListener("keyup", this.keyUpHandler.bind(this), false);
    }

    keyDownHandler(event: KeyboardEvent) {
        Input.SetKey(event.key, true);
    }

    keyUpHandler(event: KeyboardEvent) {
        Input.SetKey(event.key, false);
    }

    updatePlayer() {
        if (!this.runSprite || !this.idleSprite)
            return;

        const speed = 1;
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
            this.player.SetBehaviour(BehaviourType.Sprite, this.runSprite);
            this.runSprite.texture!.changed = true;
            velocity.Normalize();
        }
        else {
            this.player.SetBehaviour(BehaviourType.Sprite, this.idleSprite);
            this.idleSprite.texture!.changed = true;
        }

        this.player.transform.position.Add(velocity.Multiply(moveAmount));
    }

    update(timestamp?: DOMHighResTimeStamp) {
        if (this.lastTimestamp === null) {
            this.lastTimestamp = timestamp || performance.now();
        }

        const time = timestamp || performance.now();
        Time.deltaTime = (time - this.lastTimestamp) / 1000; // convert to seconds

        this.elapsedTime += Time.deltaTime;
        this.lastTimestamp = timestamp || performance.now();

        //TODO: frame management

        // Update input state for the current frame
        Input.frameKeyMap.clear();
        this.updatePlayer();
        this.spriteSystem.update();
    }

    runGameLoop(timestamp?: DOMHighResTimeStamp) {
        const objects: GameObject[] = [
            this.player,
        ];

        this.update(timestamp);
        this.renderer.render(objects);

        requestAnimationFrame(this.runGameLoop.bind(this));
    }
}

export { GameRuntime }