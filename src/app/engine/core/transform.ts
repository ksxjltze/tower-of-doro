import { Vector2, Vector3 } from './vector';

class Transform2D {
  constructor(
    public position: Vector2 = new Vector2(0, 0),
    public rotation: number = 0,
    public scale: [number, number] = [1, 1],
  ) { }
}

class Transform3D {
  constructor(
    public position: Vector3 = new Vector3(0, 0, 0),
    public rotation: [number, number, number] = [0, 0, 0],
    public scale: [number, number, number] = [1, 1, 1],
  ) { }
}

export { Transform2D, Transform3D };