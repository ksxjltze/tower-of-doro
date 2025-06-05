import { Component } from '@angular/core';
//I liek beeg file

async function loadImageBitmap(url: URL | string): Promise<ImageBitmap> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
}

class Tile {
  constructor(
    public id: number,
    public x: number,
    public y: number,
    public descriptorId: number = 0,
  ) { }

  static fromArray(arr: number[]): Tile {
    if (arr.length !== 5) {
      throw new Error("Array must have exactly 5 elements.");
    }
    return new Tile(arr[0], arr[1], arr[2]);
  }
}

enum TileFlags {
  None = 0,
  Collidable = 1 << 0, // 1
  Animated = 1 << 1, // 2
  FlippedHorizontally = 1 << 2, // 4
  FlippedVertically = 1 << 3, // 8
}

enum TileType {
  Empty = 0,
  Solid = 1,
  Water = 2,
  Lava = 3,
  Grass = 4,
  Sand = 5,
  Stone = 6,
}

class TileDescriptor {
  constructor(
    public id: number,
    public type: TileType,
    public textureId: number = 0,
    public flags: TileFlags = TileFlags.None,
  ) { }

  static fromArray(arr: number[]): TileDescriptor {
    if (arr.length !== 4) {
      throw new Error("Array must have exactly 4 elements.");
    }
    return new TileDescriptor(arr[0], arr[1], arr[2], arr[3]);
  }
}

const kTileSize = 16; // 16x16 pixels
const kTilemapWidth = 100; // 100 tiles wide
const kTilemapHeight = 100; // 100 tiles high
const kTileDescriptors: TileDescriptor[] = [
  new TileDescriptor(0, TileType.Empty, 0, TileFlags.None),
  new TileDescriptor(1, TileType.Solid, 1, TileFlags.Collidable),
  new TileDescriptor(2, TileType.Water, 2, TileFlags.None),
  new TileDescriptor(3, TileType.Lava, 3, TileFlags.Collidable | TileFlags.FlippedHorizontally),
  new TileDescriptor(4, TileType.Grass, 4, TileFlags.Animated),
  new TileDescriptor(5, TileType.Sand, 5, TileFlags.FlippedVertically),
  new TileDescriptor(6, TileType.Stone, 6, TileFlags.Collidable | TileFlags.Animated),
];

class Matrix4x4 extends Float32Array {
  constructor() {
    super(16);
    this.set(Matrix4x4.identityValues());
  }

  static identityValues(): number[] {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  }

  static identity(): Matrix4x4 {
    return new Matrix4x4();
  }

  static fromArray(arr: number[]): Matrix4x4 {
    if (arr.length !== 16) {
      throw new Error("Array must have exactly 16 elements.");
    }

    const matrix = new Matrix4x4();
    matrix.set(arr);

    return matrix;
  }
}

class Matrix3x3 extends Float32Array {
  constructor() {
    super(9);
    this.set(Matrix3x3.identityValues());
  }

