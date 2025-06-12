import { Component } from '@angular/core';
import { Transform } from '../engine/transform';
import { Vector2 } from '../engine/vector';
import { Input } from '../engine/input';
import { Renderer } from '../engine/renderer';
import { GameObject } from '../engine/game.object';
import { Time } from '../engine/time';
import { SpriteSystem } from '../engine/sprite.system';
import { BehaviourType } from '../engine/game.behaviour';
import { SpriteBehaviour } from '../engine/sprite.behaviour';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  player: GameObject = new GameObject("Player");

  elapsedTime = 0;
  lastTimestamp: DOMHighResTimeStamp | null = null;

  renderer: Renderer = new Renderer();
  spriteSystem: SpriteSystem = new SpriteSystem();

  ngOnInit() {
    console.log("GameComponent initialized");

    this.renderer.initWebGPU()
      .then(() => {
        this.setupPlayer()
        .then(() => requestAnimationFrame(this.runGameLoop.bind(this)));
      })
      .catch((error: any) => {
        console.error("Error initializing WebGPU:", error);
      });

    this.setupInput();
  }

  async setupPlayer() {
    const sprite = this.player.AddBehaviour(BehaviourType.Sprite) as SpriteBehaviour;
    await this.spriteSystem.loadTextureIntoSprite(sprite, '/resources/images/textures/doro/sprites/run/doro-run.png');
    
    sprite.frameCount = 2;
    sprite.animated = true;
    sprite.framesPerSecond = 5;
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
    const speed = 3;
    const moveAmount = speed * Time.deltaTime;

    Input.GetKey(Input.Key.W) && (this.player.transform.position.y += moveAmount);
    Input.GetKey(Input.Key.S) && (this.player.transform.position.y -= moveAmount);
    Input.GetKey(Input.Key.A) && (this.player.transform.position.x -= moveAmount);
    Input.GetKey(Input.Key.D) && (this.player.transform.position.x += moveAmount);
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