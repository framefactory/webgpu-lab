/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { Pane } from "tweakpane";

import { ManipTarget, IPointerEvent, ITriggerEvent } from "@ffweb/browser/ManipTarget.js";

import { CustomElement, customElement, html, css } from "@ffweb/lit/CustomElement.js";
import { fullsize } from "@ffweb/lit/styles/snippets.js";

import "@ffweb/lit/Canvas";
import type { ICanvasMountEvent, ICanvasResizeEvent } from "@ffweb/lit/Canvas.js";

import { BufferLayout } from "@ffweb/geo/BufferLayout.js"

import { Engine } from "../core/Engine.js";
import { Experiment } from "../core/Experiment.js";

import { Triangle } from "../experiments/Triangle.js";
import { Plane } from "../experiments/Plane.js"
import { TextureMSAA } from "../experiments/TextureMSAA.js";
import { NoiseGenerator  } from "../experiments/NoiseGenerator.js";

@customElement("ff-application")
export default class Application extends CustomElement
{
    protected static readonly shady = true;

    protected engine: Engine;
    protected manipTarget: ManipTarget;
    protected pane: Pane;

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
        this.manipTarget = new ManipTarget();
        this.manipTarget.listener = this;
        this.pane = new Pane({ title: "Controls" });
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
            this.manipTarget.element = canvas;
            const experiment = new NoiseGenerator(this.engine.device);
            experiment.createUI(this.pane);
            await this.engine.setExperiment(experiment);
            this.engine.start();    
        }
        else {
            this.engine.stop();
            this.manipTarget.element = null;
        }
    }

    protected onResize(event: ICanvasResizeEvent)
    {
        const { physicalWidth, physicalHeight } = event.detail;
        this.engine.resize(physicalWidth, physicalHeight);
    }

    onPointer(event: IPointerEvent): boolean
    {
        return this.engine.experiment?.onPointer(event);
    }

    onTrigger(event: ITriggerEvent): boolean
    {
        return this.engine.experiment?.onTrigger(event);
    }
}
