import { Vector2 } from './vector';

class Transform {
  constructor(
    public position: Vector2 = new Vector2(0, 0),
    public rotation: number = 0,
    public scale: [number, number] = [1, 1],
  ) { }
}

export { Transform };