  static identityValues(): number[] {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ];
  }

  static identity(): Matrix3x3 {
    return new Matrix3x3();
  }

  static fromArray(arr: number[]): Matrix3x3 {
    if (arr.length !== 9) {
      throw new Error("Array must have exactly 9 elements.");
    }

    const matrix = new Matrix3x3();
    matrix.set(arr);

    return matrix;
  }

  static fromFloat32Array(arr: Float32Array): Matrix3x3 {
    if (arr.length !== 9) {
      throw new Error("Float32Array must have exactly 9 elements.");
    }
    return arr as Matrix3x3;
  }

  static fromMatrix4x4(m: Matrix4x4): Matrix3x3 {
    const matrix = new Matrix3x3();
    if (m.length !== 16) {
      throw new Error("Matrix4x4 must have exactly 16 elements.");
    }
    // Extract the 3x3 part from the 4x4 matrix
    matrix.set([
      m[0], m[1], m[2],
      m[4], m[5], m[6],
      m[8], m[9], m[10],
    ]);

    return matrix;
  }

  override set(arr: number[]): Matrix3x3 {
    if (arr.length !== 9) {
      throw new Error("Array must have exactly 9 elements.");
    }
    super.set(arr);
    return this;
  }

  multiply(b: Matrix3x3) {
    const a = this;

    const a00 = a[0 * 3 + 0];
    const a01 = a[0 * 3 + 1];
    const a02 = a[0 * 3 + 2];
    const a10 = a[1 * 3 + 0];
    const a11 = a[1 * 3 + 1];
    const a12 = a[1 * 3 + 2];
    const a20 = a[2 * 3 + 0];
    const a21 = a[2 * 3 + 1];
    const a22 = a[2 * 3 + 2];
    const b00 = b[0 * 3 + 0];
    const b01 = b[0 * 3 + 1];
    const b02 = b[0 * 3 + 2];
    const b10 = b[1 * 3 + 0];
    const b11 = b[1 * 3 + 1];
    const b12 = b[1 * 3 + 2];
    const b20 = b[2 * 3 + 0];
    const b21 = b[2 * 3 + 1];
    const b22 = b[2 * 3 + 2];

    this.set([
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ]);

    return this;
  };

  translate([tx, ty]: [number, number]): Matrix3x3 {
    this.multiply(new Matrix3x3().set([
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ]));

    return this;
  };

  rotate(angleInRadians: number): Matrix3x3 {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);

    this.multiply(new Matrix3x3().set([
      c, s, 0,
      -s, c, 0,
      0, 0, 1,
    ]));

    return this;
  };

  scale([sx, sy]: [number, number]): Matrix3x3 {
    this.multiply(new Matrix3x3().set([
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ]));

    return this;
  };

  toMat4(): Float32Array {
    const m = this;

    return new Float32Array([
      m[0], m[1], m[2], 0,
      m[3], m[4], m[5], 0,
      m[6], m[7], m[8], 0,
      0, 0, 0, 1,
    ]);
  }
}

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent {
  ngOnInit() {
    console.log("GameComponent initialized");

    this.initWebGPU()
      .then(() => requestAnimationFrame(this.render.bind(this)))
      .catch((error) => {
        console.error("Error initializing WebGPU:", error);
      });
  }

  shaders = `
    struct VertexOut {
      @builtin(position) position : vec4f,
      @location(0) uv : vec2f,
    }

    struct Uniforms {
      model: mat4x4f,
      view: mat4x4f,
      projection: mat4x4f,
      color: vec4f,
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    @group(0) @binding(1) var sampler2d: sampler;
    @group(0) @binding(2) var texture: texture_2d<f32>;

    @vertex
    fn vertex_main(@location(0) position: vec4f, @location(1) uv: vec2f) -> VertexOut
    {
      var output : VertexOut;

      output.position = uniforms.projection * uniforms.view * uniforms.model * vec4f(position.xy, 0.0, 1.0);
      output.uv = uv;
      return output;
    }

    @fragment
    fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
    {
      return textureSample(texture, sampler2d, fragData.uv) * uniforms.color;
    }
    `;

  tilemapShader = `
    struct VertexOut {
      @builtin(position) position : vec4f,
      @location(0) color : vec4f,
    }

    struct Tile {
      position: vec2f
    }

    struct Uniforms {
      model: mat4x4f,
      view: mat4x4f,
      projection: mat4x4f,
      color: vec4f,
    }

      @group(0) @binding(0) var<storage, read> tilemap: array<Tile>;
      @group(0) @binding(1) var<uniform> uniforms: Uniforms;

      @vertex
      fn vertex_main(
        @location(0) position: vec4f, 
        @location(1) uv: vec2f,
        @builtin(instance_index) instanceIndex: u32) -> VertexOut
      {
        let tile = tilemap[instanceIndex];

        var output: VertexOut;
        output.position = (uniforms.projection * uniforms.view * uniforms.model) * vec4f(position.xy + vec2f(tile.position.x, tile.position.y), 0.0, 1.0);
        output.color = uniforms.color;

        return output;
      }

      @fragment
      fn fragment_main(fragData : VertexOut) -> @location(0) vec4f
      {
        return fragData.color;
      }
    `;

  identityMatrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];

  //WebGPU stuff
  context: GPUCanvasContext | null = null;
  device?: GPUDevice = undefined;
  vertexBuffer?: GPUBuffer = undefined;
  renderPipeline?: GPURenderPipeline = undefined;

  renderPassDescriptor?: GPURenderPassDescriptor = undefined;
  uniformBuffer?: GPUBuffer = undefined;
  uniformValues?: Float32Array | GPUAllowSharedBufferSource = undefined;
  bindGroup?: GPUBindGroup = undefined;

  //tilemap
  tileMapBuffer?: GPUBuffer = undefined;
  tileMapPipeline?: GPURenderPipeline = undefined;
  tileMapBindGroup?: GPUBindGroup = undefined;
  tileMapValues?: Float32Array | GPUAllowSharedBufferSource  = undefined;

  // Uniform values
  modelValue: Float32Array = new Float32Array(16); // 4x4 matrix
  viewValue: Float32Array = new Float32Array(16); // 4x4 matrix
  projectionValue: Float32Array = new Float32Array(16); // 4x4 matrix
  colorValue: Float32Array = new Float32Array(4); // RGBA color

  //engine stuff
  deltaTime = 0;
  elapsedTime = 0;
  lastTimestamp: DOMHighResTimeStamp | null = null;

  //camera?
  baseScale = 2.0 / kTileSize;

  async initWebGPU() {
    if (!navigator.gpu) {
      throw Error("WebGPU not supported.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw Error("Couldn't request WebGPU adapter.");
    }

    const device = await adapter.requestDevice();
    this.device = device;

    const shaderModule = device.createShaderModule({
      code: this.shaders,
    });

    const tileMapShader = device.createShaderModule({
      code: this.tilemapShader,
    });

    const canvas = document.querySelector("#gameCanvas") as HTMLCanvasElement;
    this.context = canvas.getContext("webgpu");

    if (!this.context) {
      throw Error("Couldn't get WebGPU context from canvas.");
    }

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

    this.renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    this.tileMapPipeline = device.createRenderPipeline(tileMapPipelineDescriptor);

    //4 matrices of 4x4 floats (16 floats each, 4 bytes each) and a color vector of 4 floats
    const uniformBufferSize = 4 * 4 * 4 * Float32Array.BYTES_PER_ELEMENT + 4 * Float32Array.BYTES_PER_ELEMENT + 4;
    const uniformBuffer = device.createBuffer({
      label: 'uniforms',
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const uniformValues = new Float32Array(uniformBufferSize / 4);

    // offsets to the various uniform values in float32 indices
    const kModelMatrixOffset = 0;
    const kViewMatrixOffset = 16; // 4x4 matrix = 16 floats
    const kProjectionMatrixOffset = 32; // 4x4 matrix = 16 floats
    const kColorOffset = 48; // 4 floats for color

    this.colorValue = uniformValues.subarray(kColorOffset, kColorOffset + 4);
    this.modelValue = uniformValues.subarray(kModelMatrixOffset, kModelMatrixOffset + 16);
    this.viewValue = uniformValues.subarray(kViewMatrixOffset, kViewMatrixOffset + 16);
    this.projectionValue = uniformValues.subarray(kProjectionMatrixOffset, kProjectionMatrixOffset + 16);

    this.modelValue.set(this.identityMatrix);
    this.viewValue.set(this.identityMatrix);
    this.projectionValue.set(this.identityMatrix);

    // colorValue.set([Math.random(), Math.random(), Math.random(), 1]);
    this.colorValue.set([1.0, 1.0, 1.0, 1.0]); // white color

    const texture = await this.loadDoroTexture();

    const sampler = this.device.createSampler({
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
        { binding: 2, resource: texture.createView() },
      ],
    });

    //tilemap setup
    const tileMapBufferLength = kTilemapWidth * kTilemapHeight * 4;
    const tileMapBufferSize = tileMapBufferLength * Float32Array.BYTES_PER_ELEMENT;
    this.tileMapBuffer = device.createBuffer({
      label: 'tilemap buffer',
      size: tileMapBufferSize, // position (2 floats)
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const kPositionOffset = 2 * Float32Array.BYTES_PER_ELEMENT; // 2 floats (x, y) per tile
    const tileMapData = new Float32Array(tileMapBufferLength); // 2 floats per tile (x, y)
    for (let i = 0; i < kTilemapWidth * kTilemapHeight; i++) {
      // Set position based on tile index
      const x = (i % kTilemapWidth);
      const y = Math.floor(i / kTilemapWidth);

      tileMapData[i * kPositionOffset] = x; // x position
      tileMapData[i * kPositionOffset + 1] = y; // y position
    }

    this.tileMapValues = tileMapData;
    device.queue.writeBuffer(this.tileMapBuffer, 0, tileMapData, 0, tileMapData.length);

    const tilemapBindGroupLayout = this.tileMapPipeline.getBindGroupLayout(0);
    const tileMapBindGroup = device.createBindGroup({
      label: 'bind group for tilemap',
      layout: tilemapBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.tileMapBuffer } },
        { binding: 1, resource: { buffer: uniformBuffer } },
      ],
    });

    this.tileMapBindGroup = tileMapBindGroup;

    this.uniformBuffer = uniformBuffer;
    this.uniformValues = uniformValues;
    this.bindGroup = bindGroup;

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
      }

    });
    observer.observe(canvas);
  }

  render(timestamp?: DOMHighResTimeStamp) {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp || performance.now();
    }

    this.deltaTime = (timestamp || performance.now()) - this.lastTimestamp;
    this.elapsedTime += this.deltaTime;
    this.lastTimestamp = timestamp || performance.now();

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

    const aspectRatio = this.context.canvas.width / this.context.canvas.height;

    // set the view matrix to identity
    this.viewValue.set(Matrix4x4.identity());

    //@ts-ignore
    renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
    const encoder = device.createCommandEncoder({
      label: 'render quad encoder',
    });

    const pass = encoder.beginRenderPass(renderPassDescriptor);
    if (this.tileMapPipeline && this.tileMapBindGroup && this.tileMapBuffer && this.tileMapValues) {
      // upload the uniform values to the uniform buffer
      device.queue.writeBuffer(this.tileMapBuffer, 0, this.tileMapValues);
      device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

      pass.setPipeline(this.tileMapPipeline);
      pass.setBindGroup(0, this.tileMapBindGroup);
      pass.setVertexBuffer(0, this.vertexBuffer);
      pass.setBindGroup(0, this.tileMapBindGroup);

      pass.draw(6, kTilemapWidth * kTilemapHeight, 0, 0); // draw all tiles
    }

    //transform the model matrix
    const scale = this.baseScale; // scale to fit the tile size
    const modelMatrix = new Matrix3x3()
      .translate([0, 0])
      .scale([scale, scale * aspectRatio])

    this.modelValue.set(modelMatrix.toMat4());

    // upload the uniform values to the uniform buffer
    device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

    pass.setPipeline(this.renderPipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setBindGroup(0, this.bindGroup);

    pass.draw(6);
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
    requestAnimationFrame(this.render.bind(this));
  }

  async loadDoroTexture(): Promise<GPUTexture> {
    const url = '/resources/images/doro.png';
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
}