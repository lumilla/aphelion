# LaTeX Commands

Aphelion supports a good subset of LaTeX commands for mathematical notation.

## Fractions and Roots

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

// Fractions
mf.latex("\\frac{a}{b}");
assert(mf.latex().includes("frac"), "Should support fractions");
assert(mf.latex().includes("a"), "Should contain numerator");

// Square root
mf.latex("\\sqrt{x}");
assert(mf.latex().includes("sqrt"), "Should support sqrt");

// N-th root
mf.latex("\\sqrt[3]{x}");
assert(mf.latex().includes("sqrt"), "Should support nth root");
assert(mf.latex().includes("3"), "Should contain index");
```

Supported commands: `\frac{a}{b}`, `\sqrt{x}`, `\sqrt[n]{x}`, `\dfrac{a}{b}`, `\tfrac{a}{b}`.

## Superscripts and Subscripts

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

// Superscript
mf.latex("x^{2}");
assert(mf.latex().includes("^"), "Should support superscript");
assert(mf.latex().includes("x"), "Should contain x");

// Subscript
mf.latex("x_{n}");
assert(mf.latex().includes("_"), "Should support subscript");
assert(mf.latex().includes("n"), "Should contain n");

// Both
mf.latex("x_{n}^{2}");
assert(
  mf.latex().includes("^") && mf.latex().includes("_"),
  "Should support both",
);
assert(mf.latex().includes("2"), "Should contain 2");
```

## Greek Letters

### Lowercase Greek

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

const lowercase = [
  "alpha",
  "beta",
  "gamma",
  "delta",
  "epsilon",
  "zeta",
  "eta",
  "theta",
  "iota",
  "kappa",
  "lambda",
  "mu",
  "nu",
  "xi",
  "pi",
  "rho",
  "sigma",
  "tau",
  "upsilon",
  "phi",
  "chi",
  "psi",
  "omega",
];

mf.latex("\\alpha + \\beta + \\gamma");
assert(mf.latex().includes("alpha"), "Should support Greek letters");
assert(mf.latex().includes("beta"), "Should contain beta");
assert(mf.latex().includes("gamma"), "Should contain gamma");
```

### Uppercase Greek

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

const uppercase = [
  "Gamma",
  "Delta",
  "Theta",
  "Lambda",
  "Xi",
  "Pi",
  "Sigma",
  "Upsilon",
  "Phi",
  "Psi",
  "Omega",
];

mf.latex("\\Gamma + \\Delta + \\Omega");
assert(mf.latex().includes("Gamma"), "Should support uppercase Greek");
assert(mf.latex().includes("Delta"), "Should contain Delta");
assert(mf.latex().includes("Omega"), "Should contain Omega");
```

### Variant Forms

Variant forms like `\varepsilon`, `\vartheta`, `\varphi`, `\varrho` and `\varsigma` are supported.

## Operators

### Binary Operators

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("a \\pm b \\mp c");
const latex1 = mf.latex();
assert(latex1.includes("pm"), "Should support plus-minus");
assert(latex1.includes("mp"), "Should support minus-plus");

mf.latex("a \\times b \\div c");
const latex2 = mf.latex();
assert(latex2.includes("times"), "Should support times");

mf.latex("a \\cdot b");
assert(mf.latex().includes("cdot"), "Should support dot product");
```

Supported operators include `\pm`, `\mp`, `\times`, `\div`, `\cdot`, `\ast`, `\star`, `\circ` and `\bullet`.

### Large Operators

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

// Summation
mf.latex("\\sum_{i=1}^{n} i");
assert(mf.latex().includes("sum"), "Should support sum");
assert(mf.latex().includes("i"), "Should contain variable");

// Product
mf.latex("\\prod_{i=1}^{n} i");
assert(mf.latex().includes("prod"), "Should support product");

// Integral
mf.latex("\\int_{0}^{\\infty} e^{-x} dx");
assert(mf.latex().includes("int"), "Should support integral");
assert(mf.latex().includes("infty"), "Should contain infinity");
```

Full list:

