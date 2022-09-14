/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { CustomElement, customElement, html, css } from "@ff/lit/CustomElement";
import { fullsize } from "@ff/lit/styles/utils";

import "@ff/lit/Canvas";
import type { ICanvasMountEvent, ICanvasResizeEvent } from "@ff/lit/Canvas";

import { Engine } from "../core/Engine";

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
