import { Component } from '@angular/core';
import { Runtime } from '../engine/runtime';
import { GameRuntime } from '../engine/game.runtime';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  runtime: GameRuntime;

  constructor() {
    this.runtime = new GameRuntime();
  }

  ngOnInit() {
    console.log("GameComponent initialized");
    this.runtime.init();
  }
}