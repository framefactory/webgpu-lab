/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { mat4 } from "gl-matrix";

import { math } from "@ffweb/core/math.js";
import { OrbitManipulator, IPointerEvent, ITriggerEvent } from "@ffweb/browser/OrbitManipulator.js";
import { Plane as PlaneGeometry } from "@ffweb/geo/Plane.js";
import { Box as BoxGeometry } from "@ffweb/geo/Box.js";
import { Torus as TorusGeometry } from "@ffweb/geo/Torus.js";

import { GeometryBuffer } from "@ffweb/gpu/GeometryBuffer.js";
import { GPUTransform } from "@ffweb/gpu/GPUTransform.js";
import { TextureLoader } from "@ffweb/gpu/TextureLoader.js";
import { MipmapGenerator } from "@ffweb/gpu/MipmapGenerator.js";
import { GaussianBlur } from "@ffweb/gpu/GaussianBlur.js";

import { Experiment, GPUSurface, type IPulseState } from "../core/Experiment.js";

import shaderSource from "../shader/plane.wgsl";


const _idMatrix = mat4.create();

export class TextureMSAA extends Experiment
{
    protected manip: OrbitManipulator;

    protected planeGeometry: GeometryBuffer;
    protected pipeline: GPURenderPipeline;
    protected renderPassDesc: GPURenderPassDescriptor;
    protected colorTexture: GPUTexture;
    protected depthTexture: GPUTexture;
    protected transform: GPUTransform;

    protected imageTexture: GPUTexture;
    protected textureBindGroupLayout: GPUBindGroupLayout;
    protected textureBindGroup: GPUBindGroup;

    async initialize(surface: GPUSurface)
    {
        this.manip = new OrbitManipulator();
        this.manip.offset[2] = 10;

        const device = this.device;

        this.colorTexture = device.createTexture({
            size: surface.size,
            format: surface.format,
            sampleCount: 4,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.depthTexture = device.createTexture({
            size: surface.size,
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        //const geo = new PlaneGeometry({ size: [5, 5], tesselation: [50, 50] });
        //const geo = new BoxGeometry({ size: [5, 5, 5], tesselation: [10, 5, 3] });
        const geo = new TorusGeometry({ radius: [ 2.5, 1.5 ] });
        this.planeGeometry = new GeometryBuffer(device, geo);
        this.planeGeometry.update();

        const loader = new TextureLoader(device);
        const mipGen = new MipmapGenerator(device);
        const blurGen = new GaussianBlur(device);
        this.imageTexture = await loader.fetchTextureFromImageUrl("test-tiles-1024c.png");
        //mipGen.generateMipmap(this.imageTexture);
        this.imageTexture = blurGen.apply(this.imageTexture, null, 30, 30);


        const imageSampler = device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
            maxAnisotropy: 16,
        });

        this.textureBindGroupLayout = device.createBindGroupLayout({
            entries: [{
                binding: 0,
                sampler: { type: "filtering" },
                visibility: GPUShaderStage.FRAGMENT,
            }, {
                binding: 1,
                texture: {},
                visibility: GPUShaderStage.FRAGMENT,
            }],
        });

        this.textureBindGroup = device.createBindGroup({
            layout: this.textureBindGroupLayout,
            entries: [{
                binding: 0,
                resource: imageSampler,
            }, {
                binding: 1,
                resource: this.imageTexture.createView(),
            }],
        });

        const shader = device.createShaderModule({
            code: shaderSource,
        });

        const tf = this.transform = new GPUTransform(this.device);
        mat4.translate(tf.viewMatrix, tf.viewMatrix, [ 0, 0, -10 ]);

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [
                this.transform.bindGroupLayout,
                this.textureBindGroupLayout
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
            multisample: {
                count: 4
            }
        });

        this.renderPassDesc = {
            colorAttachments: [{
                view: null,
                resolveTarget: null,
                clearValue: { r: 0, g: 0.15, b: 0.3, a: 1 },
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
        this.manip.viewportHeight = surface.size.height;

        if (this.manip.update()) {
            const { orbit, offset } = this.manip;
            const matView = this.transform.viewMatrix;
            mat4.identity(matView);
            const [ x, y, z ] = offset;
            mat4.translate(matView, matView, [ -x, -y, -z ] as any);
            mat4.rotateX(matView, matView, math.deg2rad(-orbit[0]));
            mat4.rotateY(matView, matView, math.deg2rad(-orbit[1]));
            mat4.rotateZ(matView, matView, math.deg2rad(-orbit[2]));
        }

        //mat4.rotateY(this.transform.modelMatrix, _idMatrix, math.deg2rad(state.seconds * 3));
        //mat4.rotateX(this.transform.modelMatrix, this.transform.modelMatrix, math.deg2rad(state.seconds * 30));
        this.transform.update();

        const encoder = this.device.createCommandEncoder();

        const textureView = surface.context.getCurrentTexture().createView();
        this.renderPassDesc.colorAttachments[0].resolveTarget = textureView;

        const pass = encoder.beginRenderPass(this.renderPassDesc);
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.transform.bindGroup);
        pass.setBindGroup(1, this.textureBindGroup);
        this.planeGeometry.setBuffers(pass);
        this.planeGeometry.draw(pass);
        pass.end();
        
        this.device.queue.submit([ encoder.finish() ]);
    }

    resize(surface: GPUSurface)
    {
        if (this.colorTexture) {
            this.colorTexture.destroy();
        }
        if (this.depthTexture) {
            this.depthTexture.destroy();
        }    

        this.colorTexture = this.device.createTexture({
            size: surface.size,
            format: surface.format,
            sampleCount: 4,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.depthTexture = this.device.createTexture({
            size: surface.size,
            format: "depth24plus",
            sampleCount: 4,
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });

        this.renderPassDesc.colorAttachments[0].view = this.colorTexture.createView();
        this.renderPassDesc.depthStencilAttachment.view = this.depthTexture.createView();

        const aspect = surface.size.width / surface.size.height;
        mat4.perspectiveZO(this.transform.projectionMatrix,
            math.deg2rad(50), aspect, 0.1, 1000);
    }

    onPointer(event: IPointerEvent): boolean
    {
        return this.manip.onPointer(event);
    }

    onTrigger(event: ITriggerEvent): boolean
    {
        return this.manip.onTrigger(event);
    }
}