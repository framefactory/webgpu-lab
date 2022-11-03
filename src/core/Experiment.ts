/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { IPointerEvent, ITriggerEvent } from "@ffweb/browser/ManipTarget.js";
import { type IPulseState  } from "@ffweb/browser/Pulse.js";
import { GPUSurface } from "@ffweb/gpu/GPUSurface.js";

export { GPUSurface, IPulseState };

/**
 * Base class for a WebGPU experiment
 */
export class Experiment
{
    protected device: GPUDevice;

    constructor(device: GPUDevice)
    {
        this.device = device;
    }

    async initialize(surface: GPUSurface)
    {
    }

    render(surface: GPUSurface, state: IPulseState)
    {
    }

    resize(surface: GPUSurface)
    {
    }

    onPointer(event: IPointerEvent): boolean
    {
        return false;
    }

    onTrigger(event: ITriggerEvent): boolean
    {
        return false;
    }
}