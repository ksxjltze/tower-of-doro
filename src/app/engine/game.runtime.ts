import { GameObject } from "./game.object";
import { Runtime } from "./runtime";

import { Camera2D } from "./camera2d";
import { BehaviourType } from "./game.behaviour";
import { Input } from "./input";

import { SpriteBehaviour } from "./behaviours/sprite.behaviour";
import { Time } from "./time";
import { Vector2 } from "./vector";
import { GameSystem } from "./game.system";
import { MovementSystem } from "./systems/movement.system";

class GameRuntime extends Runtime {
    player: GameObject;

    runSprite?: SpriteBehaviour;
    idleSprite?: SpriteBehaviour;

    elapsedTime = 0;
    lastTimestamp: DOMHighResTimeStamp | null = null;

    constructor() {
        super();
        this.player = this.scene.AddObject(new GameObject("Player"));

        Input.setupInput();
        this.systems.push(new MovementSystem());
    }

    override init() {
        super.init(
            () => this.loadPlayerSprite().then(() => this.initialized = true),
            this.runGameLoop
        );
    }

    async loadPlayerSprite() {
        const runAnim = this.player.AddBehaviour(BehaviourType.Sprite) as SpriteBehaviour;
        const idleAnim = this.player.AddBehaviour(BehaviourType.Sprite) as SpriteBehaviour;

        await this.spriteSystem.loadTextureIntoSprite(runAnim.sprite, '/resources/images/textures/doro/sprites/run/doro-run.png');
        await this.spriteSystem.loadTextureIntoSprite(idleAnim.sprite, '/resources/images/textures/doro/sprites/idle/doro.png');

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

        const speed = 4;
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
            this.runSprite.sprite.texture!.changed = true;
            velocity.Normalize();
        }
        else {
            this.player.SetBehaviour(BehaviourType.Sprite, this.idleSprite);
            this.idleSprite.sprite.texture!.changed = true;
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
        

        //WIP
        for (const system of this.systems) {
            system.update();
        }

        this.updatePlayer();
    }

    runGameLoop(timestamp?: DOMHighResTimeStamp) {
        this.update(timestamp);
        this.renderer.render(this.systems);

        requestAnimationFrame(this.runGameLoop.bind(this));
    }
}

export { GameRuntime }