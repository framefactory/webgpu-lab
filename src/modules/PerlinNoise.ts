/**
 * FF Typescript Foundation Library - WebGPU Tools
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { clone } from "@ffweb/core/clone.js";

import { UniformBuffer } from "@ffweb/gpu/UniformBuffer.js";
import { PipelineCache } from "@ffweb/gpu/PipelineCache.js";
import { TextureGenerator } from "@ffweb/gpu/TextureGenerator.js";

import classicNoise3D from "../modules/noise-generators/classicnoise3D.wgsl";


export interface IPerlinNoiseParams {
    offset: [ number, number, number ];
    scale: [ number, number, number ];
}


export class PerlinNoise extends TextureGenerator
{
    readonly params: IPerlinNoiseParams = {
        offset: [ 0, 0, 0 ],
        scale: [ 3, 3, 3 ]
    }

    constructor(cache: PipelineCache, size: number[], params?: Partial<IPerlinNoiseParams>)
    {
        const module = cache.device.createShaderModule({
            code: classicNoise3D,
        });
        
        super(cache, module, "main", size, "r32float", 8);

        this.params = { ...this.params, ...params };
    }

    update()
    {
        const params = this.params;
        const uniforms = this.uniformArray;

        uniforms.set(params.offset, 0);
        uniforms.set(params.scale, 4);

        super.update();
    }
}