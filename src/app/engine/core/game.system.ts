import { BehaviourType, GameBehaviour } from "./game.behaviour"
import { GameObject } from "./game.object";
import { Matrix3x3 } from "./matrix";
import { Renderer } from "./renderer";

abstract class GameSystem {
    abstract behaviours: Array<GameBehaviour>;
    abstract update(): void;
    abstract render(renderer: Renderer, drawFn: (matrix: Matrix3x3) => void): void;
    abstract add(gameObject: GameObject): GameBehaviour;

    static readonly systems: Map<BehaviourType, GameSystem> = new Map<BehaviourType, GameSystem>();
    static RegisterSystem(type: BehaviourType, system: GameSystem): void {
        GameSystem.systems.set(type, system);
    }
    static AddBehaviour(type: BehaviourType, gameObject: GameObject): GameBehaviour | null {
        const system = GameSystem.systems.get(type);
        if (!system)
            return null;

        return system.add(gameObject);
    }
};

export { GameSystem }