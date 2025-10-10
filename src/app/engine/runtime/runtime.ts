import { Camera } from "../core/camera2d";
import { Renderer } from "../core/renderer";
import { Scene } from "../core/scene";
import { Vector2, Vector3 } from "../core/vector";
import { Time } from "../core/time";
import { Input } from "../core/input";

class Runtime {
    scene: Scene;
    renderer: Renderer;
    initialized: boolean = false;

    elapsedTime = 0;
    lastTimestamp: DOMHighResTimeStamp | null = null;

    constructor() {
        this.scene = new Scene("NewScene");
        this.renderer = new Renderer();

        Input.setupInput();
    }

    update(timestamp?: DOMHighResTimeStamp) {
        if (this.lastTimestamp === null) {
            this.lastTimestamp = timestamp || performance.now();
        }

        const time = timestamp || performance.now();
        Time.deltaTime = (time - this.lastTimestamp) / 1000; // convert to seconds

        this.elapsedTime += Time.deltaTime;
        this.lastTimestamp = timestamp || performance.now();

        //TODO: frame management

        // Update input state for the current frame
        Input.frameKeyMap.clear();
    }

    async init(onInit: CallableFunction | undefined = undefined,
        renderCallback: FrameRequestCallback | undefined = undefined) {
        if (!renderCallback)
            renderCallback = this.runGameLoop;

        await this.renderer.initWebGPU();
        if (onInit)
            await onInit();

        const camera = Camera.instance;
        camera.transform.position = new Vector3(0, 0, -1);

        this.initialized = true;
        requestAnimationFrame(renderCallback.bind(this));
    }

    runGameLoop(timestamp?: DOMHighResTimeStamp) {
        this.update(timestamp);
        this.renderer.render();

        requestAnimationFrame(this.runGameLoop.bind(this));
    }

    onDestroy() {
        
    }
}

export { Runtime };
