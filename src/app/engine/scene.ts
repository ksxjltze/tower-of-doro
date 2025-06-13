import { GameObject } from "./game.object";
import { Tile } from "./tile";

class Scene {
    id: string;
    objects: GameObject[];
    tileMap: Tile[];
    
    constructor(id: string) {
        this.id = id;
        this.objects = [];
        this.tileMap = [];
    }
}

export { Scene };