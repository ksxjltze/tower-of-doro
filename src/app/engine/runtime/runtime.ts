import { Camera } from "../core/camera2d";
import { Renderer } from "../core/renderer";
import { Scene } from "../core/scene";
import { Vector2, Vector3 } from "../core/vector";
import { Time } from "../core/time";
import { Input } from "../core/input";
import { GameObject } from "../core/game.object";

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

        //temp
        this.scene.objects.forEach(obj => {
            const speed = 1; // units per second
            obj.transform.position.x = Math.sin(this.elapsedTime * speed) * 1.5;
            obj.transform.position.y = Math.cos(this.elapsedTime * speed) * 1.5;
            obj.transform.rotation[2] += (Math.PI / 4) * Time.deltaTime; // rotate 45 degrees per second
            obj.transform.rotation[1] += (Math.PI / 4) * Time.deltaTime; // rotate 45 degrees per second
        });

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
        camera.transform.position = new Vector3(0, 0, -2);

        const gameObject = this.scene.AddObject(new GameObject("GameObject"));
        gameObject.transform.position = new Vector3(0, 0, 0);
        gameObject.transform.scale = [0.5, 0.5, 0.5];

        this.initialized = true;
        requestAnimationFrame(renderCallback.bind(this));
    }

    runGameLoop(timestamp?: DOMHighResTimeStamp) {
        this.update(timestamp);

        this.scene.update();
        this.scene.render(this.renderer);
        this.renderer.render();

        requestAnimationFrame(this.runGameLoop.bind(this));
    }

    onDestroy() {
        
    }
}

export { Runtime };
