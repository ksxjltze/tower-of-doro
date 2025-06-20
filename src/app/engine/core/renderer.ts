import { Matrix3x3, Matrix4x4 } from './matrix';
import { kTileSize, kTilemapWidth, kTilemapHeight } from './tile';
import { shaders, tilemapShader, pickingShader } from './shaders';
import { Camera2D } from './camera2d';
import { Resources } from './resources';
import { GameSystem } from './game.system';
import { Constants } from './constants';

enum PipelineType {
  Sprite,
  Tile,
  Picking
};

class Renderer {
  static instance: Renderer;

  //WebGPU stuff
  context: GPUCanvasContext | null = null;
  device?: GPUDevice = undefined;
  vertexBuffer?: GPUBuffer = undefined;
  renderPipeline?: GPURenderPipeline = undefined;

  pipelineMap = new Map<PipelineType, GPURenderPipeline>();
  shaderMap = new Map<PipelineType, GPUShaderModule>();

  renderPassDescriptor?: GPURenderPassDescriptor = undefined;
  uniformBuffer?: GPUBuffer = undefined;
  uniformValues?: ArrayBuffer | GPUAllowSharedBufferSource = undefined;
  bindGroup?: GPUBindGroup = undefined;
  sampler?: GPUSampler;
  depthTexture?: GPUTexture;

  //tilemap
  tileMapBuffer?: GPUBuffer = undefined;
  tileMapPipeline?: GPURenderPipeline = undefined;
  tileMapBindGroup?: GPUBindGroup = undefined;
  tileMapValues?: Float32Array | GPUAllowSharedBufferSource = undefined;
  tileMapUniformsBuffer?: GPUBuffer = undefined;
  tileMapUniformValues?: Float32Array | GPUAllowSharedBufferSource = undefined;

  tileMapMatrixValue: Float32Array = new Float32Array(24);
  tileMapColor: Float32Array = new Float32Array(4);
  tileOffset: number;
  tileMapMatrix: Matrix3x3 = new Matrix3x3();

  // Uniform values
  uniform_Matrix: Float32Array = new Float32Array();
  uniform_Color: Float32Array = new Float32Array();
  uniform_Sprite_UV_Size_X: Float32Array = new Float32Array();
  uniform_Sprite_UV_Offset_X: Float32Array = new Float32Array();

  //camera?
  baseScale = 1 / 4;

  constructor() {
    this.tileOffset = 0;
  }

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

