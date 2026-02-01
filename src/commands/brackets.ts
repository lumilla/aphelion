/**
 * Aphelion - Brackets and Parentheses
 *
 * Delimiters that auto-scale to their content.
 */

import { NodeBase } from '../core/node';
import { InnerBlock } from '../core/blocks';
import { L, R } from '../core/types';

/** Bracket types */
export type BracketType = '(' | ')' | '[' | ']' | '{' | '}' | '|' | '⟨' | '⟩';

/** Matching pairs */
const BRACKET_PAIRS: Record<string, string> = {
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '|': '|',
  '⟨': '⟩',
  '⟩': '⟨',
};

/** LaTeX commands for brackets */
const BRACKET_LATEX: Record<string, string> = {
  '(': '(',
  ')': ')',
  '[': '[',
  ']': ']',
  '{': '\\{',
  '}': '\\}',
  '|': '|',
  '⟨': '\\langle',
  '⟩': '\\rangle',
};

/**
 * A pair of matching brackets with content between them.
 */
export class Bracket extends NodeBase {
  /** The opening bracket character */
  readonly open: BracketType;

  /** The closing bracket character */
  readonly close: BracketType;

  /** The content between the brackets */
  readonly content: InnerBlock;

  constructor(open: BracketType, close?: BracketType) {
    super();
    this.open = open;
    this.close = (close ?? BRACKET_PAIRS[open] ?? open) as BracketType;
    this.content = new InnerBlock();
    this.content.parent = this;
    this.ends[L] = this.content;
    this.ends[R] = this.content;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'aphelion-bracket aphelion-non-leaf';
    el.setAttribute('data-mq-node-id', String(this.id));

    const openEl = document.createElement('span');
    openEl.className = 'aphelion-bracket-open aphelion-scaled';
    openEl.textContent = this.open;

    const contentEl = document.createElement('span');
    contentEl.className = 'aphelion-bracket-content';

    const closeEl = document.createElement('span');
    closeEl.className = 'aphelion-bracket-close aphelion-scaled';
    closeEl.textContent = this.close;

    el.appendChild(openEl);
    el.appendChild(contentEl);
    el.appendChild(closeEl);

    return el;
  }

  latex(): string {
    const content = this.content.childrenLatex();
    const openLatex = BRACKET_LATEX[this.open] ?? this.open;
    const closeLatex = BRACKET_LATEX[this.close] ?? this.close;
    return `\\left${openLatex}${content}\\right${closeLatex}`;
  }

  text(): string {
    return `${this.open}${this.content.text()}${this.close}`;
  }

  override mathspeak(): string {
    const openName = this.getBracketName(this.open, 'open');
    const closeName = this.getBracketName(this.close, 'close');
    return `${openName}, ${this.content.mathspeak()}, ${closeName}`;
  }

  private getBracketName(bracket: string, side: 'open' | 'close'): string {
    switch (bracket) {
      case '(':
      case ')':
        return `${side} parenthesis`;
      case '[':
      case ']':
        return `${side} bracket`;
      case '{':
      case '}':
        return `${side} brace`;
      case '|':
        return `${side === 'open' ? 'begin' : 'end'} absolute value`;
      case '⟨':
      case '⟩':
        return `${side} angle bracket`;
      default:
        return side;
    }
  }

  updateDom(): void {
    const el = this.domElement;
    const contentEl = el.querySelector(
      '.aphelion-bracket-content'
    ) as HTMLElement;

    contentEl.innerHTML = '';
    this.content.updateDom();
    contentEl.appendChild(this.content.domElement);

    // Scale brackets to match content height
    this.scaleBrackets();
  }

  /**
   * Scale brackets to match content height.
   */
  private scaleBrackets(): void {
    const contentEl = this.domElement.querySelector(
      '.aphelion-bracket-content'
    ) as HTMLElement;
    const openEl = this.domElement.querySelector(
      '.aphelion-bracket-open'
    ) as HTMLElement;
    const closeEl = this.domElement.querySelector(
      '.aphelion-bracket-close'
    ) as HTMLElement;

    if (contentEl && openEl && closeEl) {
      const height = contentEl.offsetHeight || 20;
      const scale = Math.max(1, height / 20);
      openEl.style.transform = `scaleY(${scale})`;
      closeEl.style.transform = `scaleY(${scale})`;
    }
  }

  override reflow(): void {
    this.scaleBrackets();
  }
}

/**
 * Parentheses ( )
 */
export class Parentheses extends Bracket {
  constructor() {
    super('(', ')');
  }
}

/**
 * Square brackets [ ]
 */
export class SquareBrackets extends Bracket {
  constructor() {
    super('[', ']');
  }
}

/**
 * Curly braces { }
 */
export class CurlyBraces extends Bracket {
  constructor() {
    super('{', '}');
  }
}

/**
 * Absolute value | |
 */
export class AbsoluteValue extends Bracket {
  constructor() {
    super('|', '|');
  }

  override latex(): string {
    return `\\left|${this.content.childrenLatex()}\\right|`;
  }

  override mathspeak(): string {
    return `absolute value of, ${this.content.mathspeak()}, end absolute value`;
  }
}

/**
 * Angle brackets ⟨ ⟩
 */
export class AngleBrackets extends Bracket {
  constructor() {
    super('⟨', '⟩');
  }
}
