/**
 * Aphelion - Fraction
 *
 * A fraction node with numerator and denominator.
 */

import { NodeBase } from "../core/node";
import { InnerBlock } from "../core/blocks";
import { L, R } from "../core/types";

/**
 * A fraction with numerator and denominator blocks.
 */
export class Fraction extends NodeBase {
  /** The numerator block */
  readonly numerator: InnerBlock;

  /** The denominator block */
  readonly denominator: InnerBlock;
  /** Cached DOM element references */
  private _numEl?: HTMLElement;
  private _denomEl?: HTMLElement;
  constructor() {
    super();
    this.numerator = new InnerBlock();
    this.denominator = new InnerBlock();

    // Set up parent relationships
    this.numerator.parent = this;
    this.denominator.parent = this;

    // Set up ends - numerator is left, denominator is right
    this.ends[L] = this.numerator;
    this.ends[R] = this.denominator;

    // Link the blocks as siblings
    this.numerator[R] = this.denominator;
    this.denominator[L] = this.numerator;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-fraction aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));

    const innerEl = document.createElement("span");
    innerEl.className = "aphelion-fraction-inner";

    const numEl = document.createElement("span");
    numEl.className = "aphelion-numerator";

    const denomEl = document.createElement("span");
    denomEl.className = "aphelion-denominator";

    const fracLine = document.createElement("span");
    fracLine.className = "aphelion-fraction-line";

    innerEl.appendChild(numEl);
    innerEl.appendChild(fracLine);
    innerEl.appendChild(denomEl);
    el.appendChild(innerEl);

    return el;
  }

  latex(): string {
    const num = this.numerator.childrenLatex();
    const denom = this.denominator.childrenLatex();
    return `\\frac{${num}}{${denom}}`;
  }

  text(): string {
    const num = this.numerator.text();
    const denom = this.denominator.text();
    return `(${num})/(${denom})`;
  }

  override mathspeak(): string {
    const num = this.numerator.mathspeak();
    const denom = this.denominator.mathspeak();
    return `fraction, ${num}, over, ${denom}, end fraction`;
  }

  updateDom(): void {
    const el = this.domElement;

    // Cache element references on first access
    if (!this._numEl) {
      this._numEl = el.querySelector(".aphelion-numerator") as
        | HTMLElement
        | undefined;
      this._denomEl = el.querySelector(".aphelion-denominator") as
        | HTMLElement
        | undefined;
    }

    // Clear and update numerator
    if (this._numEl) {
      this._numEl.innerHTML = "";
      this.numerator.updateDom();
      this._numEl.appendChild(this.numerator.domElement);
    }

    // Clear and update denominator
    if (this._denomEl) {
      this._denomEl.innerHTML = "";
      this.denominator.updateDom();
      this._denomEl.appendChild(this.denominator.domElement);
    }
  }

  /**
   * Check if both numerator and denominator are empty.
   */
  isEmpty(): boolean {
    return this.numerator.isEmpty() && this.denominator.isEmpty();
  }
}

/**
 * Display-style fraction (larger, for displayed equations).
 */
export class DisplayFraction extends Fraction {
  protected override createDomElement(): HTMLElement {
    const el = super.createDomElement();
    el.classList.add("aphelion-dfrac");
    return el;
  }

  override latex(): string {
    const num = this.numerator.childrenLatex();
    const denom = this.denominator.childrenLatex();
    return `\\dfrac{${num}}{${denom}}`;
  }
}

/**
 * Text-style fraction (smaller, for inline).
 */
export class TextFraction extends Fraction {
  protected override createDomElement(): HTMLElement {
    const el = super.createDomElement();
    el.classList.add("aphelion-tfrac");
    return el;
  }

  override latex(): string {
    const num = this.numerator.childrenLatex();
    const denom = this.denominator.childrenLatex();
    return `\\tfrac{${num}}{${denom}}`;
  }
}
