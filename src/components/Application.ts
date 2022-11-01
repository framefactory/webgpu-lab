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

import { Engine } from "../core/Engine.js";

@customElement("ff-application")
export default class Application extends CustomElement
{
    protected static readonly shady = true;

    protected canvas: HTMLCanvasElement;
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
        const canvas = this.canvas = event.detail.canvas;
        console.log(`[Canvas] ${canvas ? "mount" : "unmount"}`);

        if (canvas) {
            await this.engine.initialize(canvas);
            this.engine.start();
        }
    }

    protected onResize(event: ICanvasResizeEvent)
    {
        const { width, height, physicalWidth, physicalHeight } = event.detail;
        console.log(`[Canvas] resize ${width} x ${height} / ${physicalWidth} x ${physicalHeight}`);

        if (this.canvas) {
            this.canvas.width = physicalWidth;
            this.canvas.height = physicalHeight;
        }
    }
}
