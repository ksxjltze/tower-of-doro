import { Component } from '@angular/core';
import { Runtime } from '../engine/runtime';
import { TileDescriptor, TileMap, TileType } from '../engine/tile';
import { Sprite } from '../engine/sprite.behaviour';

@Component({
  selector: 'app-editor',
  imports: [],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent {
  runtime: Runtime;
  tileMap: TileMap;

  constructor() {
    this.runtime = new Runtime();
    this.tileMap = new TileMap();
  }

  async CreateTileDescriptors() {
    const spriteSystem = this.runtime.spriteSystem;
    
    const grassSprite = new Sprite();
    await spriteSystem.loadTextureIntoSprite(grassSprite, "/resources/images/textures/tiles/grass_x64.png");

    const dirtSprite = new Sprite();
    await spriteSystem.loadTextureIntoSprite(dirtSprite, "/resources/images/textures/tiles/dirt_x64.png");

    this.tileMap.descriptors = [
      new TileDescriptor("Grass", TileType.Regular, grassSprite),
      new TileDescriptor("Dirt", TileType.Regular, dirtSprite)
    ];
  }

  ngOnInit() {
    console.log("EditorComponent initialized");
    this.runtime.init();
  }
}
