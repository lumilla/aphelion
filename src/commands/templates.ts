/**
 * Aphelion - Structured CAS & Calculus Templates
 *
 * Dedicated multi-block interactive nodes for derivatives, definite/indefinite
 * integrals with differentials, summations/products with index & body,
 * limits with target & body, base-n logarithms, DMS (degrees/minutes/seconds),
 * and standalone base+exponent/subscript templates.
 */

import { NodeBase } from "../core/node";
import { InnerBlock } from "../core/blocks";
import { L, R } from "../core/types";

/**
 * Derivative template: \frac{d}{dx}(f), \frac{d^2}{dx^2}(f), \frac{d^n}{dx^n}(f)
 */
export class Derivative extends NodeBase {
  readonly order: 1 | 2 | "n";
  readonly orderBlock?: InnerBlock;
  readonly variable: InnerBlock;
  readonly body: InnerBlock;

  override horizontalBlockNav = true;

  constructor(order: 1 | 2 | "n" = 1) {
    super();
    this.order = order;
    this.variable = new InnerBlock();
    this.body = new InnerBlock();

    this.variable.parent = this;
    this.body.parent = this;

    if (order === "n") {
      const orderBlock = new InnerBlock();
      orderBlock.parent = this;
      this.orderBlock = orderBlock;

      this.ends[L] = orderBlock;
      this.ends[R] = this.body;

      orderBlock[R] = this.variable;
      this.variable[L] = orderBlock;
      this.variable[R] = this.body;
      this.body[L] = this.variable;
    } else {
      this.ends[L] = this.variable;
      this.ends[R] = this.body;

      this.variable[R] = this.body;
      this.body[L] = this.variable;
    }
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-derivative aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));
    return el;
  }

  latex(): string {
    const varLatex = this.variable.childrenLatex();
    const bodyLatex = this.body.childrenLatex();

    if (this.order === 1) {
      return `\\dfrac{d}{d${varLatex}}\\left(${bodyLatex}\\right)`;
    } else if (this.order === 2) {
      return `\\dfrac{d^{2}}{d${varLatex}^{2}}\\left(${bodyLatex}\\right)`;
    } else {
      const ordLatex = this.orderBlock?.childrenLatex() ?? "";
      return `\\dfrac{d^{${ordLatex}}}{d${varLatex}^{${ordLatex}}}\\left(${bodyLatex}\\right)`;
    }
  }

  text(): string {
    const varText = this.variable.text().trim() || "x";
    const bodyText = this.body.text().trim();

    if (this.order === 1) {
      return `diff(${bodyText}, ${varText})`;
    } else if (this.order === 2) {
      return `diff(${bodyText}, ${varText}, 2)`;
    } else {
      const ordText = this.orderBlock?.text().trim() || "1";
      return `diff(${bodyText}, ${varText}, ${ordText})`;
    }
  }

  override mathspeak(): string {
    return `derivative with respect to ${this.variable.mathspeak()} of ${this.body.mathspeak()}`;
  }

  updateDom(): void {
    const el = this.domElement;
    el.innerHTML = "";

    // Fraction part: d / d[var]
    const fracEl = document.createElement("span");
    fracEl.className = "aphelion-fraction aphelion-deriv-frac";

    const numEl = document.createElement("span");
    numEl.className = "aphelion-numerator";
    const dNum = document.createElement("span");
    dNum.className = "aphelion-deriv-d";
    dNum.textContent = "d";
    numEl.appendChild(dNum);

    if (this.order === 2) {
      const sup2 = document.createElement("sup");
      sup2.className = "aphelion-deriv-order";
      sup2.textContent = "2";
      numEl.appendChild(sup2);
    } else if (this.order === "n" && this.orderBlock) {
      const supN = document.createElement("sup");
      supN.className = "aphelion-deriv-order";
      this.orderBlock.updateDom();
      supN.appendChild(this.orderBlock.domElement);
      numEl.appendChild(supN);
    }

    const lineEl = document.createElement("span");
    lineEl.className = "aphelion-fraction-line";

    const denEl = document.createElement("span");
    denEl.className = "aphelion-denominator aphelion-deriv-den";
    const dDen = document.createElement("span");
    dDen.className = "aphelion-deriv-d";
    dDen.textContent = "d";
    denEl.appendChild(dDen);

    this.variable.updateDom();
    denEl.appendChild(this.variable.domElement);

    if (this.order === 2) {
      const sup2 = document.createElement("sup");
      sup2.className = "aphelion-deriv-order";
      sup2.textContent = "2";
      denEl.appendChild(sup2);
    } else if (this.order === "n" && this.orderBlock) {
      const supN = document.createElement("sup");
      supN.className = "aphelion-deriv-order-mirror";
      supN.textContent = this.orderBlock.text() || "n";
      denEl.appendChild(supN);
    }

    fracEl.appendChild(numEl);
    fracEl.appendChild(lineEl);
    fracEl.appendChild(denEl);

    // Body part: ( [body] )
    const bracketEl = document.createElement("span");
    bracketEl.className = "aphelion-bracket";

    const openEl = document.createElement("span");
    openEl.className = "aphelion-bracket-open aphelion-scaled";
    openEl.textContent = "(";

    const contentEl = document.createElement("span");
    contentEl.className = "aphelion-bracket-content";
    this.body.updateDom();
    contentEl.appendChild(this.body.domElement);

    const closeEl = document.createElement("span");
    closeEl.className = "aphelion-bracket-close aphelion-scaled";
    closeEl.textContent = ")";

    bracketEl.appendChild(openEl);
    bracketEl.appendChild(contentEl);
    bracketEl.appendChild(closeEl);

    el.appendChild(fracEl);
    el.appendChild(bracketEl);
  }
}

