# What is Aphelion?

Aphelion is a LaTeX-based math input library that renders editable mathematical expressions in the browser. It's framework-agnostic and works with vanilla JavaScript.

## Features

LaTeX input/output, interactive editing, accessibility and a modest footprint. Customizable via config and handlers

## Why Aphelion?

Aphelion is a modern TypeScript reimplementation inspired by MathQuill with better type support, ACTUAL modern build tooling and active(ish) maintenance.

## Quick Example

```javascript
import { Aphelion } from "@lumilla/aphelion";
import "@lumilla/aphelion/styles.css";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.getElementById("math-field"));

// Set content
mathField.latex("\\frac{a}{b}");

// Read content
console.log(mathField.latex()); // => '\frac{a}{b}'
```

## Browser Support

Aphelion is meant to work in all recent modern browsers, within reason.

Internet Explorer is **not** supported. For JQuery fun, use [MathQuill](https://github.com/mathquill/mathquill).

## License

Aphelion is released under the [LGPL-3.0 License](https://github.com/lumilla/aphelion/blob/main/LICENSE).
