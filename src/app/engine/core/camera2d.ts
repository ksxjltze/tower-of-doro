import { Matrix3x3, Matrix4x4 } from "./matrix";
import { Transform2D } from "./transform";

enum ScalingMode {
    Fixed,
    ScreenSize
}

class Camera {
    transform: Transform2D;
    static instance: Camera;

    aspectRatio: number;
    matrix: Matrix4x4;

    scalingMode: ScalingMode = ScalingMode.Fixed;

    referenceResolution: [number, number] = [1920, 1080];
    resolutionScale: [number, number] = [1, 1];

    constructor() {
        this.transform = new Transform2D();
        this.matrix = new Matrix4x4();
        this.aspectRatio = 1;

        Camera.instance = this;
    }

    updateResolutionScale(width: number, height: number) {
        this.resolutionScale = [
            this.referenceResolution[0] / width,
            this.referenceResolution[0] / height
        ];
    }

    computeViewMatrix() {
        const pos = this.transform.position;
        const rot = this.transform.rotation;
        const scale = this.transform.scale;

        const matrix = this.matrix
            .reset()
            .translate([pos.x, pos.y, 1])
            .rotateZ(rot)
            .scale([scale[0], scale[1], 1]);

        // switch (this.scalingMode) {
        //     case ScalingMode.Fixed:
        //         return matrix
        //             .scale([1 / this.aspectRatio, 1, 1]);
        //     case ScalingMode.ScreenSize:
        //         return matrix
        //             .scale([this.resolutionScale[0], this.resolutionScale[1], 1])
        // }

        return matrix;
    }
}

class Camera2D extends Camera {
    constructor() {
        super();
    }
}

export { Camera, Camera2D };