  const shaders = `
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

  const tilemapShader = `
    struct VertexOut {
      @builtin(position) position : vec4f,
      @location(0) color : vec4f,
      @location(1) uv : vec2f,
    }

    struct Tile {
      position: vec2f,
      texture_offset: vec2f
    }

    struct Uniforms {
      color: vec4f,
      matrix: mat4x4f,
    }

    @group(0) @binding(0) var<storage, read> tilemap: array<Tile>;
    @group(0) @binding(1) var<uniform> uniforms: Uniforms;
    @group(0) @binding(2) var sampler2d: sampler;
    @group(0) @binding(3) var texture: texture_2d<f32>;

    @vertex
    fn vertex_main(
      @location(0) position: vec4f, 
      @location(1) uv: vec2f,
      @builtin(instance_index) instanceIndex: u32) -> VertexOut
    {
      let tile = tilemap[instanceIndex];
      var output: VertexOut;

      output.position = uniforms.matrix * (position + vec4f(tile.position.x, tile.position.y, 0, 0));
      output.uv = (uv * 0.5) + tile.texture_offset;
      output.color = uniforms.color;

      return output;
    }

    @fragment
    fn fragment_main(fragData : VertexOut) -> @location(0) vec4f
    {
      return textureSample(texture, sampler2d, fragData.uv) * fragData.color;
    }
    `;

  const pickingShader = `
    struct VertexOut {
      @builtin(position) position : vec4f,
      color: vec4f
    }

    struct Uniforms {
      matrix: mat3x3f,
      color: vec4f
    }

    struct ObjectID {
      id: u32
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    @vertex
    fn vertex_main(@location(0) position: vec4f, @location(1) uv: vec2f) -> VertexOut
    {
      var output : VertexOut;
      let clipSpace = (uniforms.matrix * vec3f(position.xy, 1.0)).xy;

      output.position = vec4f(clipSpace, 0.0, 1.0);
      output.color = uniforms.color;

      return output;
    }

    @fragment
    fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
    {
        return fragData.color;
    }
    `;

    export { shaders, tilemapShader, pickingShader };