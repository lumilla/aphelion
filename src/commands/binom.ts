/**
 * Aphelion - Binomial Coefficient Support
 *
 * Implements binomial coefficient notation like \binom{n}{k}.
 */

import { NodeBase } from "../core/node";
import { InnerBlock } from "../core/blocks";
import { L, R } from "../core/types";

/**
 * Binomial coefficient node: (n k) in parentheses.
 */
export class BinomialCoefficient extends NodeBase {
  /** The numerator (top) */
  readonly numerator: InnerBlock;

  /** The denominator (bottom) */
  readonly denominator: InnerBlock;
  /** Cached DOM element references */
  private _numEl?: HTMLElement;
  private _denomEl?: HTMLElement;
  constructor() {
    super();
    this.numerator = new InnerBlock();
    this.denominator = new InnerBlock();
    this.numerator.parent = this;
    this.denominator.parent = this;
    this.ends[L] = this.numerator;
    this.ends[R] = this.denominator;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-binom aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));

    // Opening parenthesis
    const openParen = document.createElement("span");
    openParen.className = "aphelion-binom-paren aphelion-binom-open";
    openParen.textContent = "(";

    // Content wrapper
    const content = document.createElement("span");
    content.className = "aphelion-binom-content";

    // Numerator
    const numEl = document.createElement("span");
    numEl.className = "aphelion-binom-numerator";

    // Denominator
    const denEl = document.createElement("span");
    denEl.className = "aphelion-binom-denominator";

    content.appendChild(numEl);
    content.appendChild(denEl);

    // Closing parenthesis
    const closeParen = document.createElement("span");
    closeParen.className = "aphelion-binom-paren aphelion-binom-close";
    closeParen.textContent = ")";

    el.appendChild(openParen);
    el.appendChild(content);
    el.appendChild(closeParen);

    return el;
  }

  latex(): string {
    const num = this.numerator.childrenLatex();
    const den = this.denominator.childrenLatex();
    return `\\binom{${num}}{${den}}`;
  }

  text(): string {
    return `(${this.numerator.text()} ${this.denominator.text()})`;
  }

  override mathspeak(): string {
    return `binomial coefficient, ${this.numerator.mathspeak()}, choose, ${this.denominator.mathspeak()}`;
  }

  updateDom(): void {
    const el = this.domElement;

    // Cache element references on first access
    if (!this._numEl) {
      this._numEl = el.querySelector(
        ".aphelion-binom-numerator",
      ) as HTMLElement;
      this._denomEl = el.querySelector(
        ".aphelion-binom-denominator",
      ) as HTMLElement;
    }

    if (this._numEl) {
      this._numEl.innerHTML = "";
      this.numerator.updateDom();
      this._numEl.appendChild(this.numerator.domElement);
    }

    if (this._denomEl) {
      this._denomEl.innerHTML = "";
      this.denominator.updateDom();
      this._denomEl.appendChild(this.denominator.domElement);
    }

    // Scale parentheses to match content height
    this.scaleParen();
  }

  private scaleParen(): void {
    const content = this.domElement.querySelector(
      ".aphelion-binom-content",
    ) as HTMLElement;
    const openParen = this.domElement.querySelector(
      ".aphelion-binom-open",
    ) as HTMLElement;
    const closeParen = this.domElement.querySelector(
      ".aphelion-binom-close",
    ) as HTMLElement;

    if (content && openParen && closeParen) {
      const height = content.offsetHeight || 40;
      const scale = Math.max(1, height / 20);
      openParen.style.transform = `scaleY(${scale})`;
      closeParen.style.transform = `scaleY(${scale})`;
    }
  }

  override reflow(): void {
    this.scaleParen();
  }
}
