import { Component } from '@angular/core';
import { GameComponent } from "../game/game.component";

@Component({
  selector: 'app-editor',
  imports: [GameComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent {

}