/**
 * Integral template with integrand and differential variable:
 * Definite: \int_{lower}^{upper} integrand \, d(variable)
 * Indefinite: \int integrand \, d(variable)
 */
export class IntegralTemplate extends NodeBase {
  readonly withLimits: boolean;
  readonly lower?: InnerBlock;
  readonly upper?: InnerBlock;
  readonly integrand: InnerBlock;
  readonly variable: InnerBlock;

  override horizontalBlockNav = true;

  constructor(withLimits: boolean = true) {
    super();
    this.withLimits = withLimits;
    this.integrand = new InnerBlock();
    this.variable = new InnerBlock();

    this.integrand.parent = this;
    this.variable.parent = this;

    if (withLimits) {
      const lower = new InnerBlock();
      const upper = new InnerBlock();
      lower.parent = this;
      upper.parent = this;

      this.lower = lower;
      this.upper = upper;

      this.ends[L] = lower;
      this.ends[R] = this.variable;

      lower[R] = upper;
      upper[L] = lower;
      upper[R] = this.integrand;
      this.integrand[L] = upper;
      this.integrand[R] = this.variable;
      this.variable[L] = this.integrand;
    } else {
      this.ends[L] = this.integrand;
      this.ends[R] = this.variable;

      this.integrand[R] = this.variable;
      this.variable[L] = this.integrand;
    }
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-integral-template aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));
    return el;
  }

  latex(): string {
    const intLatex = this.integrand.childrenLatex();
    const varLatex = this.variable.childrenLatex();

    if (this.withLimits && this.lower && this.upper) {
      const lowLatex = this.lower.childrenLatex();
      const upLatex = this.upper.childrenLatex();
      return `\\int_{${lowLatex}}^{${upLatex}}${intLatex}d${varLatex}`;
    }
    return `\\int ${intLatex}d${varLatex}`;
  }

  text(): string {
    const intText = this.integrand.text().trim();
    const varText = this.variable.text().trim() || "x";

    if (this.withLimits && this.lower && this.upper) {
      const lowText = this.lower.text().trim();
      const upText = this.upper.text().trim();
      return `int(${intText}, ${varText}, ${lowText}, ${upText})`;
    }
    return `int(${intText}, ${varText})`;
  }

  override mathspeak(): string {
    if (this.withLimits && this.lower && this.upper) {
      return `definite integral from ${this.lower.mathspeak()} to ${this.upper.mathspeak()} of ${this.integrand.mathspeak()} d ${this.variable.mathspeak()}`;
    }
    return `integral of ${this.integrand.mathspeak()} d ${this.variable.mathspeak()}`;
  }

  updateDom(): void {
    const el = this.domElement;
    el.innerHTML = "";

    const opWrapper = document.createElement("span");
    opWrapper.className = "aphelion-large-operator aphelion-integral-op";

    const symbolEl = document.createElement("span");
    symbolEl.className = "aphelion-operator-symbol";
    symbolEl.textContent = "∫";

    if (this.withLimits && this.lower && this.upper) {
      const limitsCol = document.createElement("span");
      limitsCol.className = "aphelion-integral-limits";

      const upperEl = document.createElement("span");
      upperEl.className = "aphelion-upper-limit";
      this.upper.updateDom();
      upperEl.appendChild(this.upper.domElement);

      const lowerEl = document.createElement("span");
      lowerEl.className = "aphelion-lower-limit";
      this.lower.updateDom();
      lowerEl.appendChild(this.lower.domElement);

      limitsCol.appendChild(upperEl);
      limitsCol.appendChild(lowerEl);

      opWrapper.appendChild(symbolEl);
      opWrapper.appendChild(limitsCol);
    } else {
      opWrapper.appendChild(symbolEl);
    }

    const bodyEl = document.createElement("span");
    bodyEl.className = "aphelion-integral-body";
    this.integrand.updateDom();
    bodyEl.appendChild(this.integrand.domElement);

    const diffEl = document.createElement("span");
    diffEl.className = "aphelion-integral-diff";
    const dSpan = document.createElement("span");
    dSpan.className = "aphelion-deriv-d";
    dSpan.textContent = "d";
    diffEl.appendChild(dSpan);

    this.variable.updateDom();
    diffEl.appendChild(this.variable.domElement);

    el.appendChild(opWrapper);
    el.appendChild(bodyEl);
    el.appendChild(diffEl);
  }
}

