/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { Experiment, Surface, type IPulseState } from "../core/Experiment.js";

export class Triangle extends Experiment
{
    protected static vertexShaderCode = /* wgsl */`
        @vertex

        fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32>
        {
            var pos = array<vec2<f32>, 3>(
                vec2<f32>(0.0, 0.5),
                vec2<f32>(-0.5, -0.5),
                vec2<f32>(0.5, -0.5)
            );
            return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
        }
    `;

    protected static fragmentShaderCode = /* wgsl */`
        @fragment

        fn main() -> @location(0) vec4<f32>
        {
            return vec4<f32>(1.0, 0.50, 0.0, 1.0);
        }
    `;

    protected pipeline: GPURenderPipeline;

    initialize(surface: Surface)
    {
        const vertexShader = this.device.createShaderModule({
            code: Triangle.vertexShaderCode,
        });
        const fragmentShader = this.device.createShaderModule({
            code: Triangle.fragmentShaderCode,
        });
    
        this.pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: vertexShader,
                entryPoint: "main"
            },
            fragment: {
                module: fragmentShader,
                entryPoint: "main",
                targets: [{
                    format: surface.presentationFormat
                }]
            },
            primitive: {
                topology: "triangle-list"
            },
        });
    }

    render(surface: Surface, state: IPulseState)
    {
        const encoder = this.device.createCommandEncoder();

        const texture = surface.context.getCurrentTexture();
        const view = texture.createView();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view,
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store"
            }],
        });
        pass.setPipeline(this.pipeline);
        pass.draw(3, 1, 0, 0);
        pass.end();

        this.device.queue.submit([ encoder.finish() ]);
    }

    resize(width: number, height: number)
    {
    }
}