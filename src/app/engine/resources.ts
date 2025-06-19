class Resources {
    static async loadImageBitmap(url: URL | string): Promise<ImageBitmap> {
        const res = await fetch(url);
        const blob = await res.blob();

        return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
    }

    static async loadTileSheet(device: GPUDevice): Promise<GPUTexture[]> {
        const urls = [
            '/resources/images/textures/tiles/tilesheet_debug.png'
        ];

        const textures: GPUTexture[] = [];
        for (const url of urls) {
            const source = await Resources.loadImageBitmap(url);
            const texture = device.createTexture({
                label: url,
                format: 'rgba8unorm',
                size: [source.width, source.height],
                usage: GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT,
            });

            if (!texture) {
                throw new Error(`Failed to create texture for ${url}.`);
            }

            device.queue.copyExternalImageToTexture(
                { source, flipY: true },
                { texture },
                { width: source.width, height: source.height },
            );

            textures.push(texture);
        }

        return textures;
    }

    static async loadDoroTexture(device: GPUDevice): Promise<GPUTexture> {
        const url = '/resources/images/textures/doro/sprites/idle/doro.png';
        return await Resources.loadTexture(url, device);
    }

    static async loadDoroRunSpriteSheet(device: GPUDevice): Promise<GPUTexture> {
        const url = '/resources/images/textures/doro/sprites/run/doro-run.png';
        return await Resources.loadTexture(url, device);
    }

    static async loadTexture(url: string, device: GPUDevice): Promise<GPUTexture> {
        const source = await Resources.loadImageBitmap(url);
        const texture = device.createTexture({
            label: url,
            format: 'rgba8unorm',
            size: [source.width, source.height],
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        if (!texture) {
            throw new Error("Failed to create texture.");
        }

        device.queue.copyExternalImageToTexture(
            { source, flipY: true },
            { texture },
            { width: source.width, height: source.height },
        );

        return texture;
    }
}

export { Resources };