/**
 * Aphelion - Square Root
 *
 * Square root and nth root nodes.
 */

import { NodeBase } from "../core/node";
import { InnerBlock } from "../core/blocks";
import { L, R } from "../core/types";
// I don't remember why I named it RADICAL_SVG. Is it radicalizing? Is it radical? Is it a radical symbol?
const RADICAL_SVG = `<svg class="aphelion-sqrt-svg" viewBox="0 0 16 100" preserveAspectRatio="none" aria-hidden="true"><path d="M 1 54 L 3.5 50 L 6.8 96 L 15.2 1 L 16 1" stroke="currentColor" stroke-width="1.6" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * A square root.
 */
export class SquareRoot extends NodeBase {
  /** The content under the radical */
  readonly radicand: InnerBlock;

  /** Cached DOM element reference */
  private _contentEl?: HTMLElement;

  constructor() {
    super();
    this.radicand = new InnerBlock();
    this.radicand.parent = this;
    this.ends[L] = this.radicand;
    this.ends[R] = this.radicand;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-sqrt aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));

    // Create the radical symbol structure with gapless SVG
    const prefix = document.createElement("span");
    prefix.className = "aphelion-sqrt-prefix";
    prefix.innerHTML = RADICAL_SVG;

    const content = document.createElement("span");
    content.className = "aphelion-sqrt-content";

    el.appendChild(prefix);
    el.appendChild(content);

    return el;
  }

  latex(): string {
    return `\\sqrt{${this.radicand.childrenLatex()}}`;
  }

  text(): string {
    return `sqrt(${this.radicand.text()})`;
  }

  override mathspeak(): string {
    return `square root of, ${this.radicand.mathspeak()}, end square root`;
  }

  updateDom(): void {
    const el = this.domElement;

    // Cache element reference on first access
    if (!this._contentEl) {
      this._contentEl = el.querySelector(".aphelion-sqrt-content") as
        | HTMLElement
        | undefined;
    }

    if (this._contentEl) {
      this._contentEl.innerHTML = "";
      this.radicand.updateDom();
      this._contentEl.appendChild(this.radicand.domElement);
    }

    // CSS flex stretch handles radical scaling automatically
  }

  /**
   * Reflow radical symbol when needed.
   */
  private scaleRadical(): void {
    // Pure CSS flexbox align-items: stretch guarantees gapless scaling natively
  }

  override reflow(): void {
    this.scaleRadical();
  }
}

/**
 * An nth root with an index.
 */
export class NthRoot extends NodeBase {
  override horizontalBlockNav = true;

  /** The root index (e.g., 3 for cube root) */
  readonly index: InnerBlock;

  /** The content under the radical */
  readonly radicand: InnerBlock;

  /** Cached DOM element references */
  private _indexEl?: HTMLElement;
  private _contentEl?: HTMLElement;

  constructor() {
    super();
    this.index = new InnerBlock();
    this.radicand = new InnerBlock();

    this.index.parent = this;
    this.radicand.parent = this;

    this.ends[L] = this.index;
    this.ends[R] = this.radicand;

    this.index[R] = this.radicand;
    this.radicand[L] = this.index;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-nthroot aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));

    const indexWrapper = document.createElement("span");
    indexWrapper.className = "aphelion-nthroot-index-wrapper";

    const indexEl = document.createElement("sup");
    indexEl.className = "aphelion-nthroot-index";
    indexWrapper.appendChild(indexEl);

    const sqrtEl = document.createElement("span");
    sqrtEl.className = "aphelion-sqrt";

    const prefix = document.createElement("span");
    prefix.className = "aphelion-sqrt-prefix";
    prefix.innerHTML = RADICAL_SVG;

    const content = document.createElement("span");
    content.className = "aphelion-sqrt-content";

    sqrtEl.appendChild(prefix);
    sqrtEl.appendChild(content);

    el.appendChild(indexWrapper);
    el.appendChild(sqrtEl);

    return el;
  }

  latex(): string {
    const idx = this.index.childrenLatex();
    const rad = this.radicand.childrenLatex();
    return `\\sqrt[${idx}]{${rad}}`;
  }

  text(): string {
    const idx = this.index.text() || "2";
    const rad = this.radicand.text();
    return `root(${idx}, ${rad})`;
  }

  override mathspeak(): string {
    const idx = this.index.mathspeak();
    const rad = this.radicand.mathspeak();
    return `${idx} root of, ${rad}, end root`;
  }

  updateDom(): void {
    const el = this.domElement;

    // Cache element references on first access
    if (!this._indexEl) {
      this._indexEl = el.querySelector(".aphelion-nthroot-index") as
        | HTMLElement
        | undefined;
      this._contentEl = el.querySelector(".aphelion-sqrt-content") as
        | HTMLElement
        | undefined;
    }

    if (this._indexEl) {
      this._indexEl.innerHTML = "";
      this.index.updateDom();
      this._indexEl.appendChild(this.index.domElement);
    }

    if (this._contentEl) {
      this._contentEl.innerHTML = "";
      this.radicand.updateDom();
      this._contentEl.appendChild(this.radicand.domElement);
    }

    this.scaleRadical();
  }

  private scaleRadical(): void {
    // Pure CSS flexbox align-items: stretch guarantees gapless scaling natively
  }

  override reflow(): void {
    this.scaleRadical();
  }
}
