import { Matrix3x3 } from "./matrix";
import { Transform2D } from "./transform";

class Camera2D {
    transform: Transform2D;
    aspectRatio: number;
    matrix: Matrix3x3;

    static instance: Camera2D;
    constructor() {
        this.transform = new Transform2D();
        this.matrix = new Matrix3x3();
        this.aspectRatio = 1;

        Camera2D.instance = this;
    }

    computeViewMatrix() {
        const pos = this.transform.position;
        const rot = this.transform.rotation;
        const scale = this.transform.scale;
        
        const matrix = this.matrix
            .reset()
            .translate([pos.x, pos.y])
            .rotate(rot)
            .scale(scale);

        return matrix.scale([1, this.aspectRatio]);
    }
}

export { Camera2D };