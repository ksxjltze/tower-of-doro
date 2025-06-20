import { BehaviourType, GameBehaviour } from "./game.behaviour"
import { GameObject } from "./game.object";
import { Matrix3x3, Matrix4x4 } from "./matrix";
import { Renderer } from "./renderer";

abstract class GameSystem {
    abstract behaviours: Array<GameBehaviour>;
    abstract update(): void;
    abstract newBehaviour(gameObject: GameObject): GameBehaviour;

    render: ((renderer: Renderer, drawFn: (matrix: Matrix4x4) => void) => void) | undefined;
    constructor() {
        this.render = undefined;
    }

    static readonly types: Map<string, BehaviourType> = new Map<string, BehaviourType>();
    static readonly systems: Map<BehaviourType, GameSystem> = new Map<BehaviourType, GameSystem>();
    
    static RegisterSystem(type: BehaviourType, system: GameSystem): void {
        GameSystem.systems.set(type, system);
    }

    static GetSystem<T extends GameSystem>(type: BehaviourType) {
        return GameSystem.systems.get(type) as T;
    }

    static NewBehaviour(type: BehaviourType, gameObject: GameObject): GameBehaviour | null {
        const system = GameSystem.systems.get(type);
        if (!system)
            return null;

        return system.newBehaviour(gameObject);
    }

    static AddBehaviour(gameObject: GameObject, behavior: GameBehaviour): void {
        const system = GameSystem.systems.get(behavior.type);
        if (!system)
            return;

        behavior.gameObject = gameObject;
        system.behaviours.push(behavior);
    }
};

export { GameSystem }