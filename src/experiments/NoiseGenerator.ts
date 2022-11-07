/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { TextureLoader } from "@ffweb/gpu/TextureLoader.js";
import { PipelineCache } from "@ffweb/gpu/PipelineCache.js";
import { PixelRect } from "@ffweb/gpu/PixelRect.js";

import { Experiment, Surface, Pane, type IPulseState } from "../core/Experiment.js";

import { PerlinNoise } from "../modules/PerlinNoise.js";

export class NoiseGenerator extends Experiment
{
    cache: PipelineCache;
    generator0: PerlinNoise;
    generator1: PerlinNoise;
    rect0: PixelRect;
    rect1: PixelRect;
    rect2: PixelRect;
    renderPassDesc: GPURenderPassDescriptor;
    image: GPUTexture;

    async initialize(surface: Surface)
    {
        this.cache = new PipelineCache(this.device);

        this.generator0 = new PerlinNoise(this.cache, [ 512, 512 ]);
        this.generator1 = new PerlinNoise(this.cache, [ 512, 512 ]);
        const loader = new TextureLoader(this.device);
        this.image = await loader.fetchTextureFromImageUrl("test-tiles-1024a.png");

        this.rect0 = new PixelRect(this.cache, this.generator0.texture, {
            position: [8, 8]
        });

        this.rect1 = new PixelRect(this.cache, this.generator1.texture, {
            position: [ 528, 8 ]
        });

        this.rect2 = new PixelRect(this.cache, this.image, {
            position: [ 8, 528 ], scale: 1
        })

        this.renderPassDesc = {
            colorAttachments: [{
                view: null,
                clearValue: { r: 0.3, g: 0.4, b: 0.5, a: 1 },
                loadOp: "clear",
                storeOp: "store"
            }],
        }
    }

    createUI(pane: Pane)
    {
    }

    render(surface: Surface, state: IPulseState)
    {
        this.generator0.params.scale[1] = 20;
        this.generator0.params.offset[2] = state.seconds;
        this.generator0.update();

        this.generator1.params.offset[0] = state.seconds * 5;
        this.generator1.update();

        const encoder = this.device.createCommandEncoder();

        const textureView = surface.getCurrentTextureView();
        this.renderPassDesc.colorAttachments[0].view = textureView;

        const pass = encoder.beginRenderPass(this.renderPassDesc);
        this.rect0.render(pass);
        this.rect1.render(pass);
        this.rect2.render(pass);
        pass.end();

        this.device.queue.submit([ encoder.finish() ]);
    }

    resize(surface: Surface)
    {
        this.rect0.setSurfaceSize(surface);
        this.rect1.setSurfaceSize(surface);
        this.rect2.setSurfaceSize(surface);
    }
}