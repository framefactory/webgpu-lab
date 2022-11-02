/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { CustomElement, customElement, html, css } from "@ffweb/lit/CustomElement.js";
import { fullsize } from "@ffweb/lit/styles/snippets.js";

import "@ffweb/lit/Canvas";
import type { ICanvasMountEvent, ICanvasResizeEvent } from "@ffweb/lit/Canvas.js";

import { BufferLayout } from "@ffweb/geo/BufferLayout.js"

import { Engine } from "../core/Engine.js";
import { Triangle } from "../experiments/Triangle.js";
import { Plane } from "../experiments/Plane.js"

@customElement("ff-application")
export default class Application extends CustomElement
{
    protected static readonly shady = true;

    protected engine: Engine;

    static styles = css`
        :host {
            ${fullsize};
            display: flex;
        }

        ff-canvas {
            flex: 1;
            box-sizing: border-box;
        }
    `;

    constructor()
    {
        super();
        this.engine = new Engine();
    }

    render()
    {
        return html`
            <ff-canvas
                @resize=${this.onResize}
                @mount=${this.onMount}>
            </ff-canvas>
        `;
    }

    protected async onMount(event: ICanvasMountEvent)
    {
        const canvas = event.detail.canvas;

        await this.engine.initialize();
        this.engine.canvas = canvas;

        if (canvas) {
            await this.engine.setExperiment(new Plane(this.engine.device));
            this.engine.start();    
        }
        else {
            this.engine.stop();
        }
    }

    protected onResize(event: ICanvasResizeEvent)
    {
        const { physicalWidth, physicalHeight } = event.detail;
        this.engine.resize(physicalWidth, physicalHeight);
    }
}
