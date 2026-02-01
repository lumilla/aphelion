/**
 * Aphelion - LaTeX Command Input
 *
 * Provides an input mode for typing LaTeX commands.
 * When user types '\', a command input box appears where they can
 * type a command name (like "frac", "sqrt", "alpha", etc.).
 * On Tab/Enter/Space, the command is rendered.
 */

import { NodeBase } from '../core/node';
import { InnerBlock } from '../core/blocks';
import { L, R, DirectionType } from '../core/types';

/**
 * LaTeX command input node.
 * Shows a backslash followed by an editable area for the command name.
 */
export class LatexCommandInput extends NodeBase {
  /** The block containing the command name being typed */
  readonly commandBlock: InnerBlock;

  /** Whether this command input has been finalized */
  private _finalized = false;

  constructor() {
    super();
    this.commandBlock = new InnerBlock();
    this.commandBlock.parent = this;
    this.ends[L] = this.commandBlock;
    this.ends[R] = this.commandBlock;
  }

  protected createDomElement(): HTMLElement {
    const wrapper = document.createElement('span');
    wrapper.className =
      'aphelion-latex-command-input-wrapper aphelion-non-leaf';
    wrapper.setAttribute('data-mq-node-id', String(this.id));

    const inner = document.createElement('span');
    inner.className = 'aphelion-latex-command-input aphelion-non-leaf';

    const backslash = document.createElement('span');
    backslash.className = 'aphelion-latex-command-backslash';
    backslash.textContent = '\\';

    const commandSpan = document.createElement('span');
    commandSpan.className = 'aphelion-latex-command-name';

    inner.appendChild(backslash);
    inner.appendChild(commandSpan);
    wrapper.appendChild(inner);

    return wrapper;
  }

  latex(): string {
    return '\\' + this.getCommandName() + ' ';
  }

  text(): string {
    return '\\' + this.getCommandName();
  }

  override mathspeak(): string {
    const cmdName = this.getCommandName();
    return cmdName ? `backslash ${cmdName}` : 'backslash';
  }

  updateDom(): void {
    const el = this.domElement;
    const commandSpan = el.querySelector(
      '.aphelion-latex-command-name'
    ) as HTMLElement;

    if (commandSpan) {
      commandSpan.innerHTML = '';
      this.commandBlock.updateDom();
      commandSpan.appendChild(this.commandBlock.domElement);
    }
  }

  /**
   * Get the current command name being typed.
   */
  getCommandName(): string {
    let name = '';
    for (const child of this.commandBlock.children()) {
      const text = child.text();
      name += text;
    }
    return name;
  }

  /**
   * Whether the command input is empty.
   */
  isEmpty(): boolean {
    return !this.commandBlock.hasChildren();
  }

  /**
   * Whether this command input has been finalized.
   */
  get finalized(): boolean {
    return this._finalized;
  }

  /**
   * Mark as finalized.
   */
  finalize(): void {
    this._finalized = true;
  }
}

/**
 * Map of LaTeX command names to their command objects.
 * This is used to look up what to create when a command is finalized.
 * Based on the comprehensive command list from original MathQuill.
 */
export const LATEX_COMMANDS: Record<
  string,
  {
    type:
      | 'fraction'
      | 'sqrt'
      | 'nthroot'
      | 'symbol'
      | 'operator'
      | 'brackets'
      | 'text'
      | 'style'
      | 'matrix'
      | 'accent'
      | 'textmode';
    args?: number;
    optArgs?: number;
    symbol?: string;
    latexCmd?: string;
    /** For symbols that should degrade on backspace (e.g., ≤ → <) */
    degradesTo?: string;
    /** For matrix commands: default number of rows */
    rows?: number;
    /** For matrix commands: default number of columns */
    cols?: number;
    /** For matrix commands: the bracket type */
    matrixType?:
      | 'matrix'
      | 'pmatrix'
      | 'bmatrix'
      | 'Bmatrix'
      | 'vmatrix'
      | 'Vmatrix';
    /** For accent commands: the combining character */
    accent?: string;
  }
