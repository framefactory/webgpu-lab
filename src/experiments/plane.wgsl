struct Transforms {
    mvpMatrix: mat4x4<f32>,
    mvMatrix: mat4x4<f32>,
    normalMatrix: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> transforms: Transforms;
@group(1) @binding(0) var imageSampler: sampler;
@group(1) @binding(1) var imageTexture: texture_2d<f32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>
}

@vertex
fn vsMain(
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) texCoord: vec2<f32>
) -> VertexOutput
{
    var output: VertexOutput;
    output.position = transforms.mvpMatrix * vec4<f32>(position, 1.0);
    output.texCoord = texCoord;
    return output;
}

@fragment
fn fsMain(
    @location(0) texCoord: vec2<f32>
) -> @location(0) vec4<f32>
{
    return textureSample(imageTexture, imageSampler, texCoord);
    //return vec4<f32>(texCoord, 0.0, 1.0);
}