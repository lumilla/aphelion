/**
 * Aphelion - Large Operators
 *
 * Summation, product, integral, and similar large operators.
 */

import { NodeBase } from '../core/node';
import { InnerBlock } from '../core/blocks';
import { L, R } from '../core/types';

/**
 * Base class for large operators with optional limits.
 */
export abstract class LargeOperator extends NodeBase {
  /** The operator symbol */
  abstract readonly symbol: string;

  /** The LaTeX command */
  abstract readonly command: string;

  /** Lower limit (optional) */
  readonly lower?: InnerBlock;

  /** Upper limit (optional) */
  readonly upper?: InnerBlock;

  /** Whether limits are displayed inline or above/below */
  limitsDisplay: 'inline' | 'display' = 'display';

  constructor(withLimits: boolean = false) {
    super();

    if (withLimits) {
      const lower = new InnerBlock();
      const upper = new InnerBlock();

      lower.parent = this;
      upper.parent = this;

      (this as { lower: InnerBlock }).lower = lower;
      (this as { upper: InnerBlock }).upper = upper;

      // For up/down navigation: ends[L] is "up" (upper), ends[R] is "down" (lower)
      // This matches fraction behavior where numerator is ends[L] and denominator is ends[R]
      this.ends[L] = upper;
      this.ends[R] = lower;

      upper[R] = lower;
      lower[L] = upper;
    }
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'aphelion-large-operator aphelion-non-leaf';
    el.setAttribute('data-mq-node-id', String(this.id));

    if (this.lower && this.upper && this.limitsDisplay === 'display') {
      // Display style with limits above/below
      const container = document.createElement('span');
      container.className = 'aphelion-limits-container';

      const upperEl = document.createElement('span');
      upperEl.className = 'aphelion-upper-limit';

      const symbolEl = document.createElement('span');
      symbolEl.className = 'aphelion-operator-symbol';
      symbolEl.textContent = this.symbol;

      const lowerEl = document.createElement('span');
      lowerEl.className = 'aphelion-lower-limit';

      container.appendChild(upperEl);
      container.appendChild(symbolEl);
      container.appendChild(lowerEl);
      el.appendChild(container);
    } else if (this.lower && this.upper) {
      // Inline style with limits as sub/superscript
      const symbolEl = document.createElement('span');
      symbolEl.className = 'aphelion-operator-symbol';
      symbolEl.textContent = this.symbol;

      const limitsEl = document.createElement('span');
      limitsEl.className = 'aphelion-inline-limits';

      const upperEl = document.createElement('sup');
      upperEl.className = 'aphelion-upper-limit';

      const lowerEl = document.createElement('sub');
      lowerEl.className = 'aphelion-lower-limit';

      limitsEl.appendChild(upperEl);
      limitsEl.appendChild(lowerEl);

      el.appendChild(symbolEl);
      el.appendChild(limitsEl);
    } else {
      // No limits
      const symbolEl = document.createElement('span');
      symbolEl.className = 'aphelion-operator-symbol';
      symbolEl.textContent = this.symbol;
      el.appendChild(symbolEl);
    }

    return el;
  }

  latex(): string {
    let result = this.command;

    if (this.lower) {
      result += `_{${this.lower.childrenLatex()}}`;
    }
    if (this.upper) {
      result += `^{${this.upper.childrenLatex()}}`;
    }

    return result;
  }

  text(): string {
    let result = this.command.slice(1); // Remove backslash

    if (this.lower) {
      result += `_${this.lower.text()}`;
    }
    if (this.upper) {
      result += `^${this.upper.text()}`;
    }

    return result;
  }

  updateDom(): void {
    const el = this.domElement;

    if (this.lower) {
      const lowerEl = el.querySelector('.aphelion-lower-limit') as HTMLElement;
      lowerEl.innerHTML = '';
      this.lower.updateDom();
      lowerEl.appendChild(this.lower.domElement);
    }

    if (this.upper) {
      const upperEl = el.querySelector('.aphelion-upper-limit') as HTMLElement;
      upperEl.innerHTML = '';
      this.upper.updateDom();
      upperEl.appendChild(this.upper.domElement);
    }
  }
}

/**
 * Summation (∑)
 */
