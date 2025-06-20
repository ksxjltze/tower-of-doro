import { Matrix3x3 } from "./matrix";

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

  Multiply(amount: number) {
    this.x *= amount;
    this.y *= amount;

    return this;
  }

  applyMatrix(matrix: Matrix3x3) {
    const values = [this.x, this.y, 0];

    const x = matrix[0] * values[0] + matrix[1] * values[1] + matrix[2] * values[2];
    const y = matrix[4] * values[0] + matrix[5] * values[1] + matrix[6] * values[2];
    const z = matrix[8] * values[0] + matrix[9] * values[1] + matrix[10] * values[2];

    return [x, y, z];
  }

  Length() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  Normalize() {
    const length = this.Length();
    this.x /= length;
    this.y /= length;

    return this;
  }

  Add(other: Vector2) {
    this.x += other.x;
    this.y += other.y;

    return this;
  }
}

export {Vector2};