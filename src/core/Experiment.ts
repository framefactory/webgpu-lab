/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { type IPulseState  } from "@ffweb/browser/Pulse.js";

import { Surface } from "../core/Surface.js";

export { Surface, IPulseState };

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

    initialize(surface: Surface)
    {
    }

    render(surface: Surface, state: IPulseState)
    {
    }

    resize(width: number, height: number)
    {
    }
}