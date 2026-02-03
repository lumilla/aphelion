# StaticMath API

StaticMath is a read-only math display component.

## Creating StaticMath

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const element = document.createElement("div");

const staticMath = AP.StaticMath(element);
assert(staticMath !== null, "Should create instance");
assert(typeof staticMath.latex === "function", "Should have latex method");
assert(staticMath.el() === element, "Should reference element");
```

## Methods

### `el()`

Get the container element.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const container = document.createElement("div");
const sm = AP.StaticMath(container);

const element = sm.el();
assert(element === container, "Should return container");
assert(element instanceof HTMLElement, "Should be an HTMLElement");
```

---

### `latex()`

Get the current LaTeX content.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const sm = AP.StaticMath(document.createElement("div"));

sm.latex("e^{i\\pi} + 1 = 0");
const content = sm.latex();

assert(typeof content === "string", "Should return string");
assert(content.includes("pi"), "Should contain pi");
assert(content.includes("e"), "Should contain e");
assert(content.includes("1"), "Should contain 1");
```

---

### `latex(value)`

Set the LaTeX content. Returns `this` for chaining.

| Parameter | Type     | Description             |
| --------- | -------- | ----------------------- |
| `value`   | `string` | LaTeX string to display |

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const sm = AP.StaticMath(document.createElement("div"));

sm.latex("\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}");
assert(sm.latex().includes("sum"), "Should set content");
assert(sm.latex().includes("frac"), "Should contain fraction");
assert(sm.latex().includes("n"), "Should contain n");
```

---

### `html()`

Get the rendered HTML content.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const sm = AP.StaticMath(document.createElement("div"));

sm.latex("\\frac{a}{b}");
const html = sm.html();

assert(typeof html === "string", "Should return HTML");
assert(html.length > 0, "Should have content");
```

---

### `reflow()`

Recalculate layout. Returns `this` for chaining.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const sm = AP.StaticMath(document.createElement("div"));

sm.latex("\\frac{1}{2}").reflow();

console.log("Layout recalculated");
```

## StaticMath vs MathField

| Feature        | StaticMath | MathField |
| -------------- | ---------- | --------- |
| Editable       | ❌         | ✅        |
| Cursor         | ❌         | ✅        |
| Focus/Blur     | ❌         | ✅        |
| Event Handlers | Limited    | Full      |
| Use Case       | Display    | Input     |

## Examples

### Display Famous Equations

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);

const equations = [
  { name: "Euler's Identity", latex: "e^{i\\pi} + 1 = 0" },
  { name: "Pythagorean Theorem", latex: "a^2 + b^2 = c^2" },
  {
    name: "Quadratic Formula",
    latex: "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}",
  },
  { name: "Einstein's Mass-Energy", latex: "E = mc^2" },
];

equations.forEach((eq) => {
  const container = document.createElement("div");
  const sm = AP.StaticMath(container);
  sm.latex(eq.latex);
  console.log(`${eq.name}:`, sm.latex());
});
```

### Dynamic Updates

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const container = document.createElement("div");
const staticMath = AP.StaticMath(container);

// Update based on user selection
function showFormula(formulaType) {
  const formulas = {
    integral: "\\int_a^b f(x) dx",
    derivative: "\\frac{d}{dx} f(x)",
    limit: "\\lim_{x \\to \\infty} f(x)",
  };

  const formula = formulas[formulaType] || "";
  staticMath.latex(formula);
  assert(staticMath.latex().length > 0, "Formula should be set");
}

showFormula("integral");
```

## Configuration

StaticMath has limited configuration:

```typescript doctest
interface AphelionStaticConfig {
  mouseEvents?: boolean;
}

assert(typeof AphelionStaticConfig, "Should define config interface");
```

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const staticMath = AP.StaticMath(document.createElement("div"), {
  mouseEvents: false, // Disable mouse event handling
});

assert(staticMath !== null, "StaticMath should be created with config");
```
