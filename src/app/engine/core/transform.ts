import { Matrix4x4 } from './matrix';
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

  computeModelMatrix(): Matrix4x4 {
    let matrix = new Matrix4x4();

    const maxRotateX = Matrix4x4.rotationX(this.rotation[0], new Matrix4x4());
    const maxRotateY = Matrix4x4.rotationY(this.rotation[1], new Matrix4x4());
    const maxRotateZ = Matrix4x4.rotationZ(this.rotation[2], new Matrix4x4());

    const matRotate = maxRotateZ.multiply(maxRotateY).multiply(maxRotateX);
    const matScale = Matrix4x4.scaling([this.scale[0], this.scale[1], this.scale[2]]);
    const matTranslate = Matrix4x4.translation([this.position.x, this.position.y, this.position.z,]);

    matrix = matrix.multiply(matScale).multiply(matRotate).multiply(matTranslate);
    return matrix;
  }
}

export { Transform2D, Transform3D };