> = {
  // ===========================================
  // FRACTIONS AND ROOTS
  // ===========================================
  frac: { type: 'fraction', args: 2 },
  dfrac: { type: 'fraction', args: 2 },
  tfrac: { type: 'fraction', args: 2 },
  cfrac: { type: 'fraction', args: 2 },
  sqrt: { type: 'sqrt', args: 1, optArgs: 1 },
  nthroot: { type: 'nthroot', args: 2 },
  cbrt: { type: 'nthroot', args: 1 },

  // ===========================================
  // GREEK LOWERCASE - COMPLETE SET
  // ===========================================
  alpha: { type: 'symbol', symbol: 'α', latexCmd: '\\alpha' },
  beta: { type: 'symbol', symbol: 'β', latexCmd: '\\beta' },
  gamma: { type: 'symbol', symbol: 'γ', latexCmd: '\\gamma' },
  delta: { type: 'symbol', symbol: 'δ', latexCmd: '\\delta' },
  epsilon: { type: 'symbol', symbol: 'ε', latexCmd: '\\epsilon' },
  varepsilon: { type: 'symbol', symbol: 'ε', latexCmd: '\\varepsilon' },
  zeta: { type: 'symbol', symbol: 'ζ', latexCmd: '\\zeta' },
  eta: { type: 'symbol', symbol: 'η', latexCmd: '\\eta' },
  theta: { type: 'symbol', symbol: 'θ', latexCmd: '\\theta' },
  vartheta: { type: 'symbol', symbol: 'ϑ', latexCmd: '\\vartheta' },
  iota: { type: 'symbol', symbol: 'ι', latexCmd: '\\iota' },
  kappa: { type: 'symbol', symbol: 'κ', latexCmd: '\\kappa' },
  varkappa: { type: 'symbol', symbol: 'ϰ', latexCmd: '\\varkappa' },
  lambda: { type: 'symbol', symbol: 'λ', latexCmd: '\\lambda' },
  mu: { type: 'symbol', symbol: 'μ', latexCmd: '\\mu' },
  nu: { type: 'symbol', symbol: 'ν', latexCmd: '\\nu' },
  xi: { type: 'symbol', symbol: 'ξ', latexCmd: '\\xi' },
  pi: { type: 'symbol', symbol: 'π', latexCmd: '\\pi' },
  varpi: { type: 'symbol', symbol: 'ϖ', latexCmd: '\\varpi' },
  rho: { type: 'symbol', symbol: 'ρ', latexCmd: '\\rho' },
  varrho: { type: 'symbol', symbol: 'ϱ', latexCmd: '\\varrho' },
  sigma: { type: 'symbol', symbol: 'σ', latexCmd: '\\sigma' },
  varsigma: { type: 'symbol', symbol: 'ς', latexCmd: '\\varsigma' },
  tau: { type: 'symbol', symbol: 'τ', latexCmd: '\\tau' },
  upsilon: { type: 'symbol', symbol: 'υ', latexCmd: '\\upsilon' },
  phi: { type: 'symbol', symbol: 'φ', latexCmd: '\\phi' },
  varphi: { type: 'symbol', symbol: 'ϕ', latexCmd: '\\varphi' },
  chi: { type: 'symbol', symbol: 'χ', latexCmd: '\\chi' },
  psi: { type: 'symbol', symbol: 'ψ', latexCmd: '\\psi' },
  omega: { type: 'symbol', symbol: 'ω', latexCmd: '\\omega' },
  digamma: { type: 'symbol', symbol: 'ϝ', latexCmd: '\\digamma' },
  kaoppa: { type: 'symbol', symbol: 'ϙ', latexCmd: '\\kaoppa' },
  koppa: { type: 'symbol', symbol: 'ϙ', latexCmd: '\\koppa' },
  stigma: { type: 'symbol', symbol: 'ϛ', latexCmd: '\\stigma' },
  sampi: { type: 'symbol', symbol: 'ϡ', latexCmd: '\\sampi' },

  // ===========================================
  // GREEK UPPERCASE - COMPLETE SET
  // ===========================================
  Alpha: { type: 'symbol', symbol: 'Α', latexCmd: '\\Alpha' },
  Beta: { type: 'symbol', symbol: 'Β', latexCmd: '\\Beta' },
  Gamma: { type: 'symbol', symbol: 'Γ', latexCmd: '\\Gamma' },
  Delta: { type: 'symbol', symbol: 'Δ', latexCmd: '\\Delta' },
  Epsilon: { type: 'symbol', symbol: 'Ε', latexCmd: '\\Epsilon' },
  Zeta: { type: 'symbol', symbol: 'Ζ', latexCmd: '\\Zeta' },
  Eta: { type: 'symbol', symbol: 'Η', latexCmd: '\\Eta' },
  Theta: { type: 'symbol', symbol: 'Θ', latexCmd: '\\Theta' },
  Varth: { type: 'symbol', symbol: 'Θ', latexCmd: '\\Varth' },
  Iota: { type: 'symbol', symbol: 'Ι', latexCmd: '\\Iota' },
  Kappa: { type: 'symbol', symbol: 'Κ', latexCmd: '\\Kappa' },
  Lambda: { type: 'symbol', symbol: 'Λ', latexCmd: '\\Lambda' },
  Mu: { type: 'symbol', symbol: 'Μ', latexCmd: '\\Mu' },
  Nu: { type: 'symbol', symbol: 'Ν', latexCmd: '\\Nu' },
  Xi: { type: 'symbol', symbol: 'Ξ', latexCmd: '\\Xi' },
  Omicron: { type: 'symbol', symbol: 'Ο', latexCmd: '\\Omicron' },
  Pi: { type: 'symbol', symbol: 'Π', latexCmd: '\\Pi' },
  Rho: { type: 'symbol', symbol: 'Ρ', latexCmd: '\\Rho' },
  Sigma: { type: 'symbol', symbol: 'Σ', latexCmd: '\\Sigma' },
  Tau: { type: 'symbol', symbol: 'Τ', latexCmd: '\\Tau' },
  Upsilon: { type: 'symbol', symbol: 'Υ', latexCmd: '\\Upsilon' },
  Phi: { type: 'symbol', symbol: 'Φ', latexCmd: '\\Phi' },
  Chi: { type: 'symbol', symbol: 'Χ', latexCmd: '\\Chi' },
  Psi: { type: 'symbol', symbol: 'Ψ', latexCmd: '\\Psi' },
  Omega: { type: 'symbol', symbol: 'Ω', latexCmd: '\\Omega' },

  // ===========================================
  // BINARY OPERATORS
  // ===========================================
  pm: { type: 'symbol', symbol: '±', latexCmd: '\\pm' },
  plusmn: { type: 'symbol', symbol: '±', latexCmd: '\\pm' },
  mp: { type: 'symbol', symbol: '∓', latexCmd: '\\mp' },
  times: { type: 'symbol', symbol: '×', latexCmd: '\\times' },
  div: { type: 'symbol', symbol: '÷', latexCmd: '\\div' },
  divideontimes: { type: 'symbol', symbol: '⋇', latexCmd: '\\divideontimes' },
  cdot: { type: 'symbol', symbol: '·', latexCmd: '\\cdot' },
  sdot: { type: 'symbol', symbol: '·', latexCmd: '\\cdot' },
  centerdot: { type: 'symbol', symbol: '·', latexCmd: '\\centerdot' },
  ast: { type: 'symbol', symbol: '∗', latexCmd: '\\ast' },
  star: { type: 'symbol', symbol: '⋆', latexCmd: '\\star' },
  circ: { type: 'symbol', symbol: '∘', latexCmd: '\\circ' },
  bullet: { type: 'symbol', symbol: '•', latexCmd: '\\bullet' },
  diamond: { type: 'symbol', symbol: '◇', latexCmd: '\\diamond' },
  Diamond: { type: 'symbol', symbol: '◇', latexCmd: '\\Diamond' },
  wr: { type: 'symbol', symbol: '≀', latexCmd: '\\wr' },
  wreath: { type: 'symbol', symbol: '≀', latexCmd: '\\wreath' },
  amalg: { type: 'symbol', symbol: '⨿', latexCmd: '\\amalg' },
  dotplus: { type: 'symbol', symbol: '∔', latexCmd: '\\dotplus' },
  dagger: { type: 'symbol', symbol: '†', latexCmd: '\\dagger' },
  ddagger: { type: 'symbol', symbol: '‡', latexCmd: '\\ddagger' },
  lhd: { type: 'symbol', symbol: '◁', latexCmd: '\\lhd' },
  rhd: { type: 'symbol', symbol: '▷', latexCmd: '\\rhd' },
  unlhd: { type: 'symbol', symbol: '⊴', latexCmd: '\\unlhd' },
  unrhd: { type: 'symbol', symbol: '⊵', latexCmd: '\\unrhd' },
  ltimes: { type: 'symbol', symbol: '⋉', latexCmd: '\\ltimes' },
  rtimes: { type: 'symbol', symbol: '⋊', latexCmd: '\\rtimes' },
  leftthreetimes: { type: 'symbol', symbol: '⋋', latexCmd: '\\leftthreetimes' },
  rightthreetimes: {
    type: 'symbol',
    symbol: '⋌',
    latexCmd: '\\rightthreetimes',
  },

  // ===========================================
  // RELATIONS (with degradation support)
  // ===========================================
  leq: { type: 'symbol', symbol: '≤', latexCmd: '\\leq', degradesTo: '<' },
  le: { type: 'symbol', symbol: '≤', latexCmd: '\\le', degradesTo: '<' },
  leqq: { type: 'symbol', symbol: '≦', latexCmd: '\\leqq' },
  geq: { type: 'symbol', symbol: '≥', latexCmd: '\\geq', degradesTo: '>' },
  ge: { type: 'symbol', symbol: '≥', latexCmd: '\\ge', degradesTo: '>' },
  geqq: { type: 'symbol', symbol: '≧', latexCmd: '\\geqq' },
  neq: { type: 'symbol', symbol: '≠', latexCmd: '\\neq', degradesTo: '=' },
  ne: { type: 'symbol', symbol: '≠', latexCmd: '\\ne', degradesTo: '=' },
  approx: { type: 'symbol', symbol: '≈', latexCmd: '\\approx' },
  napprox: { type: 'symbol', symbol: '≉', latexCmd: '\\napprox' },
  approxeq: { type: 'symbol', symbol: '≊', latexCmd: '\\approxeq' },
  equiv: { type: 'symbol', symbol: '≡', latexCmd: '\\equiv' },
  not: { type: 'symbol', symbol: '¬', latexCmd: '\\not' },
  sim: { type: 'symbol', symbol: '∼', latexCmd: '\\sim' },
  nsim: { type: 'symbol', symbol: '≁', latexCmd: '\\nsim' },
  backsim: { type: 'symbol', symbol: '∽', latexCmd: '\\backsim' },
  simeq: { type: 'symbol', symbol: '≃', latexCmd: '\\simeq' },
  cong: { type: 'symbol', symbol: '≅', latexCmd: '\\cong' },
  ncong: { type: 'symbol', symbol: '≆', latexCmd: '\\ncong' },
  approx2: { type: 'symbol', symbol: '≊', latexCmd: '\\approx2' },
  propto: { type: 'symbol', symbol: '∝', latexCmd: '\\propto' },
  varoplus: { type: 'symbol', symbol: '⊕', latexCmd: '\\varoplus' },
  shortmid: { type: 'symbol', symbol: '∣', latexCmd: '\\shortmid' },
  shortparallel: { type: 'symbol', symbol: '∥', latexCmd: '\\shortparallel' },
  between: { type: 'symbol', symbol: '≬', latexCmd: '\\between' },
  pitchfork: { type: 'symbol', symbol: '⋔', latexCmd: '\\pitchfork' },
  varpropto: { type: 'symbol', symbol: '∝', latexCmd: '\\varpropto' },
  blacktriangleleft: {
    type: 'symbol',
    symbol: '▪',
    latexCmd: '\\blacktriangleleft',
  },
  blacktriangleright: {
    type: 'symbol',
    symbol: '▪',
    latexCmd: '\\blacktriangleright',
  },
  ll: { type: 'symbol', symbol: '≪', latexCmd: '\\ll' },
  lll: { type: 'symbol', symbol: '⋘', latexCmd: '\\lll' },
  gg: { type: 'symbol', symbol: '≫', latexCmd: '\\gg' },
  ggg: { type: 'symbol', symbol: '⋙', latexCmd: '\\ggg' },
  prec: { type: 'symbol', symbol: '≺', latexCmd: '\\prec' },
  succ: { type: 'symbol', symbol: '≻', latexCmd: '\\succ' },
  preceq: { type: 'symbol', symbol: '⪯', latexCmd: '\\preceq' },
  succeq: { type: 'symbol', symbol: '⪰', latexCmd: '\\succeq' },
  precneqq: { type: 'symbol', symbol: '⪵', latexCmd: '\\precneqq' },
  succneqq: { type: 'symbol', symbol: '⪶', latexCmd: '\\succneqq' },
  preceqq: { type: 'symbol', symbol: '⪷', latexCmd: '\\preceqq' },
  succeqq: { type: 'symbol', symbol: '⪸', latexCmd: '\\succeqq' },
  precapprox: { type: 'symbol', symbol: '⪹', latexCmd: '\\precapprox' },
  succapprox: { type: 'symbol', symbol: '⪺', latexCmd: '\\succapprox' },
  precnapprox: { type: 'symbol', symbol: '⪻', latexCmd: '\\precnapprox' },
  succnapprox: { type: 'symbol', symbol: '⪼', latexCmd: '\\succnapprox' },
  subsetneq: { type: 'symbol', symbol: '⊊', latexCmd: '\\subsetneq' },
  supsetneq: { type: 'symbol', symbol: '⊋', latexCmd: '\\supsetneq' },
  mid: { type: 'symbol', symbol: '∣', latexCmd: '\\mid' },
  nmid: { type: 'symbol', symbol: '∤', latexCmd: '\\nmid' },
  bowtie: { type: 'symbol', symbol: '⋈', latexCmd: '\\bowtie' },
  models: { type: 'symbol', symbol: '⊧', latexCmd: '\\models' },
  vdash: { type: 'symbol', symbol: '⊢', latexCmd: '\\vdash' },
  dashv: { type: 'symbol', symbol: '⊣', latexCmd: '\\dashv' },
  Vdash: { type: 'symbol', symbol: '⊨', latexCmd: '\\Vdash' },
  Dashv: { type: 'symbol', symbol: '⊫', latexCmd: '\\Dashv' },
  vDash: { type: 'symbol', symbol: '⊫', latexCmd: '\\vDash' },
  nvdash: { type: 'symbol', symbol: '⊬', latexCmd: '\\nvdash' },
  nVdash: { type: 'symbol', symbol: '⊭', latexCmd: '\\nVdash' },
  nvDash: { type: 'symbol', symbol: '⊭', latexCmd: '\\nvDash' },
  nVDash: { type: 'symbol', symbol: '⊮', latexCmd: '\\nVDash' },
  perp: { type: 'symbol', symbol: '⊥', latexCmd: '\\perp' },
  parallel: { type: 'symbol', symbol: '∥', latexCmd: '\\parallel' },
  nparallel: { type: 'symbol', symbol: '∦', latexCmd: '\\nparallel' },
  asymp: { type: 'symbol', symbol: '≍', latexCmd: '\\asymp' },
  doteq: { type: 'symbol', symbol: '≐', latexCmd: '\\doteq' },
  eqcirc: { type: 'symbol', symbol: '≖', latexCmd: '\\eqcirc' },
  risingdotseq: { type: 'symbol', symbol: '≓', latexCmd: '\\risingdotseq' },
  fallingdotseq: { type: 'symbol', symbol: '≒', latexCmd: '\\fallingdotseq' },
  colonapprox: { type: 'symbol', symbol: '∶≈', latexCmd: '\\colonapprox' },

  // ===========================================
  // SET THEORY
  // ===========================================
  subset: { type: 'symbol', symbol: '⊂', latexCmd: '\\subset' },
  supset: { type: 'symbol', symbol: '⊃', latexCmd: '\\supset' },
  subseteq: { type: 'symbol', symbol: '⊆', latexCmd: '\\subseteq' },
  supseteq: { type: 'symbol', symbol: '⊇', latexCmd: '\\supseteq' },
  nsubseteq: { type: 'symbol', symbol: '⊈', latexCmd: '\\nsubseteq' },
  nsupseteq: { type: 'symbol', symbol: '⊉', latexCmd: '\\nsupseteq' },
  sqsubset: { type: 'symbol', symbol: '⊏', latexCmd: '\\sqsubset' },
  sqsupset: { type: 'symbol', symbol: '⊐', latexCmd: '\\sqsupset' },
  sqsubseteq: { type: 'symbol', symbol: '⊑', latexCmd: '\\sqsubseteq' },
  sqsupseteq: { type: 'symbol', symbol: '⊒', latexCmd: '\\sqsupseteq' },
  in: { type: 'symbol', symbol: '∈', latexCmd: '\\in' },
  ni: { type: 'symbol', symbol: '∋', latexCmd: '\\ni' },
  notin: { type: 'symbol', symbol: '∉', latexCmd: '\\notin' },
  notni: { type: 'symbol', symbol: '∌', latexCmd: '\\notni' },
  cup: { type: 'symbol', symbol: '∪', latexCmd: '\\cup' },
  cap: { type: 'symbol', symbol: '∩', latexCmd: '\\cap' },
  sqcup: { type: 'symbol', symbol: '⊔', latexCmd: '\\sqcup' },
  sqcap: { type: 'symbol', symbol: '⊓', latexCmd: '\\sqcap' },
  uplus: { type: 'symbol', symbol: '⊎', latexCmd: '\\uplus' },
  setminus: { type: 'symbol', symbol: '∖', latexCmd: '\\setminus' },
  smallsetminus: { type: 'symbol', symbol: '∖', latexCmd: '\\smallsetminus' },
  emptyset: { type: 'symbol', symbol: '∅', latexCmd: '\\emptyset' },
  varnothing: { type: 'symbol', symbol: '∅', latexCmd: '\\varnothing' },
  dotsb: { type: 'symbol', symbol: '⋯', latexCmd: '\\dotsb' },
  dotsc: { type: 'symbol', symbol: '⋯', latexCmd: '\\dotsc' },
  dotsi: { type: 'symbol', symbol: '⋯', latexCmd: '\\dotsi' },
  dotsm: { type: 'symbol', symbol: '⋯', latexCmd: '\\dotsm' },
  dotso: { type: 'symbol', symbol: '⋯', latexCmd: '\\dotso' },

  // ===========================================
  // LOGIC
  // ===========================================
  land: { type: 'symbol', symbol: '∧', latexCmd: '\\land' },
  wedge: { type: 'symbol', symbol: '∧', latexCmd: '\\wedge' },
  lor: { type: 'symbol', symbol: '∨', latexCmd: '\\lor' },
  vee: { type: 'symbol', symbol: '∨', latexCmd: '\\vee' },
  lnot: { type: 'symbol', symbol: '¬', latexCmd: '\\lnot' },
  neg: { type: 'symbol', symbol: '¬', latexCmd: '\\neg' },
  forall: { type: 'symbol', symbol: '∀', latexCmd: '\\forall' },
  exists: { type: 'symbol', symbol: '∃', latexCmd: '\\exists' },
  nexists: { type: 'symbol', symbol: '∄', latexCmd: '\\nexists' },
  top: { type: 'symbol', symbol: '⊤', latexCmd: '\\top' },
  bot: { type: 'symbol', symbol: '⊥', latexCmd: '\\bot' },
  varprod: { type: 'symbol', symbol: '⊓', latexCmd: '\\varprod' },

  // ===========================================
  // CALCULUS / ANALYSIS
  // ===========================================
  partial: { type: 'symbol', symbol: '∂', latexCmd: '\\partial' },
  nabla: { type: 'symbol', symbol: '∇', latexCmd: '\\nabla' },
  del: { type: 'symbol', symbol: '∇', latexCmd: '\\nabla' },
  infty: { type: 'symbol', symbol: '∞', latexCmd: '\\infty' },
  aleph: { type: 'symbol', symbol: 'ℵ', latexCmd: '\\aleph' },
  beth: { type: 'symbol', symbol: 'ℶ', latexCmd: '\\beth' },
  gimel: { type: 'symbol', symbol: 'ℷ', latexCmd: '\\gimel' },
  daleth: { type: 'symbol', symbol: 'ℸ', latexCmd: '\\daleth' },

  // ===========================================
  // NUMBER SETS (BLACKBOARD BOLD)
  // ===========================================
  N: { type: 'symbol', symbol: 'ℕ', latexCmd: '\\mathbb{N}' },
  Z: { type: 'symbol', symbol: 'ℤ', latexCmd: '\\mathbb{Z}' },
  Q: { type: 'symbol', symbol: 'ℚ', latexCmd: '\\mathbb{Q}' },
  R: { type: 'symbol', symbol: 'ℝ', latexCmd: '\\mathbb{R}' },
  C: { type: 'symbol', symbol: 'ℂ', latexCmd: '\\mathbb{C}' },
  H: { type: 'symbol', symbol: 'ℍ', latexCmd: '\\mathbb{H}' },
  P: { type: 'symbol', symbol: 'ℙ', latexCmd: '\\mathbb{P}' },
  naturals: { type: 'symbol', symbol: 'ℕ', latexCmd: '\\mathbb{N}' },
  integers: { type: 'symbol', symbol: 'ℤ', latexCmd: '\\mathbb{Z}' },
  rationals: { type: 'symbol', symbol: 'ℚ', latexCmd: '\\mathbb{Q}' },
  reals: { type: 'symbol', symbol: 'ℝ', latexCmd: '\\mathbb{R}' },
  complex: { type: 'symbol', symbol: 'ℂ', latexCmd: '\\mathbb{C}' },

  // ===========================================
  // ARROWS
  // ===========================================
  to: { type: 'symbol', symbol: '→', latexCmd: '\\to' },
  gets: { type: 'symbol', symbol: '←', latexCmd: '\\gets' },
  rightarrow: { type: 'symbol', symbol: '→', latexCmd: '\\rightarrow' },
  leftarrow: { type: 'symbol', symbol: '←', latexCmd: '\\leftarrow' },
  leftrightarrow: { type: 'symbol', symbol: '↔', latexCmd: '\\leftrightarrow' },
  longrightarrow: { type: 'symbol', symbol: '⟶', latexCmd: '\\longrightarrow' },
  longleftarrow: { type: 'symbol', symbol: '⟵', latexCmd: '\\longleftarrow' },
  longleftrightarrow: {
    type: 'symbol',
    symbol: '⟷',
    latexCmd: '\\longleftrightarrow',
  },
  Rightarrow: { type: 'symbol', symbol: '⇒', latexCmd: '\\Rightarrow' },
  Leftarrow: { type: 'symbol', symbol: '⇐', latexCmd: '\\Leftarrow' },
  Leftrightarrow: { type: 'symbol', symbol: '⇔', latexCmd: '\\Leftrightarrow' },
  Longrightarrow: { type: 'symbol', symbol: '⟹', latexCmd: '\\Longrightarrow' },
  Longleftarrow: { type: 'symbol', symbol: '⟸', latexCmd: '\\Longleftarrow' },
  Longleftrightarrow: {
    type: 'symbol',
    symbol: '⟺',
    latexCmd: '\\Longleftrightarrow',
  },
  implies: { type: 'symbol', symbol: '⇒', latexCmd: '\\Rightarrow' },
  uparrow: { type: 'symbol', symbol: '↑', latexCmd: '\\uparrow' },
  downarrow: { type: 'symbol', symbol: '↓', latexCmd: '\\downarrow' },
  updownarrow: { type: 'symbol', symbol: '↕', latexCmd: '\\updownarrow' },
  Uparrow: { type: 'symbol', symbol: '⇑', latexCmd: '\\Uparrow' },
  Downarrow: { type: 'symbol', symbol: '⇓', latexCmd: '\\Downarrow' },
  Updownarrow: { type: 'symbol', symbol: '⇕', latexCmd: '\\Updownarrow' },
  mapsto: { type: 'symbol', symbol: '↦', latexCmd: '\\mapsto' },
  longmapsto: { type: 'symbol', symbol: '⟼', latexCmd: '\\longmapsto' },
  hookleftarrow: { type: 'symbol', symbol: '↩', latexCmd: '\\hookleftarrow' },
  hookrightarrow: { type: 'symbol', symbol: '↪', latexCmd: '\\hookrightarrow' },
  nearrow: { type: 'symbol', symbol: '↗', latexCmd: '\\nearrow' },
  searrow: { type: 'symbol', symbol: '↘', latexCmd: '\\searrow' },
  swarrow: { type: 'symbol', symbol: '↙', latexCmd: '\\swarrow' },
  nwarrow: { type: 'symbol', symbol: '↖', latexCmd: '\\nwarrow' },
  rightharpoonup: { type: 'symbol', symbol: '⇀', latexCmd: '\\rightharpoonup' },
  rightharpoondown: {
    type: 'symbol',
    symbol: '⇁',
    latexCmd: '\\rightharpoondown',
  },
  leftharpoonup: { type: 'symbol', symbol: '↼', latexCmd: '\\leftharpoonup' },
  leftharpoondown: {
    type: 'symbol',
    symbol: '↽',
    latexCmd: '\\leftharpoondown',
  },
  rightleftharpoons: {
    type: 'symbol',
    symbol: '⇌',
    latexCmd: '\\rightleftharpoons',
  },
  leftrightharpoons: {
    type: 'symbol',
    symbol: '⇋',
    latexCmd: '\\leftrightharpoons',
  },
  twoheadleftarrow: {
    type: 'symbol',
    symbol: '↞',
    latexCmd: '\\twoheadleftarrow',
  },
  twoheadrightarrow: {
    type: 'symbol',
    symbol: '↠',
    latexCmd: '\\twoheadrightarrow',
  },
  curvearrowright: {
    type: 'symbol',
    symbol: '↷',
    latexCmd: '\\curvearrowright',
  },
  curvearrowleft: { type: 'symbol', symbol: '↶', latexCmd: '\\curvearrowleft' },
  circlearrowleft: {
    type: 'symbol',
    symbol: '↺',
    latexCmd: '\\circlearrowleft',
  },
  circlearrowright: {
    type: 'symbol',
    symbol: '↻',
    latexCmd: '\\circlearrowright',
  },

  // ===========================================
  // MISC SYMBOLS
  // ===========================================
  ldots: { type: 'symbol', symbol: '…', latexCmd: '\\ldots' },
  cdots: { type: 'symbol', symbol: '⋯', latexCmd: '\\cdots' },
  vdots: { type: 'symbol', symbol: '⋮', latexCmd: '\\vdots' },
  ddots: { type: 'symbol', symbol: '⋱', latexCmd: '\\ddots' },
  qdots: { type: 'symbol', symbol: '⋰', latexCmd: '\\qdots' },
  dots: { type: 'symbol', symbol: '…', latexCmd: '\\dots' },
  angle: { type: 'symbol', symbol: '∠', latexCmd: '\\angle' },
  measuredangle: { type: 'symbol', symbol: '∡', latexCmd: '\\measuredangle' },
  sphericalangle: { type: 'symbol', symbol: '∢', latexCmd: '\\sphericalangle' },
  triangle: { type: 'symbol', symbol: '△', latexCmd: '\\triangle' },
  triangledown: { type: 'symbol', symbol: '▽', latexCmd: '\\triangledown' },
  square: { type: 'symbol', symbol: '□', latexCmd: '\\square' },
  filledbox: { type: 'symbol', symbol: '■', latexCmd: '\\filledbox' },
  therefore: { type: 'symbol', symbol: '∴', latexCmd: '\\therefore' },
  because: { type: 'symbol', symbol: '∵', latexCmd: '\\because' },
  degree: { type: 'symbol', symbol: '°', latexCmd: '\\degree' },
  deg: { type: 'operator', symbol: 'deg', latexCmd: '\\deg' },
  prime: { type: 'symbol', symbol: '′', latexCmd: '\\prime' },
  doubleprime: { type: 'symbol', symbol: '″', latexCmd: '\\doubleprime' },
  trippleprime: { type: 'symbol', symbol: '‴', latexCmd: '\\trippleprime' },
  backprime: { type: 'symbol', symbol: '‵', latexCmd: '\\backprime' },
  hbar: { type: 'symbol', symbol: 'ℏ', latexCmd: '\\hbar' },
  hslash: { type: 'symbol', symbol: 'ℏ', latexCmd: '\\hslash' },
  ell: { type: 'symbol', symbol: 'ℓ', latexCmd: '\\ell' },
  wp: { type: 'symbol', symbol: '℘', latexCmd: '\\wp' },
  weierstrass: { type: 'symbol', symbol: '℘', latexCmd: '\\weierstrass' },
  surd: { type: 'symbol', symbol: '√', latexCmd: '\\surd' },
  flat: { type: 'symbol', symbol: '♭', latexCmd: '\\flat' },
  natural: { type: 'symbol', symbol: '♮', latexCmd: '\\natural' },
  sharp: { type: 'symbol', symbol: '♯', latexCmd: '\\sharp' },
  clubsuit: { type: 'symbol', symbol: '♣', latexCmd: '\\clubsuit' },
  diamondsuit: { type: 'symbol', symbol: '♢', latexCmd: '\\diamondsuit' },
  heartsuit: { type: 'symbol', symbol: '♡', latexCmd: '\\heartsuit' },
  spadesuit: { type: 'symbol', symbol: '♠', latexCmd: '\\spadesuit' },
  pounds: { type: 'symbol', symbol: '£', latexCmd: '\\pounds' },
  euro: { type: 'symbol', symbol: '€', latexCmd: '\\euro' },
  yen: { type: 'symbol', symbol: '¥', latexCmd: '\\yen' },
  checkmark: { type: 'symbol', symbol: '✓', latexCmd: '\\checkmark' },
  maltese: { type: 'symbol', symbol: '✠', latexCmd: '\\maltese' },
  sun: { type: 'symbol', symbol: '☉', latexCmd: '\\sun' },
  star2: { type: 'symbol', symbol: '⋆', latexCmd: '\\star' },
  lightning: { type: 'symbol', symbol: '⚡', latexCmd: '\\lightning' },
  lozenge: { type: 'symbol', symbol: '◇', latexCmd: '\\lozenge' },
  blacklozenge: { type: 'symbol', symbol: '◆', latexCmd: '\\blacklozenge' },

  // ===========================================
  // CIRCLED/BOXED OPERATORS
  // ===========================================
  oplus: { type: 'symbol', symbol: '⊕', latexCmd: '\\oplus' },
  ominus: { type: 'symbol', symbol: '⊖', latexCmd: '\\ominus' },
  otimes: { type: 'symbol', symbol: '⊗', latexCmd: '\\otimes' },
  oslash: { type: 'symbol', symbol: '⊘', latexCmd: '\\oslash' },
  odot: { type: 'symbol', symbol: '⊙', latexCmd: '\\odot' },
  circledast: { type: 'symbol', symbol: '⊛', latexCmd: '\\circledast' },
  circledcirc: { type: 'symbol', symbol: '⊚', latexCmd: '\\circledcirc' },
  circleddash: { type: 'symbol', symbol: '⊝', latexCmd: '\\circleddash' },
  boxplus: { type: 'symbol', symbol: '⊞', latexCmd: '\\boxplus' },
  boxminus: { type: 'symbol', symbol: '⊟', latexCmd: '\\boxminus' },
  boxtimes: { type: 'symbol', symbol: '⊠', latexCmd: '\\boxtimes' },
  boxdot: { type: 'symbol', symbol: '⊡', latexCmd: '\\boxdot' },

  // ===========================================
  // DELIMITERS
  // ===========================================
  langle: { type: 'symbol', symbol: '⟨', latexCmd: '\\langle' },
  rangle: { type: 'symbol', symbol: '⟩', latexCmd: '\\rangle' },
  lceil: { type: 'symbol', symbol: '⌈', latexCmd: '\\lceil' },
  rceil: { type: 'symbol', symbol: '⌉', latexCmd: '\\rceil' },
  lfloor: { type: 'symbol', symbol: '⌊', latexCmd: '\\lfloor' },
  rfloor: { type: 'symbol', symbol: '⌋', latexCmd: '\\rfloor' },
  lbrace: { type: 'symbol', symbol: '{', latexCmd: '\\lbrace' },
  rbrace: { type: 'symbol', symbol: '}', latexCmd: '\\rbrace' },
  lbrack: { type: 'symbol', symbol: '[', latexCmd: '\\lbrack' },
  rbrack: { type: 'symbol', symbol: ']', latexCmd: '\\rbrack' },
  vert: { type: 'symbol', symbol: '|', latexCmd: '\\vert' },
  Vert: { type: 'symbol', symbol: '‖', latexCmd: '\\Vert' },
  backslash: { type: 'symbol', symbol: '\\', latexCmd: '\\backslash' },
  ulcorner: { type: 'symbol', symbol: '⌜', latexCmd: '\\ulcorner' },
  urcorner: { type: 'symbol', symbol: '⌝', latexCmd: '\\urcorner' },
  llcorner: { type: 'symbol', symbol: '⌞', latexCmd: '\\llcorner' },
  lrcorner: { type: 'symbol', symbol: '⌟', latexCmd: '\\lrcorner' },

  // ===========================================
  // TRIGONOMETRIC FUNCTIONS
  // ===========================================
  sin: { type: 'operator', symbol: 'sin', latexCmd: '\\sin' },
  cos: { type: 'operator', symbol: 'cos', latexCmd: '\\cos' },
  tan: { type: 'operator', symbol: 'tan', latexCmd: '\\tan' },
  cot: { type: 'operator', symbol: 'cot', latexCmd: '\\cot' },
  sec: { type: 'operator', symbol: 'sec', latexCmd: '\\sec' },
  csc: { type: 'operator', symbol: 'csc', latexCmd: '\\csc' },
  arcsin: { type: 'operator', symbol: 'arcsin', latexCmd: '\\arcsin' },
  arccos: { type: 'operator', symbol: 'arccos', latexCmd: '\\arccos' },
  arctan: { type: 'operator', symbol: 'arctan', latexCmd: '\\arctan' },
  arccot: { type: 'operator', symbol: 'arccot', latexCmd: '\\arccot' },
  arcsec: { type: 'operator', symbol: 'arcsec', latexCmd: '\\arcsec' },
  arccsc: { type: 'operator', symbol: 'arccsc', latexCmd: '\\arccsc' },
  sinh: { type: 'operator', symbol: 'sinh', latexCmd: '\\sinh' },
  cosh: { type: 'operator', symbol: 'cosh', latexCmd: '\\cosh' },
  tanh: { type: 'operator', symbol: 'tanh', latexCmd: '\\tanh' },
  coth: { type: 'operator', symbol: 'coth', latexCmd: '\\coth' },
  sech: { type: 'operator', symbol: 'sech', latexCmd: '\\sech' },
  csch: { type: 'operator', symbol: 'csch', latexCmd: '\\csch' },
  asinh: { type: 'operator', symbol: 'asinh', latexCmd: '\\asinh' },
  acosh: { type: 'operator', symbol: 'acosh', latexCmd: '\\acosh' },
  atanh: { type: 'operator', symbol: 'atanh', latexCmd: '\\atanh' },
  arcsinh: { type: 'operator', symbol: 'arcsinh', latexCmd: '\\arcsinh' },
  arccosh: { type: 'operator', symbol: 'arccosh', latexCmd: '\\arccosh' },
  arctanh: { type: 'operator', symbol: 'arctanh', latexCmd: '\\arctanh' },

  // ===========================================
  // LOGARITHMS AND EXPONENTIALS
  // ===========================================
  log: { type: 'operator', symbol: 'log', latexCmd: '\\log' },
  lg: { type: 'operator', symbol: 'lg', latexCmd: '\\lg' },
  lb: { type: 'operator', symbol: 'lb', latexCmd: '\\lb' },
  ln: { type: 'operator', symbol: 'ln', latexCmd: '\\ln' },
  lnag: { type: 'operator', symbol: 'log', latexCmd: '\\log' },
  logb: { type: 'operator', symbol: 'log', latexCmd: '\\log' },
  exp: { type: 'operator', symbol: 'exp', latexCmd: '\\exp' },

  // ===========================================
  // LIMITS AND SUCH
  // ===========================================
  lim: { type: 'operator', symbol: 'lim', latexCmd: '\\lim' },
  liminf: { type: 'operator', symbol: 'lim inf', latexCmd: '\\liminf' },
  limsup: { type: 'operator', symbol: 'lim sup', latexCmd: '\\limsup' },
  min: { type: 'operator', symbol: 'min', latexCmd: '\\min' },
  max: { type: 'operator', symbol: 'max', latexCmd: '\\max' },
  sup: { type: 'operator', symbol: 'sup', latexCmd: '\\sup' },
  inf: { type: 'operator', symbol: 'inf', latexCmd: '\\inf' },
  injlim: { type: 'operator', symbol: 'inj lim', latexCmd: '\\injlim' },
  projlim: { type: 'operator', symbol: 'proj lim', latexCmd: '\\projlim' },

  // ===========================================
  // LINEAR ALGEBRA / MATRICES
  // ===========================================
  det: { type: 'operator', symbol: 'det', latexCmd: '\\det' },
  dim: { type: 'operator', symbol: 'dim', latexCmd: '\\dim' },
  ker: { type: 'operator', symbol: 'ker', latexCmd: '\\ker' },
  hom: { type: 'operator', symbol: 'hom', latexCmd: '\\hom' },
  Hom: { type: 'operator', symbol: 'Hom', latexCmd: '\\Hom' },
  rank: { type: 'operator', symbol: 'rank', latexCmd: '\\rank' },
  trace: { type: 'operator', symbol: 'tr', latexCmd: '\\trace' },
  tr: { type: 'operator', symbol: 'tr', latexCmd: '\\tr' },
  norm: { type: 'operator', symbol: 'norm', latexCmd: '\\norm' },

  // ===========================================
  // OTHER FUNCTIONS
  // ===========================================
  arg: { type: 'operator', symbol: 'arg', latexCmd: '\\arg' },
  gcd: { type: 'operator', symbol: 'gcd', latexCmd: '\\gcd' },
  lcm: { type: 'operator', symbol: 'lcm', latexCmd: '\\lcm' },
  mod: { type: 'operator', symbol: 'mod', latexCmd: '\\mod' },
  Pr: { type: 'operator', symbol: 'Pr', latexCmd: '\\Pr' },
  sign: { type: 'operator', symbol: 'sign', latexCmd: '\\sign' },
  sgn: { type: 'operator', symbol: 'sgn', latexCmd: '\\sgn' },
  abs: { type: 'operator', symbol: 'abs', latexCmd: '\\abs' },
  real: { type: 'operator', symbol: 'Re', latexCmd: '\\real' },
  image: { type: 'operator', symbol: 'Im', latexCmd: '\\image' },
  conj: { type: 'operator', symbol: 'conj', latexCmd: '\\conj' },
  // ===========================================
  // LARGE OPERATORS
  // ===========================================
  sum: { type: 'operator', symbol: '∑', latexCmd: '\\sum' },
  prod: { type: 'operator', symbol: '∏', latexCmd: '\\prod' },
  coprod: { type: 'operator', symbol: '∐', latexCmd: '\\coprod' },
  int: { type: 'operator', symbol: '∫', latexCmd: '\\int' },
  oint: { type: 'operator', symbol: '∮', latexCmd: '\\oint' },
  iint: { type: 'operator', symbol: '∬', latexCmd: '\\iint' },
  iiint: { type: 'operator', symbol: '∭', latexCmd: '\\iiint' },
  intop: { type: 'operator', symbol: '∫', latexCmd: '\\intop' },
  smallint: { type: 'operator', symbol: '∫', latexCmd: '\\smallint' },
  bigcup: { type: 'operator', symbol: '⋃', latexCmd: '\\bigcup' },
  bigcap: { type: 'operator', symbol: '⋂', latexCmd: '\\bigcap' },
  bigsqcup: { type: 'operator', symbol: '⨆', latexCmd: '\\bigsqcup' },
  bigvee: { type: 'operator', symbol: '⋁', latexCmd: '\\bigvee' },
  bigwedge: { type: 'operator', symbol: '⋀', latexCmd: '\\bigwedge' },
  bigodot: { type: 'operator', symbol: '⨀', latexCmd: '\\bigodot' },
  bigotimes: { type: 'operator', symbol: '⨂', latexCmd: '\\bigotimes' },
  bigoplus: { type: 'operator', symbol: '⨁', latexCmd: '\\bigoplus' },
  biguplus: { type: 'operator', symbol: '⨄', latexCmd: '\\biguplus' },

  // ===========================================
  // SPECIAL SPACING
  // ===========================================
  quad: { type: 'symbol', symbol: '\u2003', latexCmd: '\\quad' },
  qquad: { type: 'symbol', symbol: '\u2003\u2003', latexCmd: '\\qquad' },
  // Thin space
  ',': { type: 'symbol', symbol: '\u2009', latexCmd: '\\,' },
  thinspace: { type: 'symbol', symbol: '\u2009', latexCmd: '\\thinspace' },
  // Medium space
  ':': { type: 'symbol', symbol: '\u205F', latexCmd: '\\:' },
  medspace: { type: 'symbol', symbol: '\u205F', latexCmd: '\\medspace' },
  // Thick space
  ';': { type: 'symbol', symbol: '\u2004', latexCmd: '\\;' },
  thickspace: { type: 'symbol', symbol: '\u2004', latexCmd: '\\thickspace' },
  // Negative thin space
  '!': { type: 'symbol', symbol: '\u200B', latexCmd: '\\!' },
  // Non-breaking space
  '~': { type: 'symbol', symbol: '\u00A0', latexCmd: '\\~' },
  nbsp: { type: 'symbol', symbol: '\u00A0', latexCmd: '\\nbsp' },
  // Regular space
  ' ': { type: 'symbol', symbol: ' ', latexCmd: '\\ ' },

  // ===========================================
  // ACCENTS AND DECORATIONS
  // ===========================================
  vec: { type: 'accent', accent: '⃗', latexCmd: '\\vec', args: 1 },
  bar: { type: 'accent', accent: '̄', latexCmd: '\\bar', args: 1 },
  overline: { type: 'accent', accent: '̄', latexCmd: '\\overline', args: 1 },
  underline: { type: 'accent', accent: '̲', latexCmd: '\\underline', args: 1 },
  hat: { type: 'accent', accent: '̂', latexCmd: '\\hat', args: 1 },
  widehat: { type: 'accent', accent: '̂', latexCmd: '\\widehat', args: 1 },
  tilde: { type: 'accent', accent: '̃', latexCmd: '\\tilde', args: 1 },
  widetilde: { type: 'accent', accent: '̃', latexCmd: '\\widetilde', args: 1 },
  dot: { type: 'accent', accent: '̇', latexCmd: '\\dot', args: 1 },
  ddot: { type: 'accent', accent: '̈', latexCmd: '\\ddot', args: 1 },
  dddot: { type: 'accent', accent: '⃛', latexCmd: '\\dddot', args: 1 },
  acute: { type: 'accent', accent: '́', latexCmd: '\\acute', args: 1 },
  grave: { type: 'accent', accent: '̀', latexCmd: '\\grave', args: 1 },
  breve: { type: 'accent', accent: '̆', latexCmd: '\\breve', args: 1 },
  check: { type: 'accent', accent: '̌', latexCmd: '\\check', args: 1 },
  mathring: { type: 'accent', accent: '̊', latexCmd: '\\mathring', args: 1 },
  smile: { type: 'accent', accent: '⌣', latexCmd: '\\smile', args: 1 },
  frown: { type: 'accent', accent: '⌢', latexCmd: '\\frown', args: 1 },

  // ===========================================
  // SPECIAL LOGOS
  // ===========================================
  LaTeX: { type: 'symbol', symbol: 'LaTeX', latexCmd: '\\LaTeX' },
  TeX: { type: 'symbol', symbol: 'TeX', latexCmd: '\\TeX' },

  // ===========================================
  // MATRICES
  // ===========================================
  matrix: { type: 'matrix', matrixType: 'matrix', rows: 2, cols: 2 },
  pmatrix: { type: 'matrix', matrixType: 'pmatrix', rows: 2, cols: 2 },
  bmatrix: { type: 'matrix', matrixType: 'bmatrix', rows: 2, cols: 2 },
  Bmatrix: { type: 'matrix', matrixType: 'Bmatrix', rows: 2, cols: 2 },
  vmatrix: { type: 'matrix', matrixType: 'vmatrix', rows: 2, cols: 2 },
  Vmatrix: { type: 'matrix', matrixType: 'Vmatrix', rows: 2, cols: 2 },

  // ===========================================
  // TEXT MODE
  // ===========================================
  text: { type: 'textmode', args: 1, latexCmd: '\\text' },
  textrm: { type: 'textmode', args: 1, latexCmd: '\\textrm' },
  textit: { type: 'textmode', args: 1, latexCmd: '\\textit' },
  textbf: { type: 'textmode', args: 1, latexCmd: '\\textbf' },
  textsf: { type: 'textmode', args: 1, latexCmd: '\\textsf' },
  texttt: { type: 'textmode', args: 1, latexCmd: '\\texttt' },
  mathrm: { type: 'textmode', args: 1, latexCmd: '\\mathrm' },
  mathit: { type: 'textmode', args: 1, latexCmd: '\\mathit' },
  mathbf: { type: 'textmode', args: 1, latexCmd: '\\mathbf' },
  mathsf: { type: 'textmode', args: 1, latexCmd: '\\mathsf' },
  mathtt: { type: 'textmode', args: 1, latexCmd: '\\mathtt' },
  mathcal: { type: 'textmode', args: 1, latexCmd: '\\mathcal' },
  mathfrak: { type: 'textmode', args: 1, latexCmd: '\\mathfrak' },
  mathbb: { type: 'textmode', args: 1, latexCmd: '\\mathbb' },
  mathscr: { type: 'textmode', args: 1, latexCmd: '\\mathscr' },
};
