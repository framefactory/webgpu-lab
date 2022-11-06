/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { mat4 } from "gl-matrix";

import { math } from "@ffweb/core/math.js";
import { Plane as PlaneGeometry } from "@ffweb/geo/Plane.js";
import { Box as BoxGeometry } from "@ffweb/geo/Box.js";
import { Torus as TorusGeometry } from "@ffweb/geo/Torus.js";
import { GeometryBuffer } from "@ffweb/gpu/GeometryBuffer.js";
import { GPUTransform } from "@ffweb/gpu/GPUTransform.js"

import { Experiment, GPUSurface, type IPulseState } from "../core/Experiment.js";

import shaderSource from "../shader/plane.wgsl";


const _idMatrix = mat4.create();

export class Plane extends Experiment
{
    protected planeGeometry: GeometryBuffer;
    protected pipeline: GPURenderPipeline;
    protected renderPassDesc: GPURenderPassDescriptor;
    protected depthTexture: GPUTexture;
    protected transform: GPUTransform;

    async initialize(surface: GPUSurface)
    {
        const device = this.device;

        this.depthTexture = device.createTexture({
            size: surface.size,
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });

        //const geo = new PlaneGeometry({ size: [5, 5], tesselation: [1, 1] });
        //const geo = new BoxGeometry({ size: [5, 5, 5], tesselation: [1, 1, 1] });
        const geo = new TorusGeometry({ radius: [ 2.5, 1.5 ] });
        this.planeGeometry = new GeometryBuffer(device, geo);
        this.planeGeometry.update();

        const shader = device.createShaderModule({
            code: shaderSource,
        });

        const tf = this.transform = new GPUTransform(this.device);
        mat4.translate(tf.viewMatrix, tf.viewMatrix, [ 0, 0, -10 ]);

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [
                this.transform.bindGroupLayout,
            ],
        });
    
        this.pipeline = device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: shader,
                entryPoint: "vsMain",
                buffers: [ 
                    this.planeGeometry.createVertexBufferLayout(),
                 ],
            },
            fragment: {
                module: shader,
                entryPoint: "fsMain",
                targets: [{
                    format: surface.format
                }]
            },
            primitive: {
                topology: this.planeGeometry.topology,
                cullMode: "back",
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus",
            },
        });

        this.renderPassDesc = {
            colorAttachments: [{
                view: null,
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: {
                view: null,
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            }
        };
    }

    render(surface: GPUSurface, state: IPulseState)
    {
        //this.planeGeometry.update();

        mat4.rotateY(this.transform.modelMatrix, _idMatrix, math.deg2rad(state.seconds * 3));
        mat4.rotateX(this.transform.modelMatrix, this.transform.modelMatrix, math.deg2rad(state.seconds * 30));
        this.transform.update();

        const encoder = this.device.createCommandEncoder();

        const texture = surface.context.getCurrentTexture();
        this.renderPassDesc.colorAttachments[0].view = texture.createView();
        this.renderPassDesc.depthStencilAttachment.view = this.depthTexture.createView();

        const pass = encoder.beginRenderPass(this.renderPassDesc);
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.transform.bindGroup);
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

        const aspect = surface.size.width / surface.size.height;
        mat4.perspective(this.transform.projectionMatrix,
            math.deg2rad(50), aspect, 0.1, 1000);

    }
}