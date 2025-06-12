import { Transform } from "./transform";
import { BehaviourType, GameBehaviour } from "./game.behaviour";
import { GameSystem } from "./game.system";

class GameObject {
    name: string;
    transform: Transform;
    behaviours: GameBehaviour[];

    constructor(name: string) {
        this.name = name;
        this.transform = new Transform();
        this.behaviours = [];
    };

    AddBehaviour(type: BehaviourType): GameBehaviour | null {
        return GameSystem.AddBehaviour(type, this);
    };
}

export { GameObject };