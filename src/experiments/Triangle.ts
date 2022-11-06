/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { Experiment, GPUSurface, type IPulseState } from "../core/Experiment.js";

import shaderSource from "../shader/triangle.wgsl";


export class Triangle extends Experiment
{
    protected static vertices = new Float32Array([
         0.0,  0.5, 0.0,  0.0, 0.0, 1.0,  1.0, 0.0, 0.0,
        -0.5, -0.5, 0.0,  0.0, 0.0, 1.0,  0.0, 1.0, 0.0,
         0.5, -0.5, 0.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
    ]);

    protected static indices = new Uint32Array([
        0, 1, 2
    ]);

    protected pipeline: GPURenderPipeline;
    protected vertexBuffer: GPUBuffer;
    protected indexBuffer: GPUBuffer;
    protected bindGroupLayout: GPUBindGroupLayout;

    async initialize(surface: GPUSurface)
    {
        this.vertexBuffer = this.device.createBuffer({
            size: Triangle.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });

        const vb = new Float32Array(this.vertexBuffer.getMappedRange());
        vb.set(Triangle.vertices);
        this.vertexBuffer.unmap();

        this.indexBuffer = this.device.createBuffer({
            size: Triangle.indices.byteLength,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true
        });

        const ib = new Uint32Array(this.indexBuffer.getMappedRange());
        ib.set(Triangle.indices);
        this.indexBuffer.unmap();
        
        const vertexShader = this.device.createShaderModule({
            code: shaderSource,
        });
        const fragmentShader = this.device.createShaderModule({
            code: shaderSource,
        });

        // this.bindGroupLayout = this.device.createBindGroupLayout({
        //     entries: [{
        //         binding: 0,
        //         visibility: GPUShaderStage.VERTEX,
        //         buffer: {},
        //     }, {
        //         binding: 1,
        //         visibility: GPUShaderStage.VERTEX,
        //         buffer: {},
        //     }],
        // });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: []
        });
    
        this.pipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: vertexShader,
                entryPoint: "vsMain",
                buffers: [{
                    arrayStride: 9 * 4,
                    attributes: [{
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x3",
                    }, {
                        shaderLocation: 1,
                        offset: 3 * 4,
                        format: "float32x3",
                    }, {
                        shaderLocation: 2,
                        offset: 6 * 4,
                        format: "float32x3"
                    }],
                }],
            },
            fragment: {
                module: fragmentShader,
                entryPoint: "fsMain",
                targets: [{
                    format: surface.format
                }]
            },
            primitive: {
                topology: "triangle-list"
            },
        });
    }

    render(surface: GPUSurface, state: IPulseState)
    {
        const encoder = this.device.createCommandEncoder();

        const texture = surface.context.getCurrentTexture();
        const view = texture.createView();

        // const bindGroup = this.device.createBindGroup({
        //     layout: this.bindGroupLayout,
        //     entries: [{
        //         binding: 0,
        //         resource: { buffer: this.vertexBuffer }
        //     }, {
        //         binding: 1,
        //         resource: { buffer: this.indexBuffer }
        //     }]
        // });

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view,
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store"
            }],
        });
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setIndexBuffer(this.indexBuffer, "uint32");
        //pass.setBindGroup(0, bindGroup);
        pass.setPipeline(this.pipeline);
        pass.draw(3, 1, 0, 0);
        pass.end();

        this.device.queue.submit([ encoder.finish() ]);
    }

    resize(surface: GPUSurface)
    {
    }
}