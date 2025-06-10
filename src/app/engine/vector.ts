class Vector2 {
  constructor(
    public x: number = 0,
    public y: number = 0,
  ) { }

  static fromArray(arr: number[]): Vector2 {
    if (arr.length !== 2) {
      throw new Error("Array must have exactly 2 elements.");
    }
    return new Vector2(arr[0], arr[1]);
  }
}

export {Vector2};