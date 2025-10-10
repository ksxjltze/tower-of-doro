  const StandardSprite = `
    struct VertexOut {
      @builtin(position) position : vec4f,
      @location(0) uv : vec2f,
    }

    struct Uniforms {
      color: vec4f,
      matrix: mat4x4f,
      sprite_uv_size_x: f32,
      sprite_uv_offset_x: f32
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    @group(0) @binding(1) var sampler2d: sampler;
    @group(0) @binding(2) var texture: texture_2d<f32>;

    @vertex
    fn vertex_main(@location(0) position: vec4f, @location(1) uv: vec2f) -> VertexOut
    {
      var output : VertexOut;

      output.position = uniforms.matrix * position;
      output.uv = uv;

      return output;
    }

    @fragment
    fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
    {
      var uv = fragData.uv;
      uv.x *= uniforms.sprite_uv_size_x;
      uv.x = uv.x + uniforms.sprite_uv_offset_x;

      return textureSample(texture, sampler2d, uv) * uniforms.color;
    }
    `;

    export { StandardSprite as shaders };