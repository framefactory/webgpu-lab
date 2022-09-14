/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

export class Engine
{
    protected static vertexShaderCode = /* wgsl */`
        @vertex

        fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32>
        {
            var pos = array<vec2<f32>, 3>(
                vec2<f32>(0.0, 0.5),
                vec2<f32>(-0.5, -0.5),
                vec2<f32>(0.5, -0.5)
            );
            return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
        }
    `;

    protected static fragmentShaderCode = /* wgsl */`
        @fragment

        fn main() -> @location(0) vec4<f32>
        {
            return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        }
    `;

    protected canvas: HTMLCanvasElement = null;
    protected context: GPUCanvasContext = null;
    protected device: GPUDevice = null;
    protected pipeline: GPURenderPipeline = null;
    
    constructor()
    {
        this.animate = this.animate.bind(this);
    }

    async initialize(canvas: HTMLCanvasElement)
    {
        console.log("[Engine] initialize");

        const gpu = navigator.gpu;
        const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });  
        const presentationFormat = gpu.getPreferredCanvasFormat();
        const device = this.device = await adapter.requestDevice();

        this.canvas = canvas;
        const context = this.context = canvas.getContext("webgpu");
        context.configure({
            device,
            format: presentationFormat,
            alphaMode: "opaque"
        });

        const vertexShader = this.device.createShaderModule({
            code: Engine.vertexShaderCode,
        });
        const fragmentShader = this.device.createShaderModule({
            code: Engine.fragmentShaderCode,
        });
    
        this.pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: vertexShader,
                entryPoint: "main"
            },
            fragment: {
                module: fragmentShader,
                entryPoint: "main",
                targets: [{
                    format: presentationFormat
                }]
            },
            primitive: {
                topology: "triangle-list"
            },
        });
    }

    destroy()
    {
        this.device.destroy();
        this.device = null;
        this.canvas = null;
    }

    start()
    {
        requestAnimationFrame(this.animate);
    }

    animate()
    {
        requestAnimationFrame(this.animate);
        this.render();
    }

    render()
    {
        if (!this.canvas) {
            return;
        }

        const encoder = this.device.createCommandEncoder();
        const texture = this.context.getCurrentTexture();
        console.log(texture.width, texture.height);
        const view = texture.createView();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view,
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store"
            }],
        });
        pass.setPipeline(this.pipeline);
        pass.draw(3, 1, 0, 0);
        pass.end();

        this.device.queue.submit([ encoder.finish() ]);
    }

    resize(width: number, height: number)
    {
    }
}