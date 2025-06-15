import { Component } from '@angular/core';
import { Matrix3x3 } from '../engine/matrix';
import { Input } from '../engine/input';
import { TileDescriptor, TileFlags } from '../engine/tile';
import { kTileSize, kTilemapWidth, kTilemapHeight } from '../engine/tile';
import { Transform2D } from '../engine/transform';
import { Vector2 } from '../engine/vector';
import { shaders, tilemapShader } from '../engine/shaders';
import { GameObject } from './game.object';
import { SpriteBehaviour } from './sprite.behaviour';
import { BehaviourType } from './game.behaviour';
import { GameComponent } from '../game/game.component';
import { Camera2D } from './camera2d';

async function loadImageBitmap(url: URL | string): Promise<ImageBitmap> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
}

class Renderer {
  static instance: Renderer;

  //WebGPU stuff
  context: GPUCanvasContext | null = null;
  device?: GPUDevice = undefined;
  vertexBuffer?: GPUBuffer = undefined;
  renderPipeline?: GPURenderPipeline = undefined;

  renderPassDescriptor?: GPURenderPassDescriptor = undefined;
  uniformBuffer?: GPUBuffer = undefined;
  uniformValues?: ArrayBuffer | GPUAllowSharedBufferSource = undefined;
  bindGroup?: GPUBindGroup = undefined;
  sampler?: GPUSampler;

  //tilemap
  tileMapBuffer?: GPUBuffer = undefined;
  tileMapPipeline?: GPURenderPipeline = undefined;
  tileMapBindGroup?: GPUBindGroup = undefined;
  tileMapValues?: Float32Array | GPUAllowSharedBufferSource = undefined;
  tileMapUniformsBuffer?: GPUBuffer = undefined;
  tileMapUniformValues?: Float32Array | GPUAllowSharedBufferSource = undefined;

  tileMapMatrixValue: Float32Array = new Float32Array(12); // 3x4 matrix for tilemap transformations
  tileMapColor: Float32Array = new Float32Array(4); // RGBA color for tilemap

  // Uniform values
  uniform_Matrix: Float32Array = new Float32Array();
  uniform_Color: Float32Array = new Float32Array();
  uniform_Sprite_UV_Size_X: Float32Array = new Float32Array();
  uniform_Sprite_UV_Offset_X: Float32Array = new Float32Array();

  //camera?
  baseScale = 2.0 / kTileSize;

  async initWebGPU() {
    if (!navigator.gpu) {
      throw Error("WebGPU not supported.");
    }

    Renderer.instance = this; //laziness
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw Error("Couldn't request WebGPU adapter.");
    }

    const device = await adapter.requestDevice();
    this.device = device;

    const shaderModule = device.createShaderModule({
      code: shaders,
    });

    const tileMapShader = device.createShaderModule({
      code: tilemapShader,
    });

    const canvas = document.querySelector("#gameCanvas") as HTMLCanvasElement;
    this.context = canvas.getContext("webgpu");