export class Summation extends LargeOperator {
  readonly symbol = '∑';
  readonly command = '\\sum';

  override mathspeak(): string {
    let result = 'summation';
    if (this.lower) {
      result += ` from ${this.lower.mathspeak()}`;
    }
    if (this.upper) {
      result += ` to ${this.upper.mathspeak()}`;
    }
    return result;
  }
}

/**
 * Product (∏)
 */
export class Product extends LargeOperator {
  readonly symbol = '∏';
  readonly command = '\\prod';

  override mathspeak(): string {
    let result = 'product';
    if (this.lower) {
      result += ` from ${this.lower.mathspeak()}`;
    }
    if (this.upper) {
      result += ` to ${this.upper.mathspeak()}`;
    }
    return result;
  }
}

/**
 * Integral (∫)
 */
export class Integral extends LargeOperator {
  readonly symbol = '∫';
  readonly command = '\\int';

  override mathspeak(): string {
    let result = 'integral';
    if (this.lower) {
      result += ` from ${this.lower.mathspeak()}`;
    }
    if (this.upper) {
      result += ` to ${this.upper.mathspeak()}`;
    }
    return result;
  }
}

/**
 * Double integral (∬)
 */
export class DoubleIntegral extends LargeOperator {
  readonly symbol = '∬';
  readonly command = '\\iint';

  override mathspeak(): string {
    return 'double integral';
  }
}

/**
 * Triple integral (∭)
 */
export class TripleIntegral extends LargeOperator {
  readonly symbol = '∭';
  readonly command = '\\iiint';

  override mathspeak(): string {
    return 'triple integral';
  }
}

/**
 * Contour integral (∮)
 */
export class ContourIntegral extends LargeOperator {
  readonly symbol = '∮';
  readonly command = '\\oint';

  override mathspeak(): string {
    return 'contour integral';
  }
}

/**
 * Union (⋃)
 */
export class BigUnion extends LargeOperator {
  readonly symbol = '⋃';
  readonly command = '\\bigcup';

  override mathspeak(): string {
    return 'union';
  }
}

/**
 * Intersection (⋂)
 */
export class BigIntersection extends LargeOperator {
  readonly symbol = '⋂';
  readonly command = '\\bigcap';

  override mathspeak(): string {
    return 'intersection';
  }
}

/**
 * Limit (lim) - only has lower limit
 */
export class Limit extends NodeBase {
  /** The limit expression (e.g., x → 0) */
  readonly subscript?: InnerBlock;

  /** The LaTeX command */
  readonly command = '\\lim';

  constructor(withSubscript: boolean = false) {
    super();

    if (withSubscript) {
      const sub = new InnerBlock();
      sub.parent = this;
      (this as { subscript: InnerBlock }).subscript = sub;
      this.ends[L] = sub;
      this.ends[R] = sub;
    }
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement('span');
    el.className =
      'aphelion-large-operator aphelion-limit-op aphelion-non-leaf';
    el.setAttribute('data-mq-node-id', String(this.id));

    const container = document.createElement('span');
    container.className = 'aphelion-limits-container';

    const operatorEl = document.createElement('span');
    operatorEl.className = 'aphelion-operator-name';
    operatorEl.textContent = 'lim';

    container.appendChild(operatorEl);

    if (this.subscript) {
      const subEl = document.createElement('span');
      subEl.className = 'aphelion-lower-limit';
      container.appendChild(subEl);
    }

    el.appendChild(container);
    return el;
  }

  latex(): string {
    if (this.subscript) {
      return `\\lim_{${this.subscript.childrenLatex()}}`;
    }
    return '\\lim';
  }

  text(): string {
    if (this.subscript) {
      return `lim_${this.subscript.text()}`;
    }
    return 'lim';
  }

  override mathspeak(): string {
    if (this.subscript) {
      return `limit as ${this.subscript.mathspeak()}`;
    }
    return 'limit';
  }

  updateDom(): void {
    if (this.subscript) {
      const el = this.domElement;
      const subEl = el.querySelector('.aphelion-lower-limit') as HTMLElement;
      if (subEl) {
        subEl.innerHTML = '';
        this.subscript.updateDom();
        subEl.appendChild(this.subscript.domElement);
      }
    }
  }
}
