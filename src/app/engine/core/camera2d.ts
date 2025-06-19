import { Matrix3x3 } from "./matrix";
import { Transform2D } from "./transform";

enum ScalingMode {
    Fixed,
    ScreenSize
}

class Camera2D {
    transform: Transform2D;
    aspectRatio: number;
    matrix: Matrix3x3;

    scalingMode: ScalingMode = ScalingMode.Fixed;

    referenceResolution:[number, number] = [1920, 1080];
    resolutionScale: [number, number] = [1, 1];

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

            switch (this.scalingMode) {
                case ScalingMode.Fixed:
                    return matrix
                        .scale([1 / this.aspectRatio, 1]);
                case ScalingMode.ScreenSize:
                    return matrix
                        .scale(this.resolutionScale)
            }
    }

    updateResolutionScale(width: number, height: number) {
        this.resolutionScale = [
            this.referenceResolution[0] / width, 
            this.referenceResolution[0] / height
        ];
    }
}

export { Camera2D };