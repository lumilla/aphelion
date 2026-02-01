/**
 * Aphelion - Accent Commands
 *
 * Implements accent commands like \vec, \bar, \hat, \tilde, etc.
 */

import { NodeBase } from '../core/node';
import { InnerBlock } from '../core/blocks';
import { L, R } from '../core/types';

/**
 * An accent node that places an accent mark over content.
 */
export class Accent extends NodeBase {
  /** The content under the accent */
  readonly content: InnerBlock;

  /** The accent character (combining character) */
  readonly accent: string;

  /** The LaTeX command name */
  readonly latexCmd: string;

  constructor(accent: string, latexCmd: string) {
    super();
    this.accent = accent;
    this.latexCmd = latexCmd;
    this.content = new InnerBlock();
    this.content.parent = this;
    this.ends[L] = this.content;
    this.ends[R] = this.content;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'aphelion-accent aphelion-non-leaf';
    el.setAttribute('data-mq-node-id', String(this.id));

    const wrapper = document.createElement('span');
    wrapper.className = 'aphelion-accent-wrapper';

    const accentMark = document.createElement('span');
    accentMark.className = 'aphelion-accent-mark';
    accentMark.textContent = this.getDisplayAccent();

    const contentEl = document.createElement('span');
    contentEl.className = 'aphelion-accent-content';

    wrapper.appendChild(accentMark);
    wrapper.appendChild(contentEl);
    el.appendChild(wrapper);

    return el;
  }

  /**
   * Get a display-friendly accent character.
   */
  private getDisplayAccent(): string {
    // Map combining characters to display versions for visibility
    const displayMap: Record<string, string> = {
      '\u20d7': '→', // vec arrow
      '\u0304': '―', // overline/bar
      '\u0302': '^', // hat
      '\u0303': '~', // tilde
      '\u0307': '·', // dot
      '\u0308': '¨', // ddot
      '\u20db': '⋯', // dddot
      '\u0301': '´', // acute
      '\u0300': '`', // grave
      '\u0306': '˘', // breve
      '\u030c': 'ˇ', // check
      '\u030a': '°', // ring
      '\u0332': '_', // underline
    };
    return displayMap[this.accent] || this.accent;
  }

  latex(): string {
    return `${this.latexCmd}{${this.content.childrenLatex()}}`;
  }

  text(): string {
    return this.content.text();
  }

  override mathspeak(): string {
    const accentNames: Record<string, string> = {
      '\u20d7': 'vector',
      '\u0304': 'bar',
      '\u0302': 'hat',
      '\u0303': 'tilde',
      '\u0307': 'dot',
      '\u0308': 'double dot',
      '\u20db': 'triple dot',
      '\u0301': 'acute',
      '\u0300': 'grave',
      '\u0306': 'breve',
      '\u030c': 'check',
      '\u030a': 'ring',
      '\u0332': 'underline',
    };
    const name = accentNames[this.accent] || 'accent';
    return `${this.content.mathspeak()} ${name}`;
  }

  updateDom(): void {
    const el = this.domElement;
    const contentEl = el.querySelector(
      '.aphelion-accent-content'
    ) as HTMLElement;

    contentEl.innerHTML = '';
    this.content.updateDom();
    contentEl.appendChild(this.content.domElement);
  }
}

/**
 * A text mode node for \text, \mathrm, etc.
 * Renders content in upright (non-italic) text.
 */
export class TextMode extends NodeBase {
  /** The content */
  readonly content: InnerBlock;

  /** The LaTeX command name */
  readonly latexCmd: string;

  /** The CSS class for styling */
  readonly styleClass: string;

  /** Whether to auto-exit after one character (for mathbb, mathcal, etc.) */
  readonly autoExitAfterOne: boolean;

  constructor(latexCmd: string) {
    super();
    this.latexCmd = latexCmd;
    this.content = new InnerBlock();
    this.content.parent = this;
    this.ends[L] = this.content;
    this.ends[R] = this.content;

    // Determine style class based on command
    const styleMap: Record<string, string> = {
      '\\text': 'aphelion-text',
      '\\textrm': 'aphelion-text',
      '\\textit': 'aphelion-text-italic',
      '\\textbf': 'aphelion-text-bold',
      '\\textsf': 'aphelion-text-sans',
      '\\texttt': 'aphelion-text-mono',
      '\\mathrm': 'aphelion-mathrm',
      '\\mathit': 'aphelion-mathit',
      '\\mathbf': 'aphelion-mathbf',
      '\\mathsf': 'aphelion-mathsf',
      '\\mathtt': 'aphelion-mathtt',
      '\\mathcal': 'aphelion-mathcal',
      '\\mathfrak': 'aphelion-mathfrak',
      '\\mathbb': 'aphelion-mathbb',
      '\\mathscr': 'aphelion-mathscr',
    };
    this.styleClass = styleMap[latexCmd] || 'aphelion-text';

    // These text modes should auto-exit after one character
    const autoExitModes = ['\\mathbb', '\\mathcal', '\\mathfrak', '\\mathscr'];
    this.autoExitAfterOne = autoExitModes.includes(latexCmd);
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement('span');
    el.className = `aphelion-textmode ${this.styleClass} aphelion-non-leaf`;
    el.setAttribute('data-mq-node-id', String(this.id));

    const contentEl = document.createElement('span');
    contentEl.className = 'aphelion-textmode-content';
    el.appendChild(contentEl);

    return el;
  }

  latex(): string {
    return `${this.latexCmd}{${this.content.childrenLatex()}}`;
  }

  text(): string {
    return this.content.text();
  }

  override mathspeak(): string {
    return this.content.mathspeak();
  }

  updateDom(): void {
    const el = this.domElement;
    const contentEl = el.querySelector(
      '.aphelion-textmode-content'
    ) as HTMLElement;

    contentEl.innerHTML = '';
    this.content.updateDom();
    contentEl.appendChild(this.content.domElement);
  }
}
