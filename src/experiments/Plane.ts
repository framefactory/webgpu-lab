/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { Plane as PlaneGeometry } from "@ffweb/geo/Plane.js";
import { GPUGeometry } from "@ffweb/gpu/GPUGeometry.js";

import { Experiment, GPUSurface, type IPulseState } from "../core/Experiment.js";
import shaderSource from "./plane.wgsl";

export class Plane extends Experiment
{
    protected planeGeometry: GPUGeometry;
    protected pipeline: GPURenderPipeline;
    protected depthTexture: GPUTexture;

    async initialize(surface: GPUSurface)
    {
        const device = this.device;

        this.depthTexture = device.createTexture({
            size: surface.size,
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });

        const geo = new PlaneGeometry({ tesselation: [10, 10] });
        this.planeGeometry = new GPUGeometry(device, geo);
        this.planeGeometry.update();

        const vertexShader = device.createShaderModule({
            code: shaderSource,
        });
        const fragmentShader = device.createShaderModule({
            code: shaderSource,
        });

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: []
        });

        const vertexBufferLayout = this.planeGeometry.createVertexBufferLayout();
    
        this.pipeline = device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: vertexShader,
                entryPoint: "vsMain",
                buffers: [ vertexBufferLayout ],
            },
            fragment: {
                module: fragmentShader,
                entryPoint: "fsMain",
                targets: [{
                    format: surface.format
                }]
            },
            primitive: {
                topology: this.planeGeometry.topology,
                cullMode: "none",
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus",
            },
        });
    }

    render(surface: GPUSurface, state: IPulseState)
    {
        this.planeGeometry.update();
        const encoder = this.device.createCommandEncoder();

        const texture = surface.context.getCurrentTexture();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: texture.createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            }
        });

        pass.setPipeline(this.pipeline);
        //pass.setBindGroup(0, bindGroup);
        this.planeGeometry.setBuffers(pass);
        this.planeGeometry.draw(pass);
        pass.end();

        this.device.queue.submit([ encoder.finish() ]);
    }

    resize(surface: GPUSurface)
    {
        if (this.depthTexture) {
            this.depthTexture.destroy();
        }    

        this.depthTexture = this.device.createTexture({
            size: surface.size,
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
    }
}