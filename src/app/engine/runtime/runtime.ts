import { Camera, Camera2D } from "../core/camera2d";
import { GameSystem } from "../core/game.system";
import { Renderer } from "../core/renderer";
import { Scene } from "../core/scene";
import { Vector2, Vector3 } from "../core/vector";
import { SpriteSystem } from "../systems/sprite.system";

class Runtime {
    scene: Scene;
    renderer: Renderer;
    systems: GameSystem[] = [];
    initialized: boolean = false;

    constructor() {
        this.scene = new Scene("NewScene");
        this.renderer = new Renderer();
    }

    async init(onInit: CallableFunction | undefined = undefined,
        renderCallback: FrameRequestCallback | undefined = undefined) {
        if (!renderCallback)
            renderCallback = this.render;

        await this.renderer.initWebGPU();
        if (onInit)
            await onInit();

        //temp
        const canvas = this.renderer.context?.canvas as HTMLCanvasElement;
        const camera = Camera.instance;
        camera.transform.position = new Vector3(0, 0, -1);

        this.initialized = true;
        requestAnimationFrame(renderCallback.bind(this));
    }

    render() {
        this
            .renderer
            .render(this.systems);

        requestAnimationFrame(this.render.bind(this));
    }
}

export { Runtime };