/**
 * Summation / Product template with variable, lower bound, upper bound, and body:
 * \sum_{variable=lower}^{upper} (body)
 * \prod_{variable=lower}^{upper} (body)
 */
export class SumProductTemplate extends NodeBase {
  readonly kind: "sum" | "prod";
  readonly variable: InnerBlock;
  readonly lower: InnerBlock;
  readonly upper: InnerBlock;
  readonly body: InnerBlock;

  override horizontalBlockNav = true;

  constructor(kind: "sum" | "prod" = "sum") {
    super();
    this.kind = kind;
    this.variable = new InnerBlock();
    this.lower = new InnerBlock();
    this.upper = new InnerBlock();
    this.body = new InnerBlock();

    this.variable.parent = this;
    this.lower.parent = this;
    this.upper.parent = this;
    this.body.parent = this;

    this.ends[L] = this.variable;
    this.ends[R] = this.body;

    this.variable[R] = this.lower;
    this.lower[L] = this.variable;
    this.lower[R] = this.upper;
    this.upper[L] = this.lower;
    this.upper[R] = this.body;
    this.body[L] = this.upper;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-sumprod-template aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));
    return el;
  }

  latex(): string {
    const cmd = this.kind === "sum" ? "\\sum" : "\\prod";
    const varLatex = this.variable.childrenLatex();
    const lowLatex = this.lower.childrenLatex();
    const upLatex = this.upper.childrenLatex();
    const bodyLatex = this.body.childrenLatex();
    return `${cmd}_{${varLatex}=${lowLatex}}^{${upLatex}}\\left(${bodyLatex}\\right)`;
  }

  text(): string {
    const fn = this.kind === "sum" ? "sum" : "product";
    const varText = this.variable.text().trim() || "x";
    const lowText = this.lower.text().trim() || "1";
    const upText = this.upper.text().trim() || "n";
    const bodyText = this.body.text().trim();
    return `${fn}(${bodyText}, ${varText}, ${lowText}, ${upText})`;
  }

  override mathspeak(): string {
    const name = this.kind === "sum" ? "summation" : "product";
    return `${name} for ${this.variable.mathspeak()} equals ${this.lower.mathspeak()} to ${this.upper.mathspeak()} of ${this.body.mathspeak()}`;
  }

  updateDom(): void {
    const el = this.domElement;
    el.innerHTML = "";

    const opContainer = document.createElement("span");
    opContainer.className = "aphelion-limits-container";

    const upperEl = document.createElement("span");
    upperEl.className = "aphelion-upper-limit";
    this.upper.updateDom();
    upperEl.appendChild(this.upper.domElement);

    const symbolEl = document.createElement("span");
    symbolEl.className = "aphelion-operator-symbol";
    symbolEl.textContent = this.kind === "sum" ? "∑" : "∏";

    const lowerEl = document.createElement("span");
    lowerEl.className = "aphelion-lower-limit aphelion-sum-lower";
    this.variable.updateDom();
    lowerEl.appendChild(this.variable.domElement);

    const eqSpan = document.createElement("span");
    eqSpan.className = "aphelion-sum-eq";
    eqSpan.textContent = "=";
    lowerEl.appendChild(eqSpan);

    this.lower.updateDom();
    lowerEl.appendChild(this.lower.domElement);

    opContainer.appendChild(upperEl);
    opContainer.appendChild(symbolEl);
    opContainer.appendChild(lowerEl);

    const bodyWrapper = document.createElement("span");
    bodyWrapper.className = "aphelion-bracket aphelion-sum-body";

    const openEl = document.createElement("span");
    openEl.className = "aphelion-bracket-open aphelion-scaled";
    openEl.textContent = "(";

    const contentEl = document.createElement("span");
    contentEl.className = "aphelion-bracket-content";
    this.body.updateDom();
    contentEl.appendChild(this.body.domElement);

    const closeEl = document.createElement("span");
    closeEl.className = "aphelion-bracket-close aphelion-scaled";
    closeEl.textContent = ")";

    bodyWrapper.appendChild(openEl);
    bodyWrapper.appendChild(contentEl);
    bodyWrapper.appendChild(closeEl);

    el.appendChild(opContainer);
    el.appendChild(bodyWrapper);
  }
}

