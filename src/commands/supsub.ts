/**
 * Aphelion - Subscript and Superscript
 *
 * Nodes for subscript, superscript, and combined sub/superscript.
 */

import { NodeBase } from "../core/node";
import { InnerBlock } from "../core/blocks";
import { L, R } from "../core/types";

/**
 * A subscript node.
 */
export class Subscript extends NodeBase {
  /** The subscript content */
  readonly sub: InnerBlock;

  /** Cached DOM element reference */
  private _subEl?: HTMLElement;

  constructor() {
    super();
    this.sub = new InnerBlock();
    this.sub.parent = this;
    this.ends[L] = this.sub;
    this.ends[R] = this.sub;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-supsub aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));

    const subEl = document.createElement("span");
    subEl.className = "aphelion-sub";

    // Zero-width space for sizing
    const spacer = document.createElement("span");
    spacer.style.display = "inline-block";
    spacer.style.width = "0";
    spacer.textContent = "\u200B";

    el.appendChild(subEl);
    el.appendChild(spacer);

    return el;
  }

  latex(): string {
    const content = this.sub.childrenLatex();
    // Single character subscripts don't need braces
    if (content.length === 1) {
      return `_${content}`;
    }
    return `_{${content}}`;
  }

  text(): string {
    return `_${this.sub.text()}`;
  }

  override mathspeak(): string {
    return `subscript, ${this.sub.mathspeak()}, end subscript`;
  }

  updateDom(): void {
    const el = this.domElement;

    // Cache element reference on first access
    if (!this._subEl) {
      this._subEl = el.querySelector(".aphelion-sub") as
        | HTMLElement
        | undefined;
    }

    if (this._subEl) {
      this._subEl.innerHTML = "";
      this.sub.updateDom();
      this._subEl.appendChild(this.sub.domElement);
    }
  }
}

/**
 * A superscript node.
 */
export class Superscript extends NodeBase {
  /** The superscript content */
  readonly sup: InnerBlock;

  /** Cached DOM element reference */
  private _supEl?: HTMLElement;

  constructor() {
    super();
    this.sup = new InnerBlock();
    this.sup.parent = this;
    this.ends[L] = this.sup;
    this.ends[R] = this.sup;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-supsub aphelion-non-leaf aphelion-sup-only";
    el.setAttribute("data-mq-node-id", String(this.id));

    const supEl = document.createElement("span");
    supEl.className = "aphelion-sup";

    el.appendChild(supEl);

    return el;
  }

  latex(): string {
    const content = this.sup.childrenLatex();
    // Single character superscripts don't need braces
    if (content.length === 1) {
      return `^${content}`;
    }
    return `^{${content}}`;
  }

  text(): string {
    return `^${this.sup.text()}`;
  }

  override mathspeak(): string {
    return `superscript, ${this.sup.mathspeak()}, end superscript`;
  }

  updateDom(): void {
    const el = this.domElement;

    // Cache element reference on first access
    if (!this._supEl) {
      this._supEl = el.querySelector(".aphelion-sup") as
        | HTMLElement
        | undefined;
    }

    if (this._supEl) {
      this._supEl.innerHTML = "";
      this.sup.updateDom();
      this._supEl.appendChild(this.sup.domElement);
    }
  }
}

/**
 * Combined subscript and superscript.
 */
export class SupSub extends NodeBase {
  /** The subscript content */
  readonly sub: InnerBlock;

  /** The superscript content */
  readonly sup: InnerBlock;

  /** Cached DOM element references */
  private _subEl?: HTMLElement;
  private _supEl?: HTMLElement;

  constructor() {
    super();
    this.sub = new InnerBlock();
    this.sup = new InnerBlock();

    this.sub.parent = this;
    this.sup.parent = this;

    // Superscript is "left" (first), subscript is "right"
    this.ends[L] = this.sup;
    this.ends[R] = this.sub;

    this.sup[R] = this.sub;
    this.sub[L] = this.sup;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-supsub aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));

    const supEl = document.createElement("span");
    supEl.className = "aphelion-sup";

    const subEl = document.createElement("span");
    subEl.className = "aphelion-sub";

    el.appendChild(supEl);
    el.appendChild(subEl);

    return el;
  }

  latex(): string {
    const supContent = this.sup.childrenLatex();
    const subContent = this.sub.childrenLatex();

    const supLatex =
      supContent.length === 1 ? `^${supContent}` : `^{${supContent}}`;
    const subLatex =
      subContent.length === 1 ? `_${subContent}` : `_{${subContent}}`;

    return `${subLatex}${supLatex}`;
  }

  text(): string {
    return `_${this.sub.text()}^${this.sup.text()}`;
  }

  override mathspeak(): string {
    return `subscript, ${this.sub.mathspeak()}, superscript, ${this.sup.mathspeak()}, end scripts`;
  }

  updateDom(): void {
    const el = this.domElement;

    // Cache element references on first access
    if (!this._supEl) {
      this._supEl = el.querySelector(".aphelion-sup") as
        | HTMLElement
        | undefined;
      this._subEl = el.querySelector(".aphelion-sub") as
        | HTMLElement
        | undefined;
    }

    if (this._supEl) {
      this._supEl.innerHTML = "";
      this.sup.updateDom();
      this._supEl.appendChild(this.sup.domElement);
    }

    if (this._subEl) {
      this._subEl.innerHTML = "";
      this.sub.updateDom();
      this._subEl.appendChild(this.sub.domElement);
    }
  }
}
