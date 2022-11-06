/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { IPointerEvent, ITriggerEvent } from "@ffweb/browser/ManipTarget.js";
import { type IPulseState  } from "@ffweb/browser/Pulse.js";
import { Surface } from "@ffweb/gpu/Surface.js";

export { Surface as GPUSurface, IPulseState };

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

    async initialize(surface: Surface)
    {
    }

    render(surface: Surface, state: IPulseState)
    {
    }

    resize(surface: Surface)
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