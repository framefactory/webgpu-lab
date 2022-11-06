@group(0) @binding(0) var inTex: texture_2d<f32>;
@group(0) @binding(1) var outTex: texture_storage_2d<rgba8unorm,write>;

const wg_x = 2;
const wg_y = 2;

var<workgroup> p: array<vec4<f32>, 4>;

@compute @workgroup_size(wg_x, wg_y)
fn main(
    @builtin(local_invocation_id) local_id: vec3<u32>,
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(num_workgroups) size: vec3<u32>,
)
{
    let coords = global_id.xy;
    let index = wg_x * local_id.y + local_id.x;
    p[index] = textureLoad(inTex, coords, 0);

    if (index == 0) {
        let base = coords / 2;
        let pixel = (p[0] + p[1] + p[2] + p[3]) * 0.25;
        //let pixel = p[3];
        textureStore(outTex, base + size.xy / 2, pixel);
    }
}