    const spriteSize = Constants.UnitSize / 2;
    const vertices: Float32Array = new Float32Array([
      -spriteSize, -spriteSize, 0.0, 0.0,  // bottom left
      spriteSize, -spriteSize, 1.0, 0.0,  // bottom right
      -spriteSize, spriteSize, 0.0, 1.0,  // top left

      -spriteSize, spriteSize, 0.0, 1.0,  // top left
      spriteSize, -spriteSize, 1.0, 0.0,  // bottom right
      spriteSize, spriteSize, 1.0, 1.0,  // top right
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

    const canvasTexture = this.context.getCurrentTexture();
    const depthTexture = device.createTexture({
      size: [canvasTexture.width, canvasTexture.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

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
      depthStencilAttachment: {
        // view: <- to be filled out when we render
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        view: depthTexture.createView(),
      },
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

  async createPickingPipeline(vertexBuffers: GPUVertexBufferLayout[]) {
    const device = this.device;
    if (!device)
      return;

    const shaderModule = device.createShaderModule({
      code: pickingShader
    });

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
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
      layout: "auto",
    };

    const pipeline = device.createRenderPipeline(pipelineDescriptor);

    this.shaderMap.set(PipelineType.Picking, shaderModule);
    this.pipelineMap.set(PipelineType.Picking, pipeline);
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
        // cullMode: 'back'
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      layout: "auto",
    };

    this.renderPipeline = device.createRenderPipeline(pipelineDescriptor);

    //size in bytes
    const colorUniformSize = 16;
    const matrixUniformSize = 64;
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

    const doroIdleTexture = await Resources.loadDoroTexture(device);
    const doroRunTexture = await Resources.loadDoroRunSpriteSheet(device);

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
    this.sampler = sampler;
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
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      layout: "auto",
    };
    this.tileMapPipeline = device.createRenderPipeline(tileMapPipelineDescriptor);

    const colorUniformSize = 16;
    const matrixUniformSize = 64;
    const floatByteSize = 4;
    const uniformBufferSize = colorUniformSize + matrixUniformSize;

    const tileMapUniformBuffer = device.createBuffer({
      label: 'tilemap uniforms',
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const tileMapUniformValues = new Float32Array(uniformBufferSize / 4);

    const kColorOffset = 0;
    const kMatrixOffset = 4;

    const colorUniformFloatCount = (colorUniformSize / floatByteSize);
    const matrixUniformFloatCount = (matrixUniformSize / floatByteSize);

    const tileMapColorValue = tileMapUniformValues.subarray(kColorOffset, kColorOffset + colorUniformFloatCount);
    const tileMapMatrixValue = tileMapUniformValues.subarray(kMatrixOffset, kMatrixOffset + matrixUniformFloatCount);

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

    this.tileOffset = offset;
    this.updateTileMap(tileMapData, offset);

    //textures
    const tileTextures = await Resources.loadTileSheet(device);
    const tileSheet = tileTextures[0];

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
        { binding: 3, resource: tileSheet.createView() },
      ],
    });

    this.tileMapBindGroup = tileMapBindGroup;
    this.tileMapUniformsBuffer = tileMapUniformBuffer;
    this.tileMapUniformValues = tileMapUniformValues;
    this.tileMapColor.set([1.0, 1.0, 1.0, 1.0]);
  }

  setTile([x, y]: [number, number], [textureX, textureY]: [number, number]) {
    if (!this.tileMapValues)
      return;

    const i = y * kTilemapWidth + x;
    const tileMapData = this.tileMapValues as Float32Array;

    tileMapData[i * this.tileOffset] = x; // x position
    tileMapData[i * this.tileOffset + 1] = y; // y position
    tileMapData[i * this.tileOffset + 2] = textureX; //texture offset x
    tileMapData[i * this.tileOffset + 3] = textureY; //texture offset y

    console.log(i, x, y);
  }

  updateTileMap(tileMapData: Float32Array, offset: number) {
    if (!this.context)
      return;

    for (let i = 0; i < kTilemapWidth * kTilemapHeight; i++) {
      // Set position based on tile index
      const x = (i % kTilemapWidth);
      const y = Math.floor(i / kTilemapWidth);

      tileMapData[i * offset] = x * kTileSize; // x position
      tileMapData[i * offset + 1] = y * kTileSize; // y position
      tileMapData[i * offset + 2] = 0; //texture offset x
      tileMapData[i * offset + 3] = 0; //texture offset y
    }
  }

  render(systems: GameSystem[]) {
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

    Camera2D.instance.transform.scale = [this.baseScale, this.baseScale];

    const canvasTexture = this.context.getCurrentTexture();

    //@ts-ignore
    renderPassDescriptor.colorAttachments[0].view = canvasTexture.createView();
    const depthTexture = this.depthTexture;
    // If we don't have a depth texture OR if its size is different
    // from the canvasTexture when make a new depth texture
    if (!depthTexture ||
      depthTexture.width !== canvasTexture.width ||
      depthTexture.height !== canvasTexture.height) {
      if (depthTexture) {
        depthTexture.destroy();
      }
      this.depthTexture = device.createTexture({
        size: [canvasTexture.width, canvasTexture.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }

    //@ts-ignore
    renderPassDescriptor.depthStencilAttachment.view = this.depthTexture?.createView();

    const pass = encoder.beginRenderPass(renderPassDescriptor);
    const uniformBuffer = this.uniformBuffer;
    const renderPipeline = this.renderPipeline;
    const uniformValues = this.uniformValues;
    const canvas = this.context?.canvas as HTMLCanvasElement;

    const view = new Matrix4x4().translate([canvas.clientWidth / 2, -canvas.clientHeight / 2, 0]);
    const proj = new Matrix4x4()
      .orthographic(
        0,                   // left
        canvas.clientWidth,  // right
        -canvas.clientHeight, // bottom
        0,                   // top
        400,                 // near
        -400,                // far
      ) as Matrix4x4;

    this.drawTileMap(pass, device, view, proj);

    //scuffed
    systems.forEach(system => {
      if (!system.render)
        return;

      system.render(this, (matrix) => {
        matrix
          .multiply(view)
          .multiply(proj);

        this.uniform_Matrix.set(matrix);

        // upload the uniform values to the uniform buffer
        device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

        pass.setPipeline(renderPipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, this.bindGroup);

        pass.draw(6);
      });

    });

    pass.end();
    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
  }

  drawTileMap(pass: GPURenderPassEncoder, device: GPUDevice, view: Matrix4x4, proj: Matrix4x4) {
    if (this.tileMapPipeline && this.tileMapBindGroup && this.tileMapBuffer && this.tileMapValues && this.tileMapUniformValues && this.tileMapUniformsBuffer) {
      // upload the uniform values to the uniform buffer
      device.queue.writeBuffer(this.tileMapBuffer, 0, this.tileMapValues);

      const matrix = new Matrix4x4();
      matrix
        .translate([-kTilemapWidth / 2 * kTileSize, -kTilemapHeight / 2 * kTileSize, 0])
        .multiply(view)
        .multiply(proj);

      this.tileMapMatrixValue.set(matrix);
      device.queue.writeBuffer(this.tileMapUniformsBuffer, 0, this.tileMapUniformValues);

      pass.setPipeline(this.tileMapPipeline);
      pass.setBindGroup(0, this.tileMapBindGroup);
      pass.setVertexBuffer(0, this.vertexBuffer);
      pass.setBindGroup(0, this.tileMapBindGroup);

      pass.draw(6, kTilemapWidth * kTilemapHeight, 0, 0); // draw all tiles
    }
  }

  //temp
  setTexture(texture: GPUTexture) {
    if (!this.device || !this.renderPipeline || !this.sampler || !this.uniformBuffer)
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
}

export { Renderer };