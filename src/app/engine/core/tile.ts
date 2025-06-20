import { Sprite } from "../behaviours/sprite.behaviour";
import { Constants } from "./constants";
import { Renderer } from "./renderer";

class Tile {
  constructor(
    public x: number,
    public y: number,
    public descriptorId: number = 0,
  ) { }
}

enum TileType {
  Regular
}

enum TileFlags {
  None = 0,
  Collidable = 1 << 0, // 1
  Animated = 1 << 1, // 2
  FlippedHorizontally = 1 << 2, // 4
  FlippedVertically = 1 << 3, // 8
}

class TileDescriptor {
  constructor(
    public name: string,
    public id: number,
    public type: TileType,
    public sprite: Sprite,
    public flags: TileFlags = TileFlags.None,
  ) { }
}

class TileMap {
  descriptors: TileDescriptor[];

  constructor() {
    this.descriptors = [];
  }

  setTile([x, y]: [number, number], tileDescriptor: TileDescriptor) {
    const textureOffsetX = tileDescriptor.id / this.descriptors.length;
    Renderer.instance.setTile([x, y], [textureOffsetX, 0]);
  }

  getTiles() {
    return Renderer.instance.tileMapValues;
  }
}

const kTileSize = Constants.UnitSize;
const kTileMapInitialWidth = 32;
const kTileMapInitialHeight = 32;

export { kTileMapInitialHeight as kTilemapHeight, kTileMapInitialWidth as kTilemapWidth, kTileSize, Tile, TileDescriptor, TileFlags, TileMap, TileType };