/**
 * Limit template: \lim_{variable \to target} (body)
 */
export class LimitTemplate extends NodeBase {
  readonly variable: InnerBlock;
  readonly target: InnerBlock;
  readonly body: InnerBlock;

  override horizontalBlockNav = true;

  constructor() {
    super();
    this.variable = new InnerBlock();
    this.target = new InnerBlock();
    this.body = new InnerBlock();

    this.variable.parent = this;
    this.target.parent = this;
    this.body.parent = this;

    this.ends[L] = this.variable;
    this.ends[R] = this.body;

    this.variable[R] = this.target;
    this.target[L] = this.variable;
    this.target[R] = this.body;
    this.body[L] = this.target;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-limit-template aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));
    return el;
  }

  latex(): string {
    const varLatex = this.variable.childrenLatex();
    const targetLatex = this.target.childrenLatex();
    const bodyLatex = this.body.childrenLatex();
    return `\\lim_{${varLatex}\\to ${targetLatex}}\\left(${bodyLatex}\\right)`;
  }

  text(): string {
    const varText = this.variable.text().trim() || "x";
    const targetText = this.target.text().trim() || "0";
    const bodyText = this.body.text().trim();
    return `limit(${bodyText}, ${varText}, ${targetText})`;
  }

  override mathspeak(): string {
    return `limit as ${this.variable.mathspeak()} approaches ${this.target.mathspeak()} of ${this.body.mathspeak()}`;
  }

  updateDom(): void {
    const el = this.domElement;
    el.innerHTML = "";

    const opContainer = document.createElement("span");
    opContainer.className = "aphelion-limits-container";

    const nameEl = document.createElement("span");
    nameEl.className = "aphelion-operator-name";
    nameEl.textContent = "lim";

    const lowerEl = document.createElement("span");
    lowerEl.className = "aphelion-lower-limit aphelion-lim-lower";
    this.variable.updateDom();
    lowerEl.appendChild(this.variable.domElement);

    const arrowSpan = document.createElement("span");
    arrowSpan.className = "aphelion-lim-arrow";
    arrowSpan.textContent = "→";
    lowerEl.appendChild(arrowSpan);

    this.target.updateDom();
    lowerEl.appendChild(this.target.domElement);

    opContainer.appendChild(nameEl);
    opContainer.appendChild(lowerEl);

    const bodyWrapper = document.createElement("span");
    bodyWrapper.className = "aphelion-bracket aphelion-lim-body";

    const openEl = document.createElement("span");
    openEl.className = "aphelion-bracket-open aphelion-scaled";
    openEl.textContent = "(";

    const contentEl = document.createElement("span");
    contentEl.className = "aphelion-bracket-content";
    this.body.updateDom();
    contentEl.appendChild(this.body.domElement);

    const closeEl = document.createElement("span");
    closeEl.className = "aphelion-bracket-close aphelion-scaled";
    closeEl.textContent = ")";

    bodyWrapper.appendChild(openEl);
    bodyWrapper.appendChild(contentEl);
    bodyWrapper.appendChild(closeEl);

    el.appendChild(opContainer);
    el.appendChild(bodyWrapper);
  }
}

