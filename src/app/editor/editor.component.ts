import { Component } from '@angular/core';
import { Runtime } from '../engine/runtime';

@Component({
  selector: 'app-editor',
  imports: [],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent {
  runtime: Runtime;

  constructor() {
    this.runtime = new Runtime();
  }

  ngOnInit() {
    console.log("EditorComponent initialized");
    this.runtime.init();
  }
}
