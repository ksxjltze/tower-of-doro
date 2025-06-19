import { Camera2D } from "../core/camera2d";
import { GameSystem } from "../core/game.system";
import { Renderer } from "../core/renderer";
import { Scene } from "../core/scene";
import { SpriteSystem } from "../systems/sprite.system";

class Runtime {
    scene: Scene;
    renderer: Renderer;

    spriteSystem: SpriteSystem;
    systems: GameSystem[] = [];

    camera: Camera2D = new Camera2D();
    initialized: boolean = false;

    constructor() {
        this.scene = new Scene("NewScene");
        this.renderer = new Renderer();
        this.spriteSystem = new SpriteSystem();

        this.systems.push(this.spriteSystem);
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
            .render(this.systems);

        requestAnimationFrame(this.render.bind(this));
    }
}

export { Runtime };