/**
 * Logarithm with base template: \log_{base}\left(argument\right)
 */
export class LogBase extends NodeBase {
  readonly base: InnerBlock;
  readonly argument: InnerBlock;

  override horizontalBlockNav = true;

  constructor() {
    super();
    this.base = new InnerBlock();
    this.argument = new InnerBlock();

    this.base.parent = this;
    this.argument.parent = this;

    this.ends[L] = this.base;
    this.ends[R] = this.argument;

    this.base[R] = this.argument;
    this.argument[L] = this.base;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-logbase aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));
    return el;
  }

  latex(): string {
    return `\\log_{${this.base.childrenLatex()}}\\left(${this.argument.childrenLatex()}\\right)`;
  }

  text(): string {
    const argText = this.argument.text().trim();
    const baseText = this.base.text().trim() || "10";
    return `logb(${argText}, ${baseText})`;
  }

  override mathspeak(): string {
    return `log base ${this.base.mathspeak()} of ${this.argument.mathspeak()}`;
  }

  updateDom(): void {
    const el = this.domElement;
    el.innerHTML = "";

    const logSpan = document.createElement("span");
    logSpan.className = "aphelion-operator-name";
    logSpan.textContent = "log";

    const subSpan = document.createElement("span");
    subSpan.className = "aphelion-supsub";
    const subInner = document.createElement("span");
    subInner.className = "aphelion-sub";
    this.base.updateDom();
    subInner.appendChild(this.base.domElement);
    subSpan.appendChild(subInner);

    const argWrapper = document.createElement("span");
    argWrapper.className = "aphelion-bracket";

    const openEl = document.createElement("span");
    openEl.className = "aphelion-bracket-open aphelion-scaled";
    openEl.textContent = "(";

    const contentEl = document.createElement("span");
    contentEl.className = "aphelion-bracket-content";
    this.argument.updateDom();
    contentEl.appendChild(this.argument.domElement);

    const closeEl = document.createElement("span");
    closeEl.className = "aphelion-bracket-close aphelion-scaled";
    closeEl.textContent = ")";

    argWrapper.appendChild(openEl);
    argWrapper.appendChild(contentEl);
    argWrapper.appendChild(closeEl);

    el.appendChild(logSpan);
    el.appendChild(subSpan);
    el.appendChild(argWrapper);
  }
}

/**
 * Degrees, Minutes, Seconds template: {deg}^\circ {min}' {sec}''
 */
export class DMS extends NodeBase {
  readonly degrees: InnerBlock;
  readonly minutes: InnerBlock;
  readonly seconds: InnerBlock;

  override horizontalBlockNav = true;

