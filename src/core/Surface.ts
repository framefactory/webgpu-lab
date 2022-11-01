/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

export class Surface
{
    canvas: HTMLCanvasElement;
    context: GPUCanvasContext;
    presentationFormat: GPUTextureFormat;

    constructor(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas;
        this.context = canvas.getContext("webgpu");
    }

    configure(device: GPUDevice, presentationFormat?: GPUTextureFormat)
    {
        if (presentationFormat === undefined) {
            presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        }

        this.presentationFormat = presentationFormat;

        this.context.configure({
            device,
            format: presentationFormat,
            alphaMode: "opaque"
        });
    }

    resize(width: number, height: number)
    {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    destroy()
    {
        this.context.unconfigure();
    }
}