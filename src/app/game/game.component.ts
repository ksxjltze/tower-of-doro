import { Component } from '@angular/core';
import { Runtime } from '../engine/runtime';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  runtime: Runtime;

  constructor() {
    this.runtime = new Runtime();
  }

  ngOnInit() {
    console.log("GameComponent initialized");
    this.runtime
      .init()
      .then();
  }
}