import { Transform } from "./transform";
import { BehaviourType, GameBehaviour } from "./game.behaviour";
import { GameSystem } from "./game.system";

class GameObject {
    name: string;
    transform: Transform;
    behaviours: Map<BehaviourType, GameBehaviour>;

    constructor(name: string) {
        this.name = name;
        this.transform = new Transform();
        this.behaviours = new Map<BehaviourType, GameBehaviour>();
    };

    SetBehaviour(type: BehaviourType, behavior: GameBehaviour): GameBehaviour {
        if (this.behaviours.has(type))
            this.behaviours.get(type)!.gameObject = null;

        this.behaviours.set(type, behavior);
        behavior.gameObject = this;

        return behavior;
    }

    AddBehaviour(type: BehaviourType): GameBehaviour | null {
        const behaviour = GameSystem.AddBehaviour(type, this);
        if (!behaviour)
            return null;

        if (this.behaviours.has(type))
            this.behaviours.get(type)!.gameObject = null;

        this.behaviours.set(type, behaviour);
        return behaviour;
    };

    GetBehaviour<T extends GameBehaviour>(type: BehaviourType): T | undefined {
        return this.behaviours.get(type) as T;
    }
}

export { GameObject };