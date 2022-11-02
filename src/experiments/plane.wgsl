struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec3<f32>
}

@vertex
fn vsMain(
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) texCoord: vec2<f32>
) -> VertexOutput
{
    var output: VertexOutput;
    output.position = vec4<f32>(position, 1.0);
    output.color = vec3<f32>(texCoord, 0.0);
    return output;
}

@fragment
fn fsMain(
    @location(0) color: vec3<f32>
) -> @location(0) vec4<f32>
{
    return vec4<f32>(color, 1.0);
}