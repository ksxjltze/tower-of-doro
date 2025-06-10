import { Transform } from "./transform";

class GameObject {
    name: string;
    transform: Transform;
    constructor(name: string) {
        this.name = name;
        this.transform = new Transform();
    }
}

export { GameObject };