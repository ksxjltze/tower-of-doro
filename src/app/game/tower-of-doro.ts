import { ScriptBehaviour } from "../engine/behaviours/script.behaviour";
import { BehaviourType, GameBehaviour } from "../engine/core/game.behaviour";
import { GameObject } from "../engine/core/game.object";
import { GameSystem } from "../engine/core/game.system";
import { Time } from "../engine/core/time";

const kDoroDriveKey = "DoroDrives";

class DoroPlayer extends GameObject {
    constructor(readonly playerId: string) {
        super(playerId);
    }
}

class DoroDrive {
    doroParticles: number = 0;
    accumulationRate: number = 1;
    playerId: string | null = null;

    constructor() {

    }
}

class DoroDriveBehaviour extends GameBehaviour {
    constructor(gameObject: GameObject, readonly drive: DoroDrive = new DoroDrive()) {
        super(gameObject);
    }
}

//incremental gameplay (local)
class DoroDriveSystem extends GameSystem {
    override behaviours: DoroDriveBehaviour[];

    constructor() {
        super();
        this.behaviours = [];

        GameSystem.RegisterSystem(BehaviourType.DoroDrive, this);
    }

    addPlayer(player: DoroPlayer) {
        this.behaviours.push(new DoroDriveBehaviour(player));
    }

    override onInit(): void {
        console.log("DORO INIT");
        const driveData = localStorage.getItem(kDoroDriveKey);
        if (!driveData)
            return;

        this.behaviours = JSON.parse(driveData);
        console.log(this.behaviours);
    }

    override update(): void {
        for (const behavior of this.behaviours) {
            behavior.drive.doroParticles += behavior.drive.accumulationRate * Time.deltaTime;
        }
    }

    override onExit() {
        console.log("DORO EXIT");
        localStorage.setItem(kDoroDriveKey, JSON.stringify(this.behaviours));
    }

    override newBehaviour(gameObject: GameObject): GameBehaviour {
        const behavior = new DoroDriveBehaviour(gameObject);
        this.behaviours.push(behavior);

        return behavior;
    }

}

export { DoroDrive, DoroDriveBehaviour, DoroDriveSystem, DoroPlayer };