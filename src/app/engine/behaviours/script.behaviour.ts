import { BehaviourType, GameBehaviour } from "../core/game.behaviour";
import { GameObject } from "../core/game.object";

class ScriptBehaviour extends GameBehaviour {
    start: () => void;
    update: () => void;

    override type: BehaviourType = BehaviourType.Script;
    constructor(gameObject: GameObject | null) {
        super(gameObject);

        this.start = () => {
            console.log("SCRIPT START");
        };

        this.update = () => {
            console.log("SCRIPT UPDATE");
        }
    }
}

export { ScriptBehaviour }