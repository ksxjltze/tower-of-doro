class Texture {
    handle: GPUTexture;
    changed: boolean = false;
    
    constructor (handle: GPUTexture) {
        this.handle = handle;
    }
}

export { Texture };