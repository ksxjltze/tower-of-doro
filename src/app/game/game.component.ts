// // @ts-nocheck
import { Component } from '@angular/core';

async function loadImageBitmap(url: URL | string): Promise<ImageBitmap> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
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

    this.initWebGPU().then(() => this.render()).catch((error) => {
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
    fn vertex_main(@location(0) position: vec4f) -> VertexOut
    {
      var output : VertexOut;

      output.position = uniforms.projection * uniforms.view * uniforms.model * vec4f(position.xy, 0.0, 1.0);
      output.uv = position.xy * 0.5 + 0.5; // Convert from [-1, 1] to [0, 1]
      return output;
    }

    @fragment
    fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
    {
      return textureSample(texture, sampler2d, fragData.uv) * uniforms.color;
    }
    `;

  identityMatrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];

  context: GPUCanvasContext | null = null;
  device?: GPUDevice = undefined;
  vertexBuffer?: GPUBuffer = undefined;
  renderPipeline?: GPURenderPipeline = undefined;
  commandEncoder?: GPUCommandEncoder = undefined;
  renderPassDescriptor?: GPURenderPassDescriptor = undefined;
  uniformBuffer?: GPUBuffer = undefined;
  uniformValues?: Float32Array | GPUAllowSharedBufferSource = undefined;
  bindGroup?: GPUBindGroup = undefined;

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
      -0.5, -0.5, // Bottom left
      -0.5, 0.5, // Top Left
      0.0, -0.5,

      0.0, -0.5, // Bottom right
      -0.5, 0.5, // Top right
      0.0, 0.5, // Top center
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
        ],
        arrayStride: 8,
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

    this.renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    this.commandEncoder = device.createCommandEncoder();

    //4 matrices of 4x4 floats (16 floats each, 4 bytes each) and a color vector of 4 floats
    const uniformBufferSize = 4 * 4 * 4 * Float32Array.BYTES_PER_ELEMENT + 4 * Float32Array.BYTES_PER_ELEMENT;
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

    const colorValue = uniformValues.subarray(kColorOffset, kColorOffset + 4);
    const modelValue = uniformValues.subarray(kModelMatrixOffset, kModelMatrixOffset + 16);
    const viewValue = uniformValues.subarray(kViewMatrixOffset, kViewMatrixOffset + 16);
    const projectionValue = uniformValues.subarray(kProjectionMatrixOffset, kProjectionMatrixOffset + 16);

    //TODO: MVP
    modelValue.set(this.identityMatrix);
    viewValue.set(this.identityMatrix);
    projectionValue.set(this.identityMatrix);

    colorValue.set([Math.random(), Math.random(), Math.random(), 1]);

    const texture = await this.loadDoroTexture();

    const sampler = this.device.createSampler({
      label: 'sampler for object',
      addressModeU: 'repeat', 
      addressModeV: 'repeat',
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

    this.uniformBuffer = uniformBuffer;
    this.uniformValues = uniformValues;
    this.bindGroup = bindGroup;

    const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };
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
  }

  render() {
    if (!this.context || !this.device || !this.renderPipeline || !this.vertexBuffer
      || !this.commandEncoder || !this.renderPassDescriptor || !this.uniformBuffer
      || !this.bindGroup || !this.uniformValues) {
      console.error("WebGPU not fully initialized.");
      return;
    }

    const passEncoder = this.commandEncoder.beginRenderPass(this.renderPassDescriptor);
    const device = this.device;

    passEncoder.setPipeline(this.renderPipeline);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);

    // upload the uniform values to the uniform buffer
    device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

    passEncoder.setBindGroup(0, this.bindGroup);

    passEncoder.draw(6);
    passEncoder.end();

    device.queue.submit([this.commandEncoder.finish()]);
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