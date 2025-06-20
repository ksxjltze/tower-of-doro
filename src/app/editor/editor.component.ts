import { Component } from '@angular/core';
import { Runtime } from '../engine/runtime/runtime';
import { kTileSize, kTilemapWidth, kTilemapHeight, TileDescriptor, TileMap, TileType } from '../engine/core/tile';
import { Sprite } from '../engine/behaviours/sprite.behaviour';
import { GameSystem } from '../engine/core/game.system';
import { BehaviourType } from '../engine/core/game.behaviour';
import { SpriteSystem } from '../engine/systems/sprite.system';
import { Vector2 } from '../engine/core/vector';
import { EditorRuntime } from '../engine/runtime/editor.runtime';

@Component({
  selector: 'app-editor',
  imports: [],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent {
  runtime: EditorRuntime;
  selectedTile: TileDescriptor | null = null;

  constructor() {
    this.runtime = new EditorRuntime();
  }

  selectTile(tileDescriptor: TileDescriptor) {
    this.selectedTile = tileDescriptor;
  }

  onSaveButtonClick() {
    const str = JSON.stringify(this.runtime.tileMap.getTiles());
    // var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(str);

    localStorage.setItem("tilemap", str);
  }

  handleCanvasClick(event: MouseEvent) {
    if (!this.selectedTile)
      return;

    const canvas = this.runtime.renderer.context?.canvas as HTMLCanvasElement;
    if (!canvas)
      return;

    const mousePos = new Vector2(event.offsetX, event.offsetY);

    const tileMapOffsetX = kTilemapWidth / 2 * kTileSize;
    const tileMapOffsetY = kTilemapHeight / 2 * kTileSize;

    const x = (mousePos.x - canvas.clientWidth / 2 + tileMapOffsetX);
    const y = (mousePos.y - canvas.clientHeight / 2 - tileMapOffsetY);

    const i = x / kTileSize + 0.5;
    const j = y / kTileSize - 0.5;

    this.runtime.tileMap.setTile([Math.floor(i), Math.floor(-j)], this.selectedTile);
  }

  ngOnInit() {
    console.log("EditorComponent initialized");
    this.runtime.init();
  }
}
