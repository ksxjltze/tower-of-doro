import { Vector2 } from "./vector";

const Input = {
  Key: {
    W: 'w',
    A: 'a',
    S: 's',
    D: 'd',
  },

  MouseButton: {
    Left: 0,
    Middle: 1,
    Right: 2
  },

  keyMap: new Map<string, boolean>(),
  mouseMap: new Map<number, boolean>(),
  frameKeyMap: new Map<string, boolean>(),
  mousePos: new Vector2(),

  GetKeyDown: (key: string): boolean => {
    return Input.frameKeyMap.get(key) === true;
  },

  GetKeyUp: (key: string): boolean => {
    return Input.frameKeyMap.get(key) === false;
  },

  GetKey: (key: string): boolean => {
    return Input.keyMap.get(key) ?? false;
  },

  SetKey: (key: string, value: boolean): void => {
    Input.keyMap.set(key, value);
    Input.frameKeyMap.set(key, value);
  },

  GetMouseButtonDown: (button: number): boolean => {
    return Input.mouseMap.get(button) === true;
  },

  GetMouseButtonUp: (button: number): boolean => {
    return Input.mouseMap.get(button) === false;
  },

  GetMousePos: (): Vector2 => {
    return Input.mousePos;
  },

  setupInput() {
    document.addEventListener("keydown", this.keyDownHandler.bind(this), false);
    document.addEventListener("keyup", this.keyUpHandler.bind(this), false);
    document.addEventListener("mousedown", this.mouseDownHandler.bind(this), false);
    document.addEventListener("mouseup", this.mouseUpHandler.bind(this), false);
    document.addEventListener("mousemove", this.mouseMoveHandler.bind(this), false);
  },

  keyDownHandler(event: KeyboardEvent) {
    Input.SetKey(event.key, true);
  },

  keyUpHandler(event: KeyboardEvent) {
    Input.SetKey(event.key, false);
  },

  mouseDownHandler(event: MouseEvent) {
    Input.mousePos = new Vector2(event.clientX, event.clientY);
    Input.mouseMap.set(event.button, true);
  },

  mouseUpHandler(event: MouseEvent) {
    Input.mousePos = new Vector2(event.clientX, event.clientY);
    Input.mouseMap.set(event.button, false);
  },

  mouseMoveHandler(event: MouseEvent) {
    Input.mousePos = new Vector2(event.clientX, event.clientY);
  }
}

export { Input };