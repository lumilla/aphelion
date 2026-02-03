# Quick Start

This guide will try to help you create your first Aphelion math field.

## Basic Setup

### 1. Create HTML Container

First, create a container element for your math field:

```html
<div id="math-field"></div>
```

### 2. Initialize Aphelion

Import and initialize Aphelion:

```javascript
import { Aphelion } from "@lumilla/aphelion";
import "@lumilla/aphelion/styles.css";

// Get the API interface (version 3)
// Aphelion has, and likely never will have any other version.
// But this is how MathQuill does it, and I want a painless API.
const AP = Aphelion.getInterface(3);

// Create a math field
const element = document.createElement("div");
const mathField = AP.MathField(element);
assert(mathField !== null, "MathField should be created");
assert(typeof mathField.latex === "function", "Should have latex method");
assert(typeof mathField.focus === "function", "Should have focus method");
```

### 3. Set and Get Content

Work with LaTeX content:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const element = document.createElement("div");
const mathField = AP.MathField(element);

// Set LaTeX content
mathField.latex("\\frac{a}{b}");

// Get LaTeX content
const latex = mathField.latex();
console.log(latex); // => '\frac{a}{b}' // doctest-hidden
assert(latex.includes("frac"), "Should contain fraction");
assert(latex.includes("a"), "Should contain numerator");
assert(latex.includes("b"), "Should contain denominator");
```

### 4. Handle Changes

Listen for edits:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const element = document.createElement("div");

let lastLatex = "";
const mathField = AP.MathField(element, {
  handlers: {
    edit: (mf) => {
      lastLatex = mf.latex();
    },
  },
});

// Set content to trigger edit
mathField.latex("x^2");
assert(typeof lastLatex === "string", "Handler should store latex");
assert(lastLatex.includes("x"), "Handler received correct content");
assert(lastLatex.includes("2"), "Should include exponent");
```

## Complete Example

Here's a complete working example:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Aphelion Demo</title>
    <link
      rel="stylesheet"
      href="node_modules/@lumilla/aphelion/dist/styles.css"
    />
  </head>
  <body>
    <h1>Math Editor</h1>
    <div id="math-field"></div>
    <p>LaTeX: <code id="latex-output"></code></p>

    <script type="module">
      import { Aphelion } from "@lumilla/aphelion";

      const AP = Aphelion.getInterface(3);
      const output = document.getElementById("latex-output");

      const mathField = AP.MathField(document.getElementById("math-field"), {
        handlers: {
          edit: (mf) => {
            output.textContent = mf.latex();
          },
        },
      });

      // Set initial content
      mathField.latex("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}");
    </script>
  </body>
</html>
```

## Next Steps

Explore [Vanilla JavaScript Guide](/guide/vanilla-js), [React Guide](/guide/react) or [Configuration](/guide/configuration) to customize behavior.
