import { Component } from '@angular/core';
import { Runtime } from '../engine/runtime/runtime';
import { kTileSize, kTilemapWidth, kTilemapHeight, TileDescriptor, TileMap, TileType } from '../engine/core/tile';
import { Sprite } from '../engine/behaviours/sprite.behaviour';
import { GameSystem } from '../engine/core/game.system';
import { BehaviourType } from '../engine/core/game.behaviour';
import { SpriteSystem } from '../engine/systems/sprite.system';
import { Vector2 } from '../engine/core/vector';
import { Matrix4x4 } from '../engine/core/matrix';

@Component({
  selector: 'app-editor',
  imports: [],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent {
  runtime: Runtime;
  tileMap: TileMap;
  selectedTile: TileDescriptor | null = null;

  constructor() {
    this.runtime = new Runtime();
    this.tileMap = new TileMap();
  }

  selectTile(tileDescriptor: TileDescriptor) {
    this.selectedTile = tileDescriptor;
  }

  handleCanvasClick(event: MouseEvent) {
    if (!this.selectedTile)
      return;

    const canvas = this.runtime.renderer.context?.canvas as HTMLCanvasElement;
    if (!canvas)
      return;

    const mousePos = new Vector2(event.offsetX, event.offsetY);

    const x = (mousePos.x - canvas.clientWidth / 2 + kTilemapWidth / 2 * kTileSize);
    const y = (mousePos.y - canvas.clientHeight / 2 - kTilemapHeight / 2 * kTileSize);

    const i = x / kTileSize + 0.5;
    const j = y / kTileSize - 0.5;

    this.tileMap.setTile([Math.floor(i), Math.floor(-j)], this.selectedTile);
  }

  async CreateTileDescriptors() {
    const spriteSystem = GameSystem.GetSystem<SpriteSystem>(BehaviourType.Sprite);
    if (!spriteSystem)
      return;

    const grassSprite = new Sprite();
    await spriteSystem.loadTextureIntoSprite(grassSprite, "/resources/images/textures/tiles/grass_x64.png");

    const dirtSprite = new Sprite();
    await spriteSystem.loadTextureIntoSprite(dirtSprite, "/resources/images/textures/tiles/dirt_x64.png");

    this.tileMap.descriptors = [
      new TileDescriptor("Grass", 0, TileType.Regular, grassSprite),
      new TileDescriptor("Dirt", 1, TileType.Regular, dirtSprite)
    ];
  }

  ngOnInit() {
    console.log("EditorComponent initialized");
    this.runtime.init(() => {
      const spriteSystem = new SpriteSystem(); //kek
      this.CreateTileDescriptors()
        .then();

      this.runtime.initialized = true;
    });
  }
}
