import { Matrix3x3, Matrix4x4 } from './matrix';
import { kTileSize, kTilemapWidth, kTilemapHeight } from './tile';
import { shaders, tilemapShader, pickingShader } from './shaders';
import { Camera, Camera2D } from './camera2d';
import { Resources } from './resources';
import { GameSystem } from './game.system';
import { Constants } from './constants';
import { Vector2 } from './vector';

enum PipelineType {
  Sprite,
  Tile,
  Picking
};

class DoroColor {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}

class DoroRenderPipeline {
  renderPassDescriptor?: GPURenderPassDescriptor = undefined;
  sampler?: GPUSampler;
  depthTexture?: GPUTexture;
  renderPipeline: GPURenderPipeline;
  uniformBuffer?: DoroUniformBuffer;
  name: string;
  layer: number;

  constructor(name: string, pipeline: GPURenderPipeline, layer?: number) {
    if (layer == undefined)
      layer = 0;

    this.renderPipeline = pipeline;
    this.name = name;
    this.layer = layer;
  }
}

class DoroUniformBuffer {
  buffer: GPUBuffer;
  values: ArrayBuffer | GPUAllowSharedBufferSource;
  bindGroup: GPUBindGroup;

  constructor(uniformBuffer: GPUBuffer, values: ArrayBuffer | GPUAllowSharedBufferSource, bindGroup: GPUBindGroup) {
    this.buffer = uniformBuffer;
    this.values = values;
    this.bindGroup = bindGroup;
  }
}

class Renderer {
  static instance: Renderer;

  static Pipeline = {
    Doro3D: "doro3D",
    Doro2DTilemap: "doro2DTilemap",
  };

  //WebGPU stuff
  context: GPUCanvasContext | null = null;
  device?: GPUDevice = undefined;
  vertexBuffer?: GPUBuffer = undefined;

  pipelineMap = new Map<PipelineType, GPURenderPipeline>();
  shaderMap = new Map<PipelineType, GPUShaderModule>();
  pipelines = new Map<string, DoroRenderPipeline>();

  //tilemap
  tileMapValues?: Float32Array | GPUAllowSharedBufferSource = undefined;

  tileMapMatrixValue: Float32Array = new Float32Array(24);
  tileMapColor: Float32Array = new Float32Array(4);
  tileOffset: number;
  tileMapMatrix: Matrix4x4 = new Matrix4x4();

  // Uniform values
  uniform_Matrix: Float32Array = new Float32Array();
  uniform_Color: Float32Array = new Float32Array();
  uniform_Sprite_UV_Size_X: Float32Array = new Float32Array();
  uniform_Sprite_UV_Offset_X: Float32Array = new Float32Array();

  //camera?
  baseScale = 1 / 4;
  camera: Camera2D = new Camera2D();

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

    const doro3DPipeline = await this.createRenderPipeline(Renderer.Pipeline.Doro3D, shaderModule, vertexBuffers);
    if (!doro3DPipeline) {
      console.error("Failed to create Doro3D pipeline.");
      return;
    }
    this.pipelines.set(Renderer.Pipeline.Doro3D, doro3DPipeline);

    const doro2DTilemapPipeline = await this.createTileMapPipeline(tileMapShader, vertexBuffers);
    if (!doro2DTilemapPipeline) {
      console.error("Failed to create Doro2D Tilemap pipeline.");
      return;
    }
    // this.pipelines.set(Renderer.Pipeline.Doro2DTilemap, doro2DTilemapPipeline);

    const canvasTexture = this.context.getCurrentTexture();
    const depthTexture = this.createDepthTexture(this.device, canvasTexture);

