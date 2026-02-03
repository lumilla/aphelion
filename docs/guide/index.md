# What is Aphelion?

Aphelion is a LaTeX-based math input library that renders editable mathematical expressions in the browser. It supports both vanilla JavaScript and React applications.

## Features

LaTeX input/output, interactive editing, React support, accessibility and a modest footprint. Customizable via config and handlers

## Why Aphelion?

Aphelion is a modern TypeScript reimplementation inspired by MathQuill with better type support, ACTUAL modern build tooling, React integration and active(ish) maintenance.

## Quick Example

::: code-group

```javascript [Vanilla JS]
import { Aphelion } from "@lumilla/aphelion";
import "@lumilla/aphelion/styles.css";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.getElementById("math-field"));

// Set content
mathField.latex("\\frac{a}{b}");

// Read content
console.log(mathField.latex()); // => '\frac{a}{b}'
```

```tsx [React]
import { MathField, MathFieldRef } from "@lumilla/aphelion";
import "@lumilla/aphelion/styles.css";
import { useRef } from "react";

function App() {
  const ref = useRef<MathFieldRef>(null);

  return (
    <MathField
      ref={ref}
      defaultValue="x^2 + y^2 = z^2"
      onChange={(latex) => console.log(latex)}
    />
  );
}
```

:::

## Browser Support

Aphelion is meant to work in all recent modern browsers, within reason.

Internet Explorer is **not** supported. For JQuery fun, use [MathQuill](https://github.com/mathquill/mathquill).

## License

Aphelion is released under the [LGPL-3.0 License](https://github.com/lumilla/aphelion/blob/main/LICENSE).
