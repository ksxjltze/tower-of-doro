class Tile {
  constructor(
    public id: number,
    public x: number,
    public y: number,
    public descriptorId: number = 0,
  ) { }

  static fromArray(arr: number[]): Tile {
    if (arr.length !== 5) {
      throw new Error("Array must have exactly 5 elements.");
    }
    return new Tile(arr[0], arr[1], arr[2]);
  }
}

enum TileFlags {
  None = 0,
  Collidable = 1 << 0, // 1
  Animated = 1 << 1, // 2
  FlippedHorizontally = 1 << 2, // 4
  FlippedVertically = 1 << 3, // 8
}

enum TileType {
  Empty = 0,
  Solid = 1,
  Water = 2,
  Lava = 3,
  Grass = 4,
  Sand = 5,
  Stone = 6,
}

class TileDescriptor {
  constructor(
    public id: number,
    public type: TileType,
    public textureId: number = 0,
    public flags: TileFlags = TileFlags.None,
  ) { }

  static fromArray(arr: number[]): TileDescriptor {
    if (arr.length !== 4) {
      throw new Error("Array must have exactly 4 elements.");
    }
    return new TileDescriptor(arr[0], arr[1], arr[2], arr[3]);
  }
}

const kTileSize = 16; // 16x16 pixels
const kTilemapWidth = 16;
const kTilemapHeight = 8;
const kTileDescriptors: TileDescriptor[] = [
  new TileDescriptor(0, TileType.Empty, 0, TileFlags.None),
  new TileDescriptor(1, TileType.Solid, 1, TileFlags.Collidable),
  new TileDescriptor(2, TileType.Water, 2, TileFlags.None),
  new TileDescriptor(3, TileType.Lava, 3, TileFlags.Collidable | TileFlags.FlippedHorizontally),
  new TileDescriptor(4, TileType.Grass, 4, TileFlags.Animated),
  new TileDescriptor(5, TileType.Sand, 5, TileFlags.FlippedVertically),
  new TileDescriptor(6, TileType.Stone, 6, TileFlags.Collidable | TileFlags.Animated),
];

export { Tile, TileFlags, TileType, TileDescriptor };
export { kTileSize, kTilemapWidth, kTilemapHeight, kTileDescriptors };