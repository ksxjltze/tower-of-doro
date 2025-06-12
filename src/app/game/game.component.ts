import { Component } from '@angular/core';
import { Transform } from '../engine/transform';
import { Vector2 } from '../engine/vector';
import { Input } from '../engine/input';
import { Renderer } from '../engine/renderer';
import { GameObject } from '../engine/gameobject';

class Player {
  constructor(
    public id: number,
    public name: string,
    public transform: Transform = new Transform(),
  ) { }
}

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  player: Player = new Player(1, "Player1", new Transform());

  deltaTime = 0;
  elapsedTime = 0;
  lastTimestamp: DOMHighResTimeStamp | null = null;

  renderer: Renderer = new Renderer();

  ngOnInit() {
    console.log("GameComponent initialized");

    this.renderer.initWebGPU()
      .then(() => requestAnimationFrame(this.runGameLoop.bind(this)))
      .catch((error: any) => {
        console.error("Error initializing WebGPU:", error);
      });

    this.setupInput();
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
    const moveAmount = speed * this.deltaTime;

    Input.GetKey(Input.Key.W) && (this.player.transform.position.y += moveAmount);
    Input.GetKey(Input.Key.S) && (this.player.transform.position.y -= moveAmount);
    Input.GetKey(Input.Key.A) && (this.player.transform.position.x -= moveAmount);
    Input.GetKey(Input.Key.D) && (this.player.transform.position.x += moveAmount);
  }

  update(timestamp?: DOMHighResTimeStamp) {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp || performance.now();
    }

    // Update input state for the current frame
    Input.frameKeyMap.clear();
    this.updatePlayer();
    
    const time = timestamp || performance.now();
    this.deltaTime = (time - this.lastTimestamp) / 1000; // convert to seconds
    this.elapsedTime += this.deltaTime;
    this.lastTimestamp = timestamp || performance.now();
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