  constructor() {
    super();
    this.degrees = new InnerBlock();
    this.minutes = new InnerBlock();
    this.seconds = new InnerBlock();

    this.degrees.parent = this;
    this.minutes.parent = this;
    this.seconds.parent = this;

    this.ends[L] = this.degrees;
    this.ends[R] = this.seconds;

    this.degrees[R] = this.minutes;
    this.minutes[L] = this.degrees;
    this.minutes[R] = this.seconds;
    this.seconds[L] = this.minutes;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-dms aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));
    return el;
  }

  latex(): string {
    return `{${this.degrees.childrenLatex()}}^{\\circ}{${this.minutes.childrenLatex()}}^{\\prime}{${this.seconds.childrenLatex()}}^{\\prime\\prime}`;
  }

  text(): string {
    const d = this.degrees.text().trim() || "0";
    const m = this.minutes.text().trim() || "0";
    const s = this.seconds.text().trim() || "0";
    return `((${d})+(${m})/60+(${s})/3600)`;
  }

  override mathspeak(): string {
    return `${this.degrees.mathspeak()} degrees ${this.minutes.mathspeak()} minutes ${this.seconds.mathspeak()} seconds`;
  }

  updateDom(): void {
    const el = this.domElement;
    el.innerHTML = "";

    this.degrees.updateDom();
    el.appendChild(this.degrees.domElement);
    const degSym = document.createElement("span");
    degSym.className = "aphelion-dms-sym";
    degSym.textContent = "°";
    el.appendChild(degSym);

    this.minutes.updateDom();
    el.appendChild(this.minutes.domElement);
    const minSym = document.createElement("span");
    minSym.className = "aphelion-dms-sym";
    minSym.textContent = "′";
    el.appendChild(minSym);

    this.seconds.updateDom();
    el.appendChild(this.seconds.domElement);
    const secSym = document.createElement("span");
    secSym.className = "aphelion-dms-sym";
    secSym.textContent = "″";
    el.appendChild(secSym);
  }
}

/**
 * Base + Superscript template: {\square}^{\square}
 */
export class BaseSuperscript extends NodeBase {
  readonly base: InnerBlock;
  readonly sup: InnerBlock;

  override horizontalBlockNav = true;

  constructor() {
    super();
    this.base = new InnerBlock();
    this.sup = new InnerBlock();

    this.base.parent = this;
    this.sup.parent = this;

    this.ends[L] = this.base;
    this.ends[R] = this.sup;

    this.base[R] = this.sup;
    this.sup[L] = this.base;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-base-supsub aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));
    return el;
  }

  latex(): string {
    const b = this.base.childrenLatex();
    const s = this.sup.childrenLatex();
    return `{${b}}^{${s}}`;
  }

  text(): string {
    return `(${this.base.text()})^(${this.sup.text()})`;
  }

  override mathspeak(): string {
    return `${this.base.mathspeak()} to the power of ${this.sup.mathspeak()}`;
  }

  updateDom(): void {
    const el = this.domElement;
    el.innerHTML = "";

    this.base.updateDom();
    el.appendChild(this.base.domElement);

    const supWrap = document.createElement("span");
    supWrap.className = "aphelion-supsub aphelion-sup-only";
    const supEl = document.createElement("span");
    supEl.className = "aphelion-sup";
    this.sup.updateDom();
    supEl.appendChild(this.sup.domElement);
    supWrap.appendChild(supEl);

    el.appendChild(supWrap);
  }
}

/**
 * Base + Subscript template: {\square}_{\square}
 */
export class BaseSubscript extends NodeBase {
  readonly base: InnerBlock;
  readonly sub: InnerBlock;

  override horizontalBlockNav = true;

  constructor() {
    super();
    this.base = new InnerBlock();
    this.sub = new InnerBlock();

    this.base.parent = this;
    this.sub.parent = this;

    this.ends[L] = this.base;
    this.ends[R] = this.sub;

    this.base[R] = this.sub;
    this.sub[L] = this.base;
  }

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = "aphelion-base-supsub aphelion-non-leaf";
    el.setAttribute("data-mq-node-id", String(this.id));
    return el;
  }

  latex(): string {
    const b = this.base.childrenLatex();
    const s = this.sub.childrenLatex();
    return `{${b}}_{${s}}`;
  }

  text(): string {
    return `${this.base.text()}_${this.sub.text()}`;
  }

  override mathspeak(): string {
    return `${this.base.mathspeak()} subscript ${this.sub.mathspeak()}`;
  }

  updateDom(): void {
    const el = this.domElement;
    el.innerHTML = "";

    this.base.updateDom();
    el.appendChild(this.base.domElement);

    const subWrap = document.createElement("span");
    subWrap.className = "aphelion-supsub";
    const subEl = document.createElement("span");
    subEl.className = "aphelion-sub";
    this.sub.updateDom();
    subEl.appendChild(this.sub.domElement);
    subWrap.appendChild(subEl);

    el.appendChild(subWrap);
  }
}
