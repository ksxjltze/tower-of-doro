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
        const behaviour = GameSystem.AddBehaviour(type, this);
        if (!behaviour)
            return null;

        this.behaviours.push(behaviour);
        return behaviour;
    };

    GetBehaviour<T extends GameBehaviour>(type: BehaviourType): T | undefined {
        return this.behaviours.find((behaviour) => {
            return behaviour.type == type;
        }) as T;
    }
}

export { GameObject };