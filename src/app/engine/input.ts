const Input = {
  Key: {
    W: 'w',
    A: 'a',
    S: 's',
    D: 'd',
  },

  MouseButton: {
    Left: 0,
    Right: 1,
    Middle: 2,
  },

  keyMap: new Map<string, boolean>(),
  frameKeyMap: new Map<string, boolean>(),

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
}

export {Input};