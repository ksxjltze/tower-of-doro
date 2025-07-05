import { Runtime } from "../engine/runtime/runtime";
import { Input } from "../engine/core/input";
import { Camera, Camera2D } from "../engine/core/camera2d";
import { SpriteSystem } from "../engine/systems/sprite.system";
import { Sprite } from "../engine/behaviours/sprite.behaviour";
import { GameSystem } from "../engine/core/game.system";
import { TileDescriptor, TileMap, TileType } from "../engine/core/tile";
import { BehaviourType } from "../engine/core/game.behaviour";
import { Vector2, Vector3 } from "../engine/core/vector";


class EditorRuntime extends Runtime {
    tileMap: TileMap;

    panning: boolean = false;
    initialPos: Vector3 = new Vector3();
    cameraPos: Vector3 = new Vector3();

    constructor() {
        super();
        Input.setupInput();

        this.tileMap = new TileMap();
    }

    update(timestamp?: DOMHighResTimeStamp) {
        // Update input state for the current frame
        Input.frameKeyMap.clear();
        const mousePos = new Vector3(Input.mousePos.x, Input.mousePos.y, 0);

        //PAN
        if (Input.GetMouseButtonDown(Input.MouseButton.Middle)) {
            const camera = Camera.instance;

            if (!this.panning) {
                this.cameraPos = new Vector3(
                    camera.transform.position.x,
                    camera.transform.position.y);

                this.initialPos = mousePos;
                this.panning = true;
            }

            const panMovement = mousePos.subtract(this.initialPos);
            panMovement.y = - panMovement.y;

            camera.transform.position = this.cameraPos.add(panMovement);
        }
        else if (Input.GetMouseButtonUp(Input.MouseButton.Middle)) {
            this.panning = false;
        }

        for (const system of this.systems) {
            system.update();
        }
    }

    runGameLoop(timestamp?: DOMHighResTimeStamp) {
        this.update(timestamp);
        this.renderer.render(this.systems);

        requestAnimationFrame(this.runGameLoop.bind(this));
    }

    override async init() {
        const init = async () => {
            const spriteSystem = new SpriteSystem();
            this.tileMap.loadFromLocalStorage();

            await this.CreateTileDescriptors();
        };

        await super.init(init.bind(this), this.runEditorLoop)
    }

    runEditorLoop(timestamp?: DOMHighResTimeStamp) {
        this.update(timestamp);
        this.renderer.render(this.systems);

        requestAnimationFrame(this.runEditorLoop.bind(this));
    }

    async CreateTileDescriptors() {
        const spriteSystem = GameSystem.GetSystem<SpriteSystem>(BehaviourType.Sprite);
        if (!spriteSystem)
            return;

        const grassSprite = new Sprite();
        await spriteSystem.loadTextureIntoSprite(grassSprite, "/resources/images/textures/tiles/grass_x64.png");

        const dirtSprite = new Sprite();
        await spriteSystem.loadTextureIntoSprite(dirtSprite, "/resources/images/textures/tiles/dirt_x64.png");

        this.tileMap.descriptors = [
            new TileDescriptor("Grass", 0, TileType.Regular, grassSprite),
            new TileDescriptor("Dirt", 1, TileType.Regular, dirtSprite)
        ];
    }
}

export { EditorRuntime };

