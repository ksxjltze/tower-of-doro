import { Renderer } from "./renderer";
import { SpriteSystem } from "./sprite.system";
import { Scene } from "./scene";
import { Camera2D } from "./camera2d";

class Runtime {
    scene: Scene;
    renderer: Renderer;
    spriteSystem: SpriteSystem;

    camera: Camera2D = new Camera2D();
    initialized: boolean = false;

    constructor() {
        this.scene = new Scene("NewScene");
        this.renderer = new Renderer();
        this.spriteSystem = new SpriteSystem();
    }

    init(onInit: CallableFunction | undefined = undefined,
        renderCallback: FrameRequestCallback | undefined = undefined) {
        if (!renderCallback)
            renderCallback = this.render;

        this.renderer.initWebGPU()
            .then(() => {
                if (onInit)
                    onInit();
                else {
                    this.initialized = true;
                }

                requestAnimationFrame(renderCallback.bind(this));
            })
            .catch((error: any) => {
                console.error("Error initializing WebGPU:", error);
            });
    }

    render() {
        this
            .renderer
            .render(this.scene.objects);

        requestAnimationFrame(this.render.bind(this));
    }
}

export { Runtime };