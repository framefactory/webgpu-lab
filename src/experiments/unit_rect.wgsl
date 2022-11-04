////////////////////////////////////////////////////////////////////////////////
// UNIFORMS

struct Parameters {
    size: vec2<f32>,
    pointer: vec2<f32>,
    time: f32,
}

@group(0) @binding(0) var<uniform> params: Parameters;
@group(0) @binding(1) var imageSampler: sampler;
@group(0) @binding(2) var imageTexture: texture_2d<f32>;

////////////////////////////////////////////////////////////////////////////////
// VERTEX SHADER

const positions = array<vec2<f32>, 4>(
    vec2(-1.0, -1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0,  1.0),
    vec2( 1.0,  1.0),
);

const uvs = array<vec2<f32>, 4>(
    vec2(0.0, 1.0),
    vec2(1.0, 1.0),
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
);

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>,
}

@vertex
fn vs_main(
    @builtin(vertex_index) index: u32
) -> VertexOutput
{
    var pos = positions[index] * 1024 / params.size;

    var output: VertexOutput;
    output.position = vec4<f32>(pos, 0.0, 1.0);
    output.texCoord = uvs[index];
    return output;
}

////////////////////////////////////////////////////////////////////////////////
// FRAGMENT SHADER

@fragment
fn fs_main(
    input: VertexOutput
) -> @location(0) vec4<f32>
{
    let texel = textureSample(imageTexture, imageSampler, input.texCoord);
    let position = input.position;
    let u = position.x / params.size.x;
    let v = position.y / params.size.y;
    let w = fract(params.time); 
    return vec4<f32>(texel.rgb, 1.0);
}