import { Runtime } from "./runtime";
import { Input } from "../core/input";
import { Camera, Camera2D } from "../core/camera2d";
import { SpriteSystem } from "../systems/sprite.system";
import { Sprite } from "../behaviours/sprite.behaviour";
import { GameSystem } from "../core/game.system";
import { TileDescriptor, TileMap, TileType } from "../core/tile";
import { BehaviourType } from "../core/game.behaviour";
import { Vector2 } from "../core/vector";


class EditorRuntime extends Runtime {
    tileMap: TileMap;

    panning: boolean = false;
    initialPos: Vector2 = new Vector2();
    cameraPos: Vector2 = new Vector2();

    constructor() {
        super();
        Input.setupInput();

        this.tileMap = new TileMap();
    }

    update(timestamp?: DOMHighResTimeStamp) {
        // Update input state for the current frame
        Input.frameKeyMap.clear();

        //PAN
        if (Input.GetMouseButtonDown(Input.MouseButton.Middle)) {
            const camera = Camera.instance;

            if (!this.panning) {
                this.cameraPos = new Vector2(
                    camera.transform.position.x,
                    camera.transform.position.y);

                this.initialPos = Input.mousePos;
                this.panning = true;
            }

            const panMovement = Input.mousePos.subtract(this.initialPos);
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

    override init() {
        super.init(() => {
            const spriteSystem = new SpriteSystem();
            this.CreateTileDescriptors()
                .then();

            this.tileMap.loadFromLocalStorage();
            this.initialized = true;
        }, this.runEditorLoop)
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

