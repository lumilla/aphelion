# MathField API

The MathField is the main editable math input component.

## Creating a MathField

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const element = document.createElement("div");

const mathField = AP.MathField(element, {
  handlers: {
    edit: (mf) => console.log("Changed"),
  },
});
assert(mathField !== null, "Should create instance");
assert(typeof mathField.latex === "function", "Should have latex method");
assert(mathField.el() === element, "Should reference element");
```

## Methods

### `el()`

Get the container element.

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const container = document.createElement("div");
const mf = AP.MathField(container);

const element = mf.el();
assert(element === container, "Should return container");
assert(element.nodeType === 1, "Should be an HTMLElement");
```

---

### `latex()`

Get the current LaTeX content.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("\\frac{a}{b}");
const content = mf.latex();

assert(typeof content === "string", "Should return string");
assert(content.includes("frac"), "Should contain frac");
assert(content.includes("a"), "Should contain a");
assert(content.includes("b"), "Should contain b");
```

---

### `latex(value)`

Set the LaTeX content. Returns `this` for chaining.

| Parameter | Type     | Description         |
| --------- | -------- | ------------------- |
| `value`   | `string` | LaTeX string to set |

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

// Chainable
const result = mf.latex("x^2").focus();
assert(mf.latex().includes("^"), "Should set content");
assert(result === mf, "Should return this for chaining");
```

---

### `text()`

Get plain text representation.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("x^{2}");
const text = mf.text();

assert(typeof text === "string", "Should return string");
assert(text.length > 0, "Should have content");
```

---

### `html()`

Get the rendered HTML content.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("\\frac{1}{2}");
const html = mf.html();

assert(typeof html === "string", "Should return HTML string");
assert(html.length > 0, "Should have content");
assert(html.includes("</"), "Should contain HTML tags");
```

---

### `focus()`

Focus the math field. Returns `this` for chaining.

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const container = document.createElement("div");
document.body.appendChild(container);
const mf = AP.MathField(container);

const result = mf.focus();
document.body.removeChild(container);
assert(result === mf, "Should return this for chaining");
```

---

### `blur()`

Remove focus from the math field. Returns `this` for chaining.

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

const result = mf.blur();
assert(result === mf, "Should return this for chaining");
```

---

### `write(latex)`

Write LaTeX at the current cursor position. Returns `this` for chaining.

| Parameter | Type     | Description     |
| --------- | -------- | --------------- |
| `latex`   | `string` | LaTeX to insert |

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

const result = mf.latex("a +").moveToRightEnd().write(" b");
assert(mf.latex().includes("a"), "Should contain a");
assert(mf.latex().includes("b"), "Should contain b");
assert(result === mf, "Should return this for chaining");
```

---

### `cmd(command)`

Execute a command (insert a command structure). Returns `this` for chaining.

| Parameter | Type     | Description                     |
| --------- | -------- | ------------------------------- |
| `command` | `string` | Command like `\\frac`, `\\sqrt` |

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

const result = mf.cmd("\\frac");
mf.typedText("1");
mf.keystroke("Tab");
mf.typedText("2");
assert(mf.latex().includes("frac"), "Should insert fraction");
assert(mf.latex().includes("1"), "Should contain 1");
assert(result === mf, "Should return this for chaining");
```

---

### `select()`

Select all content. Returns `this` for chaining.

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("x + y");
const result = mf.select();
assert(result === mf, "Should return this for chaining");
```

---

### `clearSelection()`

Clear the current selection. Returns `this` for chaining.

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

const result = mf.latex("x + y").select().clearSelection();
assert(result === mf, "Should return this for chaining");
```

---

### `moveToLeftEnd()`

Move cursor to the start. Returns `this` for chaining.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

const result = mf.latex("abc").moveToLeftEnd();
assert(result === mf, "Should return this for chaining");
assert(mf.latex().includes("a"), "Content should be preserved");
```

---

### `moveToRightEnd()`

Move cursor to the end. Returns `this` for chaining.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("abc").moveToRightEnd();
```

---

### `keystroke(key)`

Simulate a keystroke. Returns `this` for chaining.

| Parameter | Type     | Description                                                   |
| --------- | -------- | ------------------------------------------------------------- |
| `key`     | `string` | Key name (e.g., `Left`, `Right`, `Backspace`, `Tab`, `Enter`) |

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("ab").moveToRightEnd();
mf.keystroke("Left");
mf.keystroke("Backspace");
```

---

### `typedText(text)`

Simulate typing text. Returns `this` for chaining.

| Parameter | Type     | Description  |
| --------- | -------- | ------------ |
| `text`    | `string` | Text to type |

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.typedText("x+y=z");

assert(mf.latex().includes("x"), "Should type text");
```

---

### `config(options)`

Update configuration. Returns `this` for chaining.

| Parameter | Type             | Description           |
| --------- | ---------------- | --------------------- |
| `options` | `AphelionConfig` | Configuration options |

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.config({
  spaceBehavesLikeTab: true,
  maxDepth: 5,
});
```

---

### `reflow()`

Recalculate layout. Returns `this` for chaining.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("\\frac{1}{2}").reflow();
```

---

### `ignoreNextMousedown(callback)`

Ignore the next mousedown event based on callback result.

| Parameter  | Type            | Description             |
| ---------- | --------------- | ----------------------- |
| `callback` | `() => boolean` | Return `true` to ignore |

---

### `clickAt(x, y, target?)`

Simulate a click at coordinates.

| Parameter | Type          | Description             |
| --------- | ------------- | ----------------------- |
| `x`       | `number`      | X coordinate            |
| `y`       | `number`      | Y coordinate            |
| `target`  | `HTMLElement` | Optional target element |

## Method Chaining

Most methods return `this` for fluent chaining:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

mf.latex("x")
  .moveToRightEnd()
  .write("^2")
  .moveToRightEnd()
  .write(" + y^2")
  .focus();

assert(mf.latex().includes("x"), "Should chain methods");
```
