/**
 * WebGPU Lab
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { LitElement, html } from "lit"
import { customElement } from "lit/decorators.js"

@customElement("ff-application")
export default class Application extends LitElement
{
    render()
    {
        return html`<h1>Lit Application</h1>`;
    }
}