- `\sum` - Summation
- `\prod` - Product
- `\coprod` - Coproduct
- `\int` - Integral
- `\iint` - Double integral
- `\iiint` - Triple integral
- `\oint` - Contour integral
- `\bigcup` - Union
- `\bigcap` - Intersection
- `\bigoplus` - Direct sum
- `\bigotimes` - Tensor product

## Relations

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("a \\leq b \\geq c");
assert(mf.latex().includes("leq"), "Should support less-or-equal");

mf.latex("a \\neq b");
assert(mf.latex().includes("neq"), "Should support not-equal");

mf.latex("a \\approx b");
assert(mf.latex().includes("approx"), "Should support approx");

mf.latex("a \\equiv b");
assert(mf.latex().includes("equiv"), "Should support equiv");

mf.latex("a \\subset b \\supset c");
assert(mf.latex().includes("subset"), "Should support subset");

mf.latex("a \\in b \\ni c");
assert(mf.latex().includes("in"), "Should support in");
```

Supported relations:

- `\leq`, `\geq` - Less/greater than or equal
- `\neq` - Not equal
- `\approx` - Approximately equal
- `\equiv` - Equivalent
- `\sim` - Similar
- `\subset`, `\supset` - Subset, superset
- `\subseteq`, `\supseteq` - Subset/superset or equal
- `\in`, `\ni` - Element of
- `\notin` - Not element of

## Brackets and Delimiters

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("\\left( x \\right)");
mf.latex("\\left[ x \\right]");
mf.latex("\\left\\{ x \\right\\}");
mf.latex("\\left| x \\right|");
mf.latex("\\left\\langle x \\right\\rangle");
```

## Accents and Decorations

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("\\hat{x}");
mf.latex("\\bar{x}");
mf.latex("\\vec{x}");
mf.latex("\\dot{x}");
mf.latex("\\ddot{x}");
mf.latex("\\tilde{x}");
mf.latex("\\overline{abc}");
mf.latex("\\underline{abc}");
mf.latex("\\overbrace{abc}");
mf.latex("\\underbrace{abc}");
```

## Text Modes

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("\\text{if } x > 0");
mf.latex("\\mathbf{bold}");
mf.latex("\\mathit{italic}");
mf.latex("\\mathcal{CALLIGRAPHIC}");
mf.latex("\\mathbb{BLACKBOARD}");
mf.latex("\\mathfrak{Fraktur}");
```

Supported:

- `\text{...}` - Normal text
- `\mathbf{...}` - Bold
- `\mathit{...}` - Italic
- `\mathrm{...}` - Roman
- `\mathsf{...}` - Sans-serif
- `\mathtt{...}` - Typewriter
- `\mathcal{...}` - Calligraphic
- `\mathbb{...}` - Blackboard bold
- `\mathfrak{...}` - Fraktur

## Matrices

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

// Various matrix styles
mf.latex("\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}");
assert(mf.latex().includes("pmatrix"), "Should support pmatrix");
```

Matrix types:

- `pmatrix` - Parentheses: (a b; c d)
- `bmatrix` - Brackets: [a b; c d]
- `Bmatrix` - Braces: {a b; c d}
- `vmatrix` - Vertical bars: |a b; c d|
- `Vmatrix` - Double vertical bars: ‖a b; c d‖

## Special Symbols

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("\\infty");
mf.latex("\\partial");
mf.latex("\\nabla");
mf.latex("\\forall");
mf.latex("\\exists");
mf.latex("\\emptyset");
mf.latex("\\aleph");
```

Common symbols:

- `\infty` - Infinity (∞)
- `\partial` - Partial derivative (∂)
- `\nabla` - Nabla/del (∇)
- `\forall` - For all (∀)
- `\exists` - Exists (∃)
- `\nexists` - Does not exist (∄)
- `\emptyset` - Empty set (∅)
- `\aleph` - Aleph (ℵ)
- `\hbar` - h-bar (ℏ)
- `\ell` - Script l (ℓ)
- `\Re`, `\Im` - Real/Imaginary parts
