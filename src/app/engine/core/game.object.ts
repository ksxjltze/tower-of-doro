import { Transform3D } from "./transform";
import { BehaviourType, GameBehaviour } from "./game.behaviour";

class GameObject {
    name: string;
    transform: Transform3D;
    behaviours: Map<BehaviourType, GameBehaviour>;

    constructor(name: string) {
        this.name = name;
        this.transform = new Transform3D();
        this.behaviours = new Map<BehaviourType, GameBehaviour>();
    };
}

export { GameObject };