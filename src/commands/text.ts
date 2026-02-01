/**
 * Aphelion - Text and Operator Names
 *
 * Text content and named operators (sin, cos, etc.).
 */

import { NodeBase } from '../core/node';

/**
 * A text span (non-math content).
 */
export class TextSpan extends NodeBase {
  /** The text content */
  private _text: string;

  constructor(text: string = '') {
    super();
    this._text = text;
  }

  /** Get/set the text content */
  get textContent(): string {
    return this._text;
  }

  set textContent(value: string) {
    this._text = value;
    if (this._domElement) {
      this._domElement.textContent = value;
    }
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'aphelion-text';
    el.textContent = this._text;
    el.setAttribute('data-mq-node-id', String(this.id));
    return el;
  }

  latex(): string {
    return `\\text{${this._text}}`;
  }

  text(): string {
    return this._text;
  }

  updateDom(): void {
    this.domElement.textContent = this._text;
  }
}

/**
 * An operator name like sin, cos, log, etc.
 */
export class OperatorName extends NodeBase {
  /** The operator name */
  readonly name: string;

  /** The LaTeX command (if different from name) */
  readonly latexCmd: string;

  constructor(name: string, latexCmd?: string) {
    super();
    this.name = name;
    this.latexCmd = latexCmd ?? `\\${name}`;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'aphelion-operator-name';
    el.textContent = this.name;
    el.setAttribute('data-mq-node-id', String(this.id));
    return el;
  }

  latex(): string {
    return this.latexCmd;
  }

  text(): string {
    return this.name;
  }

  override mathspeak(): string {
    return this.name;
  }

  updateDom(): void {
    this.domElement.textContent = this.name;
  }
}

/**
 * Factory for common operator names.
 */
export const Operators = {
  // Trigonometric
  sin: () => new OperatorName('sin'),
  cos: () => new OperatorName('cos'),
  tan: () => new OperatorName('tan'),
  cot: () => new OperatorName('cot'),
  sec: () => new OperatorName('sec'),
  csc: () => new OperatorName('csc'),

  // Inverse trig
  arcsin: () => new OperatorName('arcsin'),
  arccos: () => new OperatorName('arccos'),
  arctan: () => new OperatorName('arctan'),

  // Hyperbolic
  sinh: () => new OperatorName('sinh'),
  cosh: () => new OperatorName('cosh'),
  tanh: () => new OperatorName('tanh'),

  // Logarithms
  log: () => new OperatorName('log'),
  ln: () => new OperatorName('ln'),
  lg: () => new OperatorName('lg'),
  exp: () => new OperatorName('exp'),

  // Limits and calculus
  lim: () => new OperatorName('lim'),
  limsup: () => new OperatorName('limsup'),
  liminf: () => new OperatorName('liminf'),

  // Other
  max: () => new OperatorName('max'),
  min: () => new OperatorName('min'),
  sup: () => new OperatorName('sup'),
  inf: () => new OperatorName('inf'),
  det: () => new OperatorName('det'),
  dim: () => new OperatorName('dim'),
  ker: () => new OperatorName('ker'),
  hom: () => new OperatorName('Hom', '\\hom'),
  arg: () => new OperatorName('arg'),
  deg: () => new OperatorName('deg'),
  gcd: () => new OperatorName('gcd'),
  lcm: () => new OperatorName('lcm'),
  mod: () => new OperatorName('mod'),
};

/**
 * Check if a string is a known operator name.
 */
export function isOperatorName(name: string): boolean {
  return name in Operators;
}

/**
 * Create an operator from a name.
 */
export function createOperator(name: string): OperatorName | undefined {
  const factory = Operators[name as keyof typeof Operators];
  return factory?.();
}
