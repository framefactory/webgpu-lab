struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec3<f32>
}

@vertex
fn vsMain(
    //@builtin(vertex_index) vertexIndex: u32
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) color: vec3<f32>
) -> VertexOutput
{
    // var pos = array<vec2<f32>, 3>(
    //     vec2<f32>(0.0, 0.5),
    //     vec2<f32>(-0.5, -0.5),
    //     vec2<f32>(0.5, -0.5)
    // );

    var output: VertexOutput;
    output.position = vec4<f32>(position, 1.0);
    output.color = color;
    return output;
}

@fragment
fn fsMain(
    @location(0) color: vec3<f32>
) -> @location(0) vec4<f32>
{
    return vec4<f32>(color, 1.0);
}