    if (!this.context) {
      throw Error("Couldn't get WebGPU context from canvas.");
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.context.configure({
      device: device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: "premultiplied",
    });

    //square
    const vertices: Float32Array = new Float32Array([
      -0.5, -0.5, 0.0, 0.0,  // bottom left
      0.5, -0.5, 1.0, 0.0,  // bottom right
      -0.5, 0.5, 0.0, 1.0,  // top left

      -0.5, 0.5, 0.0, 1.0,  // top left
      0.5, -0.5, 1.0, 0.0,  // bottom right
      0.5, 0.5, 1.0, 1.0,  // top right
    ]);

    this.vertexBuffer = device.createBuffer({
      size: vertices.byteLength, // make it big enough to store vertices in
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(this.vertexBuffer, 0, vertices, 0, vertices.length);
    const vertexBuffers: GPUVertexBufferLayout[] = [
      {
        attributes: [
          {
            shaderLocation: 0, // position
            offset: 0,
            format: "float32x2",
          },
          {
            shaderLocation: 1, // uv
            offset: 8, // 2 floats (position) * 4 bytes each = 8 bytes offset
            format: "float32x2",
          },
        ],
        arrayStride: 16, // 2 floats (position) + 2 floats (uv) = 4 floats * 4 bytes each = 16 bytes
        stepMode: "vertex",
      },
    ];

    await this.createRenderPipeline(shaderModule, vertexBuffers);
    await this.createTileMapPipeline(tileMapShader, vertexBuffers);

    const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };
    this.renderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: clearColor,
          loadOp: "clear",
          storeOp: "store",
          view: this.context.getCurrentTexture().createView(),
        },
      ],
    };

    const observer = new ResizeObserver(entries => {
      if (this.device === undefined || this.context === null) {
        console.error("WebGPU device or context not initialized.");
        return;
      }

      for (const entry of entries) {
        const canvas = entry.target as HTMLCanvasElement;
        const width = entry.contentBoxSize[0].inlineSize;
        const height = entry.contentBoxSize[0].blockSize;

        canvas.width = Math.max(1, Math.min(width, this.device.limits.maxTextureDimension2D));
        canvas.height = Math.max(1, Math.min(height, this.device.limits.maxTextureDimension2D));

        Camera2D.instance.aspectRatio = canvas.width / canvas.height;
        Camera2D.instance.updateResolutionScale(canvas.width, canvas.height);
      }

    });

    observer.observe(canvas);
  }

  async createRenderPipeline(shaderModule: GPUShaderModule, vertexBuffers: GPUVertexBufferLayout[]) {
    const device = this.device;
    if (!device)
      return;

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      vertex: {
        module: shaderModule,
        entryPoint: "vertex_main",
        buffers: vertexBuffers,
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragment_main",
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
            blend: {
              color: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha'
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha'
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
      layout: "auto",
    };

    this.renderPipeline = device.createRenderPipeline(pipelineDescriptor);

    //size in bytes
    const colorUniformSize = 16;
    const matrixUniformSize = 48;
    const uvOffsetUniformSize = 16;
    const uvSizeUniformSize = 16;
    const floatByteSize = 4;

    const colorUniformFloatCount = (colorUniformSize / floatByteSize);
    const matrixUniformFloatCount = (matrixUniformSize / floatByteSize);

    const uniformBufferSize = colorUniformSize + matrixUniformSize + uvOffsetUniformSize + uvSizeUniformSize;
    const uniformBuffer = device.createBuffer({
      label: 'uniforms',
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformValues = new ArrayBuffer(uniformBufferSize);
    const uniformFloatView = new Float32Array(uniformValues);

    const kColorOffset = 0;
    const kMatrixOffset = kColorOffset + colorUniformFloatCount;
    const kUVSizeXOffset = kMatrixOffset + matrixUniformFloatCount;
    const kUVOffsetXOffset = kUVSizeXOffset + 1;

    const colorValue = uniformFloatView.subarray(kColorOffset, kColorOffset + colorUniformFloatCount);
    const matrixValue = uniformFloatView.subarray(kMatrixOffset, kMatrixOffset + matrixUniformFloatCount);
    const uvSizeXValue = uniformFloatView.subarray(kUVSizeXOffset, kUVSizeXOffset + 1);
    const uvOffsetXValue = uniformFloatView.subarray(kUVOffsetXOffset, kUVOffsetXOffset + 1);

    this.uniform_Color = colorValue;
    this.uniform_Matrix = matrixValue;
    this.uniform_Sprite_UV_Size_X = uvSizeXValue;
    this.uniform_Sprite_UV_Offset_X = uvOffsetXValue;

    // colorValue.set([Math.random(), Math.random(), Math.random(), 1]);
    this.uniform_Color.set([1.0, 1.0, 1.0, 1.0]); // white color

    const doroIdleTexture = await this.loadDoroTexture();
    const doroRunTexture = await this.loadDoroRunSpriteSheet();

    const sampler = device.createSampler({
      label: 'sampler for object',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    });

    const bindGroup = device.createBindGroup({
      label: 'bind group for object',
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: sampler },
        { binding: 2, resource: doroRunTexture.createView() },
      ],
    });

    this.uniformBuffer = uniformBuffer;
    this.uniformValues = uniformValues;
    this.bindGroup = bindGroup;
    this.sampler =  sampler;
  }

  async createTileMapPipeline(tileMapShader: GPUShaderModule, vertexBuffers: GPUVertexBufferLayout[]) {
    const device = this.device;
    if (!device)
      return;

    //tilemap setup
    const tileMapPipelineDescriptor: GPURenderPipelineDescriptor = {
      vertex: {
        module: tileMapShader,
        entryPoint: "vertex_main",
        buffers: vertexBuffers,
      },
      fragment: {
        module: tileMapShader,
        entryPoint: "fragment_main",
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
      layout: "auto",
    };
    this.tileMapPipeline = device.createRenderPipeline(tileMapPipelineDescriptor);

    const uniformBufferSize = (4 + 12) * 4;
    const tileMapUniformBuffer = device.createBuffer({
      label: 'tilemap uniforms',
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const tileMapUniformValues = new Float32Array(uniformBufferSize / 4);

    const kColorOffset = 0;
    const kMatrixOffset = 4;

    const tileMapColorValue = tileMapUniformValues.subarray(kColorOffset, kColorOffset + 4);
    const tileMapMatrixValue = tileMapUniformValues.subarray(kMatrixOffset, kMatrixOffset + 12);

    this.tileMapColor = tileMapColorValue;
    this.tileMapMatrixValue = tileMapMatrixValue;

    const tileByteSize = 4;
    const tileMapBufferLength = kTilemapWidth * kTilemapHeight * tileByteSize;
    const tileMapBufferSize = tileMapBufferLength * Float32Array.BYTES_PER_ELEMENT;
    this.tileMapBuffer = device.createBuffer({
      label: 'tilemap buffer',
      size: tileMapBufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const offset = tileByteSize;
    const data = new ArrayBuffer(tileMapBufferSize);
    const tileMapData = new Float32Array(data);

    for (let i = 0; i < kTilemapWidth * kTilemapHeight; i++) {
      // Set position based on tile index
      const x = (i % kTilemapWidth);
      const y = Math.floor(i / kTilemapWidth);

      tileMapData[i * offset] = x; // x position
      tileMapData[i * offset + 1] = y; // y position
      tileMapData[i * offset + 2] = 0.5000001; //texture offset
      tileMapData[i * offset + 3] = 0;
    }

    //textures
    const tileMaptextures = await this.loadTilemapTextures();

    //temp
    const tileMapTexture = tileMaptextures[0];

    const sampler = device.createSampler({
      label: 'sampler for object',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      magFilter: 'nearest',
      minFilter: 'nearest',
      mipmapFilter: 'nearest',
    });

    this.tileMapValues = tileMapData;
    const tilemapBindGroupLayout = this.tileMapPipeline.getBindGroupLayout(0);
    const tileMapBindGroup = device.createBindGroup({
      label: 'bind group for tilemap',
      layout: tilemapBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.tileMapBuffer } },
        { binding: 1, resource: { buffer: tileMapUniformBuffer } },
        { binding: 2, resource: sampler },
        { binding: 3, resource: tileMapTexture.createView() },
      ],
    });

    this.tileMapBindGroup = tileMapBindGroup;
    this.tileMapUniformsBuffer = tileMapUniformBuffer;
    this.tileMapUniformValues = tileMapUniformValues;
    this.tileMapColor.set([1.0, 1.0, 1.0, 1.0]);
  }

  render(objects: GameObject[]) {
    if (!this.context || !this.device || !this.renderPipeline || !this.vertexBuffer
      || !this.renderPassDescriptor || !this.uniformBuffer
      || !this.bindGroup || !this.uniformValues) {
      console.error("WebGPU not fully initialized.");
      return;
    }

    const device = this.device;
    const renderPassDescriptor = this.renderPassDescriptor;

    if (!renderPassDescriptor)
      throw new Error("Render pass descriptor is not defined.");

    //@ts-ignore
    renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
    const encoder = device.createCommandEncoder({
      label: 'render quad encoder',
    });

    const viewMatrix = Camera2D.instance.computeViewMatrix();
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    if (this.tileMapPipeline && this.tileMapBindGroup && this.tileMapBuffer && this.tileMapValues && this.tileMapUniformValues && this.tileMapUniformsBuffer) {
      // upload the uniform values to the uniform buffer
      device.queue.writeBuffer(this.tileMapBuffer, 0, this.tileMapValues);

      const scale = this.baseScale; // scale to fit the tile size
      const matrix = Matrix3x3.identity();

      matrix.translate([-1, -0.5]); //center the tilemap
      matrix.scale([scale, scale]);
      matrix.translate([0.5, 0.5]);
      matrix.multiply(viewMatrix);

      this.tileMapMatrixValue.set(matrix);
      device.queue.writeBuffer(this.tileMapUniformsBuffer, 0, this.tileMapUniformValues);

      pass.setPipeline(this.tileMapPipeline);
      pass.setBindGroup(0, this.tileMapBindGroup);
      pass.setVertexBuffer(0, this.vertexBuffer);
      pass.setBindGroup(0, this.tileMapBindGroup);

      pass.draw(6, kTilemapWidth * kTilemapHeight, 0, 0); // draw all tiles
    }

    //transform the model matrix
    let scale = this.baseScale; // scale to fit the tile size
    const matrix = Matrix3x3.identity();

    const uniformBuffer = this.uniformBuffer;
    const renderPipeline = this.renderPipeline;
    const uniformValues = this.uniformValues;

    objects.forEach(gameObject => {
      //temp
      const spriteBehaviour = gameObject.GetBehaviour<SpriteBehaviour>(BehaviourType.Sprite);
      const sprite = spriteBehaviour?.sprite;

      if (sprite) {
        if (sprite.texture?.changed) {
          this.setTexture(sprite.texture?.handle!);
          sprite.texture.changed = false;
        }

        if (sprite.animated) {
          this.uniform_Sprite_UV_Size_X.set([1 / sprite.frameCount]);
          this.uniform_Sprite_UV_Offset_X.set([Math.floor(spriteBehaviour.frameIndex) / sprite.frameCount]);
        }
        else {
          this.uniform_Sprite_UV_Size_X.set([1]);
          this.uniform_Sprite_UV_Offset_X.set([0]);
        }

        matrix
          .translate([gameObject.transform.position.x, gameObject.transform.position.y])
          .scale([spriteBehaviour.flipX ? -scale : scale, scale]);
      }
      else {
        matrix
          .translate([gameObject.transform.position.x, gameObject.transform.position.y])
          .scale([scale, scale]);
      }

      matrix.multiply(viewMatrix);
      this.uniform_Matrix.set(matrix);

      // upload the uniform values to the uniform buffer
      device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

      pass.setPipeline(renderPipeline);
      pass.setBindGroup(0, this.bindGroup);
      pass.setVertexBuffer(0, this.vertexBuffer);
      pass.setBindGroup(0, this.bindGroup);

      pass.draw(6);
    });

    pass.end();
    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
  }

  //temp
  setTexture(texture: GPUTexture) {
    if (!this.device || ! this.renderPipeline || !this.sampler || !this.uniformBuffer)
      return;

    const bindGroup = this.device.createBindGroup({
      label: 'bind group for object',
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: this.sampler },
        { binding: 2, resource: texture.createView() },
      ],
    });

    this.bindGroup = bindGroup;
  }

  async loadDoroRunSpriteSheet(): Promise<GPUTexture> {
    const url = '/resources/images/textures/doro/sprites/run/doro-run.png';
    return await this.loadTexture(url);
  }

  async loadTexture(url: string): Promise<GPUTexture> {
    const source = await loadImageBitmap(url);
    const texture = this.device?.createTexture({
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

    this.device?.queue.copyExternalImageToTexture(
      { source, flipY: true },
      { texture },
      { width: source.width, height: source.height },
    );

    return texture;
  }

  async loadDoroTexture(): Promise<GPUTexture> {
    const url = '/resources/images/textures/doro/sprites/idle/doro.png';
    return await this.loadTexture(url);
  }

  async loadTilemapTextures(): Promise<GPUTexture[]> {
    const urls = [
      '/resources/images/textures/tiles/tilesheet.png'
    ];

    const textures: GPUTexture[] = [];
    for (const url of urls) {
      const source = await loadImageBitmap(url);
      const texture = this.device?.createTexture({
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

      this.device?.queue.copyExternalImageToTexture(
        { source, flipY: true },
        { texture },
        { width: source.width, height: source.height },
      );

      textures.push(texture);
    }

    return textures;
  }
}

export { Renderer };