    const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };
    doro3DPipeline.renderPassDescriptor = this.createGenericRenderPassDescriptor(clearColor, this.context, depthTexture);

    const observer = new ResizeObserver(entries => {
      if (this.device === undefined || this.context === null) {
        console.error("WebGPU device or context not initialized.");
        return;
      }

      for (const entry of entries) {
        const canvas = entry.target as HTMLCanvasElement;
        const width = entry.contentBoxSize[0].inlineSize;
        const height = entry.contentBoxSize[0].blockSize;

        if (width == 0 || height == 0) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
        else {
          canvas.width = Math.max(1, Math.min(width, this.device.limits.maxTextureDimension2D));
          canvas.height = Math.max(1, Math.min(height, this.device.limits.maxTextureDimension2D));
        }

        Camera.instance.aspectRatio = canvas.width / canvas.height;
        Camera.instance.updateResolutionScale(canvas.width, canvas.height);
      }

    });

    observer.observe(canvas);
  }

  createDepthTexture(device: GPUDevice, canvasTexture: GPUTexture) {
    const depthTexture = device.createTexture({
      size: [canvasTexture.width, canvasTexture.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    return depthTexture;
  }

  createGenericRenderPassDescriptor(clearColor: DoroColor, context: GPUCanvasContext, depthTexture: GPUTexture) {
    const renderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: clearColor,
          loadOp: "clear",
          storeOp: "store",
          view: context.getCurrentTexture().createView(),
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

    return renderPassDescriptor as GPURenderPassDescriptor;
  }

  generateSpriteVertices() {
    const spriteSize = Constants.UnitSize / 2;
    const vertices: Float32Array = new Float32Array([
      -spriteSize, -spriteSize, 0.0, 0.0,  // bottom left
      spriteSize, -spriteSize, 1.0, 0.0,  // bottom right
      -spriteSize, spriteSize, 0.0, 1.0,  // top left

      -spriteSize, spriteSize, 0.0, 1.0,  // top left
      spriteSize, -spriteSize, 1.0, 0.0,  // bottom right
      spriteSize, spriteSize, 1.0, 1.0,  // top right
    ]);

    return vertices;
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

  async createRenderPipeline(pipelineName: string, shaderModule: GPUShaderModule, vertexBuffers: GPUVertexBufferLayout[]) {
    const device = this.device;
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

    if (!device)
      return null;

    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    const doroRenderPipeline = new DoroRenderPipeline(pipelineName, renderPipeline);

    const sampler = device.createSampler({
      label: 'sampler for object',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    });

    const doroUniformBuffer = await this.createDoro3DUniformBuffer(device, renderPipeline, sampler);

    doroRenderPipeline.uniformBuffer = doroUniformBuffer;
    doroRenderPipeline.sampler = sampler;
    return doroRenderPipeline;
  }

  async createDoro3DUniformBuffer(device: GPUDevice, renderPipeline: GPURenderPipeline, sampler: GPUSampler) {
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

    //TODO: move
    const doroIdleTexture = await Resources.loadDoroTexture(device);
    const doroRunTexture = await Resources.loadDoroRunSpriteSheet(device);

    const bindGroup = device.createBindGroup({
      label: 'bind group for object',
      layout: renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: sampler },
        { binding: 2, resource: doroRunTexture.createView() },
      ],
    });

    const doroUniformBuffer = new DoroUniformBuffer(uniformBuffer, uniformValues, bindGroup);
    return doroUniformBuffer;
  }

  async createTileMapPipeline(tileMapShader: GPUShaderModule, vertexBuffers: GPUVertexBufferLayout[]) {
    const device = this.device;
    if (!device)
      return null;

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

    const tileMapPipeline = device.createRenderPipeline(tileMapPipelineDescriptor);
    const doroTilemapRenderPipeline = new DoroRenderPipeline(Renderer.Pipeline.Doro2DTilemap, tileMapPipeline, 1);

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

    const tileFloatCount = 4;
    const tileMapBufferLength = kTilemapWidth * kTilemapHeight * tileFloatCount;
    const tileMapBufferSize = tileMapBufferLength * Float32Array.BYTES_PER_ELEMENT;
    const tileMapBuffer = device.createBuffer({
      label: 'tilemap buffer',
      size: tileMapBufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const offset = tileFloatCount;
    const data = new ArrayBuffer(tileMapBufferSize);
    const tileMapData = new Float32Array(data);

    this.tileOffset = offset;
    this.tileMapValues = tileMapData;

    this.initTileMap();

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

    const tilemapBindGroupLayout = doroTilemapRenderPipeline.renderPipeline.getBindGroupLayout(0);
    const tileMapBindGroup = device.createBindGroup({
      label: 'bind group for tilemap',
      layout: tilemapBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: tileMapBuffer } },
        { binding: 1, resource: { buffer: tileMapUniformBuffer } },
        { binding: 2, resource: sampler },
        { binding: 3, resource: tileSheet.createView() },
      ],
    });

    const doroTilemapUniformBuffer = new DoroUniformBuffer(tileMapBuffer, tileMapData, tileMapBindGroup);
    this.tileMapColor.set([1.0, 1.0, 1.0, 1.0]);

    const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };
    const canvasTexture = this.context!.getCurrentTexture();
    const depthTexture = this.createDepthTexture(this.device!, canvasTexture);

    doroTilemapRenderPipeline.renderPassDescriptor = this.createGenericRenderPassDescriptor(clearColor, this.context!, depthTexture);
    doroTilemapRenderPipeline.uniformBuffer = doroTilemapUniformBuffer;
    doroTilemapRenderPipeline.sampler = sampler;

    return doroTilemapRenderPipeline;
  }

  setTile([x, y]: [number, number], [textureX, textureY]: [number, number]) {
    if (!this.tileMapValues)
      return;

    const i = y * kTilemapWidth + x;
    const tileMapData = this.tileMapValues as Float32Array;

    tileMapData[i * this.tileOffset] = x * kTileSize; // x position
    tileMapData[i * this.tileOffset + 1] = y * kTileSize; // y position
    tileMapData[i * this.tileOffset + 2] = textureX;
    tileMapData[i * this.tileOffset + 3] = textureY; //texture offset y
  }

  updateTileMap(data: Float32Array) {
    if (!this.context)
      return;

    const tileMapData = this.tileMapValues as Float32Array;
    for (let i = 0; i < data.length; ++i) {
      const tileIndex = i * this.tileOffset;

      tileMapData[tileIndex] = data[tileIndex];
      tileMapData[tileIndex + 1] = data[tileIndex + 1];
      tileMapData[tileIndex + 2] = data[tileIndex + 2];
      tileMapData[tileIndex + 3] = data[tileIndex + 3];
    }
  }

  initTileMap() {
    if (!this.context)
      return;

    const tileMapData = this.tileMapValues as Float32Array;

    for (let i = 0; i < kTilemapWidth * kTilemapHeight; i++) {
      // Set position based on tile index
      const x = (i % kTilemapWidth);
      const y = Math.floor(i / kTilemapWidth);

      tileMapData[i * this.tileOffset] = x * kTileSize; // x position
      tileMapData[i * this.tileOffset + 1] = y * kTileSize; // y position
      tileMapData[i * this.tileOffset + 2] = 0; //texture offset x
      tileMapData[i * this.tileOffset + 3] = 0; //texture offset y
    }
  }

  render(systems: GameSystem[]) {
    this.pipelines.forEach(pipeline => {
      if (!this.context || !this.device || !this.vertexBuffer) {
        console.error("WebGPU not fully initialized.");
        return;
      }

      if (!pipeline.renderPassDescriptor || !pipeline.uniformBuffer
        || !pipeline.uniformBuffer.bindGroup || !pipeline.uniformBuffer.buffer) {
        console.log(pipeline);
        console.error("Render pipeline not fully initialized.");
        return;
      }

      const device = this.device;
      const renderPassDescriptor = pipeline.renderPassDescriptor;

      if (!renderPassDescriptor)
        throw new Error("Render pass descriptor is not defined.");

      //@ts-ignore
      renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
      const encoder = device.createCommandEncoder({
        label: 'render quad encoder',
      });

      const canvasTexture = this.context.getCurrentTexture();

      //@ts-ignore
      renderPassDescriptor.colorAttachments[0].view = canvasTexture.createView();
      const depthTexture = pipeline.depthTexture;
      // If we don't have a depth texture OR if its size is different
      // from the canvasTexture when make a new depth texture
      if (!depthTexture ||
        depthTexture.width !== canvasTexture.width ||
        depthTexture.height !== canvasTexture.height) {
        if (depthTexture) {
          depthTexture.destroy();
        }
        pipeline.depthTexture = device.createTexture({
          size: [canvasTexture.width, canvasTexture.height],
          format: 'depth24plus',
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
      }

      //@ts-ignore
      renderPassDescriptor.depthStencilAttachment.view = pipeline.depthTexture?.createView();

      const pass = encoder.beginRenderPass(renderPassDescriptor);
      const uniformBuffer = pipeline.uniformBuffer.buffer;
      const uniformValues = pipeline.uniformBuffer.values;
      const canvas = this.context?.canvas as HTMLCanvasElement;

      if (!uniformBuffer || !uniformValues || !canvas) {
        console.error("Uniform buffer or canvas is not defined.");
        return;
      }

      const camera = Camera.instance;
      const view = camera.computeViewMatrix();
      const proj = new Matrix4x4()
        .perspective(
          Math.PI / 2, // 45 degrees field of view
          canvas.clientWidth / canvas.clientHeight, // aspect ratio
          0.1, // near plane
          1000 // far plane
        ) as Matrix4x4;

      // this.drawTileMap(pass, device, view, proj);
      const bindGroup = pipeline.uniformBuffer.bindGroup;

      //scuffed
      systems.forEach(system => {
        if (!system.render)
          return;
        
        if (!system.pipelines.includes(pipeline.name))
          return;

        system.render(this, (matrix) => {
          matrix
            .multiply(view)
            .multiply(proj);

          this.uniform_Matrix.set(matrix);

          // upload the uniform values to the uniform buffer
          device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
          pass.setPipeline(pipeline.renderPipeline);
          pass.setBindGroup(0, bindGroup);
          pass.setVertexBuffer(0, this.vertexBuffer);
          pass.setBindGroup(0, bindGroup);

          pass.draw(6);
        });

      });

      pass.end();
      const commandBuffer = encoder.finish();
      device.queue.submit([commandBuffer]);
    });
  }

  drawTileMap(tileMapPipeline: DoroRenderPipeline, pass: GPURenderPassEncoder, device: GPUDevice, view: Matrix4x4, canvas: HTMLCanvasElement) {
    const uniformBuffer = tileMapPipeline.uniformBuffer;
    if (!uniformBuffer?.buffer || !this.tileMapValues) {
      return;
    }

    const proj = new Matrix4x4()
      .orthographic(
        0,                   // left
        canvas.clientWidth,  // right
        -canvas.clientHeight, // bottom
        0,                   // top
        400,                 // near
        -400,                // far
      ) as Matrix4x4;

    // upload the uniform values to the uniform buffer
    device.queue.writeBuffer(uniformBuffer.buffer, 0, this.tileMapValues);

    const matrix = new Matrix4x4();
    matrix
      .translate([-kTilemapWidth / 2 * kTileSize, -kTilemapHeight / 2 * kTileSize, 0])
      .multiply(view)
      .multiply(proj);

    this.tileMapMatrixValue.set(matrix);
    this.tileMapMatrix = matrix;

    device.queue.writeBuffer(uniformBuffer.buffer, 0, uniformBuffer.values);

    pass.setPipeline(tileMapPipeline.renderPipeline);
    pass.setBindGroup(0, uniformBuffer.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setBindGroup(0, uniformBuffer.bindGroup);

    pass.draw(6, kTilemapWidth * kTilemapHeight, 0, 0); // draw all tiles
  }

  getPipeline(name: string): DoroRenderPipeline | undefined {
    return this.pipelines.get(name);
  }

  setTexture(texture: GPUTexture, pipeline: DoroRenderPipeline) {
    if (!this.device || !pipeline.renderPipeline || !pipeline.sampler || !pipeline.uniformBuffer || !pipeline.uniformBuffer.buffer)
      return;

    const uniformBuffer = pipeline.uniformBuffer;
    const bindGroup = this.device.createBindGroup({
      label: 'bind group for object',
      layout: pipeline.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer.buffer! } },
        { binding: 1, resource: pipeline.sampler },
        { binding: 2, resource: texture.createView() },
      ],
    });

    uniformBuffer.bindGroup = bindGroup;
  }
}

export { Renderer };