import { Renderer } from "./renderer";
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
}

const kTileSize = 64;
const kTileMapInitialWidth = 16;
const kTileMapInitialHeight = 8;

export { Tile, TileFlags, TileDescriptor, TileMap, TileType };
export { kTileSize, kTileMapInitialWidth as kTilemapWidth, kTileMapInitialHeight as kTilemapHeight };