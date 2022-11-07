//
// GLSL textureless classic 3D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-10-11
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/stegu/webgl-noise


////////////////////////////////////////////////////////////////////////////////

type vec2f = vec2<f32>;
type vec3f = vec3<f32>;
type vec4f = vec4<f32>;

////////////////////////////////////////////////////////////////////////////////

fn mod289_3f(x: vec3f) -> vec3f
{
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

fn mod289_4f(x: vec4f) -> vec4f
{
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

fn permute(x: vec4f) -> vec4f
{
    return mod289_4f(((x*34.0)+10.0)*x);
}

fn taylorInvSqrt(r: vec4f) -> vec4f
{
    return 1.79284291400159 - 0.85373472095314 * r;
}

fn fade(t: vec3f) -> vec3f {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
fn cnoise(P: vec3f) -> f32
{
    var Pi0: vec3f = floor(P); // Integer part for indexing
    var Pi1: vec3f = Pi0 + vec3f(1.0); // Integer part + 1
    Pi0 = mod289_3f(Pi0);
    Pi1 = mod289_3f(Pi1);
    var Pf0: vec3f = fract(P); // Fractional part for interpolation
    var Pf1: vec3f = Pf0 - vec3f(1.0); // Fractional part - 1.0
    var ix: vec4f = vec4f(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    var iy: vec4f = vec4f(Pi0.yy, Pi1.yy);
    var iz0: vec4f = Pi0.zzzz;
    var iz1: vec4f = Pi1.zzzz;

    var ixy: vec4f = permute(permute(ix) + iy);
    var ixy0: vec4f = permute(ixy + iz0);
    var ixy1: vec4f = permute(ixy + iz1);

    var gx0: vec4f = ixy0 * (1.0 / 7.0);
    var gy0: vec4f = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    var gz0: vec4f = vec4f(0.5) - abs(gx0) - abs(gy0);
    var sz0: vec4f = step(gz0, vec4f(0.0));
    gx0 -= sz0 * (step(vec4f(0.0), gx0) - 0.5);
    gy0 -= sz0 * (step(vec4f(0.0), gy0) - 0.5);

    var gx1: vec4f = ixy1 * (1.0 / 7.0);
    var gy1: vec4f = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    var gz1: vec4f = vec4f(0.5) - abs(gx1) - abs(gy1);
    var sz1: vec4f = step(gz1, vec4f(0.0));
    gx1 -= sz1 * (step(vec4f(0.0), gx1) - 0.5);
    gy1 -= sz1 * (step(vec4f(0.0), gy1) - 0.5);

    var g000: vec3f = vec3f(gx0.x,gy0.x,gz0.x);
    var g100: vec3f = vec3f(gx0.y,gy0.y,gz0.y);
    var g010: vec3f = vec3f(gx0.z,gy0.z,gz0.z);
    var g110: vec3f = vec3f(gx0.w,gy0.w,gz0.w);
    var g001: vec3f = vec3f(gx1.x,gy1.x,gz1.x);
    var g101: vec3f = vec3f(gx1.y,gy1.y,gz1.y);
    var g011: vec3f = vec3f(gx1.z,gy1.z,gz1.z);
    var g111: vec3f = vec3f(gx1.w,gy1.w,gz1.w);

    var norm0: vec4f = taylorInvSqrt(vec4f(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    var norm1: vec4f = taylorInvSqrt(vec4f(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    var n000: f32 = dot(g000, Pf0);
    var n100: f32 = dot(g100, vec3f(Pf1.x, Pf0.yz));
    var n010: f32 = dot(g010, vec3f(Pf0.x, Pf1.y, Pf0.z));
    var n110: f32 = dot(g110, vec3f(Pf1.xy, Pf0.z));
    var n001: f32 = dot(g001, vec3f(Pf0.xy, Pf1.z));
    var n101: f32 = dot(g101, vec3f(Pf1.x, Pf0.y, Pf1.z));
    var n011: f32 = dot(g011, vec3f(Pf0.x, Pf1.yz));
    var n111: f32 = dot(g111, Pf1);

    var fade_xyz: vec3f = fade(Pf0);
    var n_z: vec4f = mix(vec4f(n000, n100, n010, n110), vec4f(n001, n101, n011, n111), fade_xyz.z);
    var n_yz: vec2f = mix(n_z.xy, n_z.zw, fade_xyz.y);
    var n_xyz: f32 = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
}

// Classic Perlin noise, periodic variant
fn pnoise(P: vec3f, rep: vec3f) -> f32
{
    var Pi0: vec3f = floor(P) % rep; // Integer part, modulo period
    var Pi1: vec3f = (Pi0 + vec3f(1.0)) % rep; // Integer part + 1, mod period
    Pi0 = mod289_3f(Pi0);
    Pi1 = mod289_3f(Pi1);
    var Pf0: vec3f = fract(P); // Fractional part for interpolation
    var Pf1: vec3f = Pf0 - vec3f(1.0); // Fractional part - 1.0
    var ix: vec4f = vec4f(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    var iy: vec4f = vec4f(Pi0.yy, Pi1.yy);
    var iz0: vec4f = Pi0.zzzz;
    var iz1: vec4f = Pi1.zzzz;

    var ixy: vec4f = permute(permute(ix) + iy);
    var ixy0: vec4f = permute(ixy + iz0);
    var ixy1: vec4f = permute(ixy + iz1);

    var gx0: vec4f = ixy0 * (1.0 / 7.0);
    var gy0: vec4f = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    var gz0: vec4f = vec4f(0.5) - abs(gx0) - abs(gy0);
    var sz0: vec4f = step(gz0, vec4f(0.0));
    gx0 -= sz0 * (step(vec4f(0.0), gx0) - 0.5);
    gy0 -= sz0 * (step(vec4f(0.0), gy0) - 0.5);

    var gx1: vec4f = ixy1 * (1.0 / 7.0);
    var gy1: vec4f = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    var gz1: vec4f = vec4f(0.5) - abs(gx1) - abs(gy1);
    var sz1: vec4f = step(gz1, vec4f(0.0));
    gx1 -= sz1 * (step(vec4f(0.0), gx1) - 0.5);
    gy1 -= sz1 * (step(vec4f(0.0), gy1) - 0.5);

    var g000: vec3f = vec3f(gx0.x,gy0.x,gz0.x);
    var g100: vec3f = vec3f(gx0.y,gy0.y,gz0.y);
    var g010: vec3f = vec3f(gx0.z,gy0.z,gz0.z);
    var g110: vec3f = vec3f(gx0.w,gy0.w,gz0.w);
    var g001: vec3f = vec3f(gx1.x,gy1.x,gz1.x);
    var g101: vec3f = vec3f(gx1.y,gy1.y,gz1.y);
    var g011: vec3f = vec3f(gx1.z,gy1.z,gz1.z);
    var g111: vec3f = vec3f(gx1.w,gy1.w,gz1.w);

    var norm0: vec4f = taylorInvSqrt(vec4f(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    var norm1: vec4f = taylorInvSqrt(vec4f(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    var n000: f32 = dot(g000, Pf0);
    var n100: f32 = dot(g100, vec3f(Pf1.x, Pf0.yz));
    var n010: f32 = dot(g010, vec3f(Pf0.x, Pf1.y, Pf0.z));
    var n110: f32 = dot(g110, vec3f(Pf1.xy, Pf0.z));
    var n001: f32 = dot(g001, vec3f(Pf0.xy, Pf1.z));
    var n101: f32 = dot(g101, vec3f(Pf1.x, Pf0.y, Pf1.z));
    var n011: f32 = dot(g011, vec3f(Pf0.x, Pf1.yz));
    var n111: f32 = dot(g111, Pf1);

    var fade_xyz: vec3f = fade(Pf0);
    var n_z: vec4f = mix(vec4f(n000, n100, n010, n110), vec4f(n001, n101, n011, n111), fade_xyz.z);
    var n_yz: vec2f = mix(n_z.xy, n_z.zw, fade_xyz.y);
    var n_xyz: f32 = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
}

////////////////////////////////////////////////////////////////////////////////

struct Parameters {
    offset: vec3<f32>,
    scale: vec3<f32>,
}

@group(0) @binding(0) var<uniform> params: Parameters;
@group(0) @binding(1) var texture: texture_storage_2d<r32float, write>;

@compute @workgroup_size(1)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>
)
{
    let dims = vec3f(vec2f(textureDimensions(texture)), 1.0);
    let pos = vec3f(global_id) / dims * params.scale + params.offset;
    let value = cnoise(pos) * 0.5 + 0.5;
    textureStore(texture, global_id.xy, vec4f(value));
}