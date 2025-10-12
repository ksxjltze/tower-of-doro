import { GameObject } from "./game.object";
import { Renderer } from "./renderer";

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

    update() {

    }

    render(renderer: Renderer) {
        this.objects.forEach(obj => {
            renderer.pushTransform(obj.transform);
        });
    }
}

export { Scene };