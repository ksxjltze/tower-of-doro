import { GameObject } from "./game.object";

class Scene {
    id: string;
    objects: GameObject[];
    
    constructor(id: string) {
        this.id = id;
        this.objects = [];
    }

    AddObject(gameObject: GameObject) {
        const length = this.objects.push(gameObject);

        return this.objects[length - 1];
    }
}

export { Scene };