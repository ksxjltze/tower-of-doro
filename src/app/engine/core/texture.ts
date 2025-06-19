class Texture {
    handle: GPUTexture;
    changed: boolean = false;
    src: string = '';
    
    constructor (handle: GPUTexture, url: string) {
        this.handle = handle;
        this.src = url;
    }
}

export { Texture };