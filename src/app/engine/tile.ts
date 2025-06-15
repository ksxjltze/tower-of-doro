import { Sprite, SpriteBehaviour } from "./sprite.behaviour";
import { Texture } from "./texture";

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
}

const kTileSize = 16; // 16x16 pixels
const kTilemapWidth = 16;
const kTilemapHeight = 8;

export { Tile, TileFlags, TileDescriptor, TileMap, TileType };
export { kTileSize, kTilemapWidth, kTilemapHeight };