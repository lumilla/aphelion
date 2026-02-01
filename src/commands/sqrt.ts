/**
 * Aphelion - Square Root
 *
 * Square root and nth root nodes.
 */

import { NodeBase } from '../core/node';
import { InnerBlock } from '../core/blocks';
import { L, R } from '../core/types';

/**
 * A square root.
 */
export class SquareRoot extends NodeBase {
  /** The content under the radical */
  readonly radicand: InnerBlock;

  constructor() {
    super();
    this.radicand = new InnerBlock();
    this.radicand.parent = this;
    this.ends[L] = this.radicand;
    this.ends[R] = this.radicand;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'aphelion-sqrt aphelion-non-leaf';
    el.setAttribute('data-mq-node-id', String(this.id));

    // Create the radical symbol structure
    const prefix = document.createElement('span');
    prefix.className = 'aphelion-sqrt-prefix aphelion-scaled';
    prefix.textContent = '√';

    const stem = document.createElement('span');
    stem.className = 'aphelion-sqrt-stem aphelion-scaled';

    const content = document.createElement('span');
    content.className = 'aphelion-sqrt-content';

    el.appendChild(prefix);
    el.appendChild(stem);
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
    const contentEl = el.querySelector('.aphelion-sqrt-content') as HTMLElement;

    contentEl.innerHTML = '';
    this.radicand.updateDom();
    contentEl.appendChild(this.radicand.domElement);

    // Scale the radical symbol based on content height
    this.scaleRadical();
  }

  /**
   * Scale the radical symbol to match the content height.
   */
  private scaleRadical(): void {
    const contentEl = this.domElement.querySelector(
      '.aphelion-sqrt-content'
    ) as HTMLElement;
    const stemEl = this.domElement.querySelector(
      '.aphelion-sqrt-stem'
    ) as HTMLElement;
    const prefixEl = this.domElement.querySelector(
      '.aphelion-sqrt-prefix'
    ) as HTMLElement;

    if (contentEl && stemEl && prefixEl) {
      const height = contentEl.offsetHeight || 20;
      const scale = Math.max(1, height / 20);
      prefixEl.style.transform = `scaleY(${scale})`;
      stemEl.style.height = `${height}px`;
    }
  }

  override reflow(): void {
    this.scaleRadical();
  }
}

/**
 * An nth root with an index.
 */
export class NthRoot extends NodeBase {
  /** The root index (e.g., 3 for cube root) */
  readonly index: InnerBlock;

  /** The content under the radical */
  readonly radicand: InnerBlock;

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
    const el = document.createElement('span');
    el.className = 'aphelion-nthroot aphelion-non-leaf';
    el.setAttribute('data-mq-node-id', String(this.id));

    const indexEl = document.createElement('sup');
    indexEl.className = 'aphelion-nthroot-index';

    const sqrtEl = document.createElement('span');
    sqrtEl.className = 'aphelion-sqrt';

    const prefix = document.createElement('span');
    prefix.className = 'aphelion-sqrt-prefix aphelion-scaled';
    prefix.textContent = '√';

    const stem = document.createElement('span');
    stem.className = 'aphelion-sqrt-stem aphelion-scaled';

    const content = document.createElement('span');
    content.className = 'aphelion-sqrt-content';

    sqrtEl.appendChild(prefix);
    sqrtEl.appendChild(stem);
    sqrtEl.appendChild(content);

    el.appendChild(indexEl);
    el.appendChild(sqrtEl);

    return el;
  }

  latex(): string {
    const idx = this.index.childrenLatex();
    const rad = this.radicand.childrenLatex();
    return `\\sqrt[${idx}]{${rad}}`;
  }

  text(): string {
    const idx = this.index.text();
    const rad = this.radicand.text();
    return `root(${idx})(${rad})`;
  }

  override mathspeak(): string {
    const idx = this.index.mathspeak();
    const rad = this.radicand.mathspeak();
    return `${idx} root of, ${rad}, end root`;
  }

  updateDom(): void {
    const el = this.domElement;
    const indexEl = el.querySelector('.aphelion-nthroot-index') as HTMLElement;
    const contentEl = el.querySelector('.aphelion-sqrt-content') as HTMLElement;

    indexEl.innerHTML = '';
    this.index.updateDom();
    indexEl.appendChild(this.index.domElement);

    contentEl.innerHTML = '';
    this.radicand.updateDom();
    contentEl.appendChild(this.radicand.domElement);
  }
}
