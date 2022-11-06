/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { TextureLoader } from "@ffweb/gpu/TextureLoader.js";

import { Experiment, GPUSurface, type IPulseState } from "../core/Experiment.js";

import computeCode from "../shader/compute_test.wgsl";
import renderCode from "../shader/unit_rect.wgsl";

export class Compute extends Experiment
{
    protected computePipe: GPUComputePipeline;
    protected computeBindGroup: GPUBindGroup;
    protected renderPipe: GPURenderPipeline;
    protected renderPassDesc: GPURenderPassDescriptor;
    protected renderBindGroup: GPUBindGroup;
    protected textures: GPUTexture[] = [];
    protected imageTexture: GPUTexture;
    protected paramsBuffer: GPUBuffer;
    protected params: Float32Array;

    async initialize(surface: GPUSurface)
    {
        const device = this.device;

        const usage
            = GPUTextureUsage.COPY_DST
            | GPUTextureUsage.TEXTURE_BINDING
            | GPUTextureUsage.STORAGE_BINDING;
        
            for (let i = 0; i < 2; ++i) {
            this.textures.push(device.createTexture({
                size: [ 1024, 1024, 1 ],
                format: "rgba8unorm",
                usage
            }));
        }

        const loader = new TextureLoader(device);
        this.imageTexture = await loader.fetchTextureFromImageUrl("test-tiles-1024a.png");

        const computeModule = device.createShaderModule({
            code: computeCode,
        });

        const computeBindGroupLayout = device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
                texture: {}
            }, {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
                storageTexture: { format: "rgba8unorm" }
            }],
        });

        this.computeBindGroup = device.createBindGroup({
            layout: computeBindGroupLayout,
            entries: [{
                binding: 0,
                resource: this.imageTexture.createView()
            }, {
                binding: 1,
                resource: this.textures[0].createView()
            }],
        });

        const layout = device.createPipelineLayout({
            bindGroupLayouts: [
                computeBindGroupLayout
            ],
        });

        this.computePipe = device.createComputePipeline({
            layout,
            compute: {
                module: computeModule,
                entryPoint: "main", 
                constants: {

                }
            },
        });

        this.params = new Float32Array([
            1.0, 1.0, // size
            0.0, 0.0, // pointer
            0.0       // time
        ]);

        this.paramsBuffer = device.createBuffer({
            size: 20,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        ////////////////////////////////////////////////////////////////////////////

        const renderModule = device.createShaderModule({
            code: renderCode,
        });

        const renderBindGroupLayout = device.createBindGroupLayout({
            entries: [{
                binding: 0,
                buffer: { type: "uniform" },
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            }, {
                binding: 1,
                sampler: { type: "filtering" },
                visibility: GPUShaderStage.FRAGMENT,
            }, {
                binding: 2,
                texture: {},
                visibility: GPUShaderStage.FRAGMENT,
            }],
        });

        const renderPipeLayout = device.createPipelineLayout({
            bindGroupLayouts: [ renderBindGroupLayout ]
        });

        this.renderPipe = device.createRenderPipeline({
            layout: renderPipeLayout,
            vertex: {
                module: renderModule,
                entryPoint: "vs_main",
            },
            fragment: {
                module: renderModule,
                entryPoint: "fs_main",
                targets: [{
                    format: surface.format
                }],
            },
            primitive: { topology: "triangle-strip" }
        });

        this.renderPassDesc = {
            colorAttachments: [{
                view: null,
                clearValue: [ 0, 0, 1, 1 ],
                loadOp: "clear",
                storeOp: "store"
            }],
        };

        const imageSampler = device.createSampler({
            minFilter: "nearest",
            magFilter: "nearest",
        });

        this.renderBindGroup = device.createBindGroup({
            layout: renderBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.paramsBuffer },
            }, {
                binding: 1,
                resource: imageSampler,
            }, {
                binding: 2,
                resource: this.textures[0].createView(),
            }]
        });
    }

    render(surface: GPUSurface, state: IPulseState)
    {
        const device = this.device;
        const encoder = device.createCommandEncoder();

        // COMPUTE

        const computePass = encoder.beginComputePass();
        computePass.setBindGroup(0, this.computeBindGroup);
        computePass.setPipeline(this.computePipe);
        computePass.dispatchWorkgroups(512, 512);
        computePass.end();

        // RENDER

        this.params[0] = surface.size.width;
        this.params[1] = surface.size.height;
        this.params[4] = state.seconds;
        device.queue.writeBuffer(this.paramsBuffer, 0, this.params, 0);

        const targetView = surface.getCurrentTextureView();
        this.renderPassDesc.colorAttachments[0].view = targetView;

        const pass = encoder.beginRenderPass(this.renderPassDesc);
        pass.setPipeline(this.renderPipe);
        pass.setBindGroup(0, this.renderBindGroup);
        pass.draw(6, 1, 0, 0);
        pass.end();

        device.queue.submit([ encoder.finish() ]);
    }

    resize(surface: GPUSurface)
    {
        
    }
}