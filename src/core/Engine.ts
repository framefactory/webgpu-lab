/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { Pulse, type IPulseState } from "@ffweb/browser/Pulse.js";
import { Surface } from "@ffweb/gpu/Surface.js";
import { Experiment } from "./Experiment.js";

export class Engine
{
    pulse: Pulse;
    surface: Surface;
    device: GPUDevice;

    private _experiment: Experiment = null;
    private _resizeWidth = 0;
    private _resizeHeight = 0;
    
    constructor()
    {
        this.pulse = new Pulse();
        this.pulse.on("pulse", this.render, this);
    }

    async setExperiment(experiment: Experiment) {
        this._experiment = experiment;
        await experiment.initialize(this.surface);
    }

    get experiment(): Experiment | null {
        return this._experiment;
    }

    set canvas(canvas: HTMLCanvasElement) {
        if (canvas) {
            this.surface = new Surface(this.device, canvas);
        }
        else {
            this.surface.destroy();
        }
    }

    async initialize()
    {
        if (this.device) {
            return;
        }

        const gpu = navigator.gpu;
        const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });  
        this.device = this.device = await adapter.requestDevice();
    }

    destroy()
    {
        this.device.destroy();
        this.device = null;
        this.surface.destroy();
        this.surface = null;
    }

    start()
    {
        this.pulse.start();
    }

    stop()
    {
        this.pulse.stop();
    }

    render(state: IPulseState)
    {
        if (this._resizeWidth > 0 && this._resizeHeight > 0) {
            this.surface.resize(this._resizeWidth, this._resizeHeight);
            this._experiment?.resize(this.surface);
            this._resizeWidth = 0;
            this._resizeHeight = 0;
        }

        this._experiment?.render(this.surface, state);
    }

    resize(width: number, height: number)
    {
        this._resizeWidth = Math.round(width);
        this._resizeHeight = Math.round(height);
    }
}