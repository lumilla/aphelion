/**
 * Aphelion - Math Symbol Node
 *
 * A node representing a single character or symbol in the math tree.
 */

import { NodeBase } from "../core/node";

/**
 * A single character or symbol in the math tree.
 */
export class MathSymbol extends NodeBase {
  /** The character or symbol */
  readonly char: string;

  /** The LaTeX command for this symbol (if any) */
  readonly latexCmd?: string;

  /** The symbol this degrades to on backspace (e.g., ≤ → <) */
  readonly degradesTo?: string;

  /** CSS class for styling */
  protected cssClass = "aphelion-symbol";

  constructor(char: string, latexCmd?: string, degradesTo?: string) {
    super();
    this.char = char;
    this.latexCmd = latexCmd;
    this.degradesTo = degradesTo;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = this.cssClass;
    el.textContent = this.char;
    el.setAttribute("data-mq-node-id", String(this.id));
    return el;
  }

  latex(): string {
    return this.latexCmd ?? this.char;
  }

  text(): string {
    return this.char;
  }

  updateDom(): void {
    this.domElement.textContent = this.char;
  }

  /**
   * Check if this symbol can degrade to a simpler form.
   */
  canDegrade(): boolean {
    return this.degradesTo !== undefined;
  }

  /**
   * Create the degraded version of this symbol.
   * Returns undefined if there's no degradation.
   */
  createDegraded(): MathSymbol | undefined {
    if (!this.degradesTo) return undefined;
    // Create a simple MathSymbol or Relation for the degraded form
    return new MathSymbol(this.degradesTo);
  }
}

/**
 * A variable (single letter, rendered in italics).
 */
export class Variable extends MathSymbol {
  protected override cssClass = "aphelion-variable";

  constructor(letter: string) {
    super(letter);
  }

  protected override createDomElement(): HTMLElement {
    const el = super.createDomElement();
    el.classList.add("aphelion-italic");
    return el;
  }
}

/**
 * A digit (0-9).
 */
export class Digit extends MathSymbol {
  protected override cssClass = "aphelion-digit";

  constructor(digit: string) {
    super(digit);
  }
}

/**
 * A binary operator (+, -, ×, ÷, etc.).
 */
export class BinaryOperator extends MathSymbol {
  protected override cssClass = "aphelion-binary-operator";

  constructor(char: string, latexCmd?: string) {
    super(char, latexCmd);
  }

  protected override createDomElement(): HTMLElement {
    const el = super.createDomElement();
    el.classList.add("aphelion-operator");
    return el;
  }

  override text(): string {
    // Add spaces around binary operators for text output
    return ` ${this.char} `;
  }
}

/**
 * A relation (=, <, >, ≤, ≥, etc.).
 */
export class Relation extends MathSymbol {
  protected override cssClass = "aphelion-relation";

  constructor(char: string, latexCmd?: string, degradesTo?: string) {
    super(char, latexCmd, degradesTo);
  }

  override text(): string {
    return ` ${this.char} `;
  }

  /**
   * Create the degraded version of this relation.
   * Returns a Relation if possible, otherwise a MathSymbol.
   */
  override createDegraded(): MathSymbol | undefined {
    if (!this.degradesTo) return undefined;
    return new Relation(this.degradesTo);
  }
}

/**
 * Punctuation (comma, semicolon, etc.).
 */
export class Punctuation extends MathSymbol {
  protected override cssClass = "aphelion-punctuation";

  constructor(char: string) {
    super(char);
  }

  override text(): string {
    return this.char + " ";
  }
}

/**
 * Factory for creating common symbols.
 */
export const Symbols = {
  // Digits
  digit: (d: string) => new Digit(d),

  // Variables
  variable: (v: string) => new Variable(v),

  // Basic operators
  plus: () => new BinaryOperator("+"),
  minus: () => new BinaryOperator("−", "-"),
  times: () => new BinaryOperator("×", "\\times"),
  div: () => new BinaryOperator("÷", "\\div"),
  cdot: () => new BinaryOperator("·", "\\cdot"),
  pm: () => new BinaryOperator("±", "\\pm"),
  mp: () => new BinaryOperator("∓", "\\mp"),

  // Relations (with degradation support)
  equals: () => new Relation("="),
  lt: () => new Relation("<"),
  gt: () => new Relation(">"),
  leq: () => new Relation("≤", "\\leq", "<"),
  geq: () => new Relation("≥", "\\geq", ">"),
  neq: () => new Relation("≠", "\\neq", "="),
  approx: () => new Relation("≈", "\\approx"),
  equiv: () => new Relation("≡", "\\equiv"),
  sim: () => new Relation("∼", "\\sim"),

  // Greek letters
  alpha: () => new MathSymbol("α", "\\alpha"),
  beta: () => new MathSymbol("β", "\\beta"),
  gamma: () => new MathSymbol("γ", "\\gamma"),
  delta: () => new MathSymbol("δ", "\\delta"),
  epsilon: () => new MathSymbol("ε", "\\epsilon"),
  theta: () => new MathSymbol("θ", "\\theta"),
  lambda: () => new MathSymbol("λ", "\\lambda"),
  mu: () => new MathSymbol("μ", "\\mu"),
  pi: () => new MathSymbol("π", "\\pi"),
  sigma: () => new MathSymbol("σ", "\\sigma"),
  phi: () => new MathSymbol("φ", "\\phi"),
  omega: () => new MathSymbol("ω", "\\omega"),

  // Other symbols
  infty: () => new MathSymbol("∞", "\\infty"),
  partial: () => new MathSymbol("∂", "\\partial"),
  nabla: () => new MathSymbol("∇", "\\nabla"),
  forall: () => new MathSymbol("∀", "\\forall"),
  exists: () => new MathSymbol("∃", "\\exists"),
  emptyset: () => new MathSymbol("∅", "\\emptyset"),

  // Punctuation
  comma: () => new Punctuation(","),
  semicolon: () => new Punctuation(";"),
  colon: () => new Punctuation(":"),
};

/**
 * Create a symbol from a character.
 */
export function createSymbolFromChar(char: string): MathSymbol {
  if (char >= "0" && char <= "9") {
    return Symbols.digit(char);
  }
  if ((char >= "a" && char <= "z") || (char >= "A" && char <= "Z")) {
    return Symbols.variable(char);
  }

  switch (char) {
    case "+":
      return Symbols.plus();
    case "-":
      return Symbols.minus();
    case "*":
      return Symbols.cdot();
    case "/":
      return Symbols.div();
    case "=":
      return Symbols.equals();
    case "<":
      return Symbols.lt();
    case ">":
      return Symbols.gt();
    case ",":
      return Symbols.comma();
    case ";":
      return Symbols.semicolon();
    case ":":
      return Symbols.colon();
    default:
      return new MathSymbol(char);
  }
}
