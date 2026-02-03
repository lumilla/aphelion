# Vanilla JavaScript

This guide covers using Aphelion with plain JavaScript for everyone who doesn't like React.

## Getting the Interface

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

// Get interface
const AP = Aphelion.getInterface(3);
assert(AP !== null, "Interface should be available");
assert(typeof AP.MathField === "function", "Should have MathField");
assert(typeof AP.StaticMath === "function", "Should have StaticMath");
assert(AP.MathField !== undefined, "MathField should be defined");
assert(AP.StaticMath !== undefined, "StaticMath should be defined");
```

## Creating a MathField

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const container = document.createElement("div");

const mathField = AP.MathField(container, {
  handlers: {
    edit: (mf) => {
      console.log("Content changed:", mf.latex());
    },
  },
});

// Verify creation
assert(mathField.el() === container, "Should reference container");
assert(typeof mathField.latex === "function", "Should have latex method");
assert(typeof mathField.focus === "function", "Should have focus method");
```

## Reading and Writing LaTeX

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"));

// Set LaTeX (chainable)
mathField.latex("\\sqrt{x^2 + y^2}");

// Read LaTeX
const content = mathField.latex();
assertIncludes(content, "sqrt", "Should contain sqrt");
assertIncludes(content, "x", "Should contain x");
assertIncludes(content, "y", "Should contain y");
assertIncludes(content, "2", "Should contain exponents");
```

## Writing at Cursor Position

Insert LaTeX at the current cursor position:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"));

// Set initial content
mathField.latex("a + b");

// Move to end and write more
mathField.moveToRightEnd();
mathField.write(" + c");

const content = mathField.latex();
assertIncludes(content, "a", "Should contain a");
assertIncludes(content, "c", "Should contain c");
assertIncludes(content, "b", "Should contain b");
assertIncludes(content, "+", "Should contain plus");
```

## Executing Commands

Use `.cmd()` to insert command structures:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"));

// Insert a fraction command
mathField.cmd("\\frac");

// Type into the fraction
mathField.typedText("1");
mathField.keystroke("Tab");
mathField.typedText("2");

const content = mathField.latex();
assertIncludes(content, "frac", "Should contain fraction");
assertIncludes(content, "1", "Should contain 1");
assertIncludes(content, "2", "Should contain 2");
```

## Focus and Blur

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const container = document.createElement("div");
document.body.appendChild(container);

const mathField = AP.MathField(container);

// Focus the field
mathField.focus();

// Blur the field
mathField.blur();

// Cleanup
document.body.removeChild(container);
assert(typeof mathField.focus === "function", "Focus should be callable");
assert(typeof mathField.blur === "function", "Blur should be callable");
```

## Cursor Navigation

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"));

mathField.latex("a + b + c");

// Move cursor
mathField.moveToLeftEnd(); // Cursor at start
mathField.moveToRightEnd(); // Cursor at end

// Simulate keystrokes
mathField.keystroke("Left"); // Move left
mathField.keystroke("Right"); // Move right
assertIncludes(mathField.latex(), "a", "Content should be preserved");
assert(
  typeof mathField.moveToLeftEnd === "function",
  "Should have moveToLeftEnd",
);
```

## Selection

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"));

mathField.latex("x + y");

// Select all
mathField.select();

// Clear selection
mathField.clearSelection();
assert(typeof mathField.select === "function", "Should have select method");
assert(
  typeof mathField.clearSelection === "function",
  "Should have clearSelection method",
);
```

## Getting HTML and Text

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"));

mathField.latex("\\frac{1}{2}");

// Get rendered HTML
const html = mathField.html();
assert(typeof html === "string", "Should return HTML string");
assert(html.length > 0, "HTML should not be empty");

// Get plain text
const text = mathField.text();
assert(typeof text === "string", "Should return text string");
assert(typeof mathField.html === "function", "Should have html method");
assert(typeof mathField.text === "function", "Should have text method");
```

## Creating Static Math

For read-only math display:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const container = document.createElement("div");

const staticMath = AP.StaticMath(container);

// Set content
staticMath.latex("e^{i\\pi} + 1 = 0");

// Read content
const content = staticMath.latex();
assertIncludes(content, "pi", "Should contain pi");
assertIncludes(content, "e", "Should contain e");
assertIncludes(content, "1", "Should contain 1");
assert(typeof staticMath.latex === "function", "Should have latex method");
```

## Complete Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Aphelion in Vanilla JS</title>
    <link rel="stylesheet" href="@lumilla/aphelion/styles.css" />
    <style>
      .math-editor {
        padding: 10px;
        border: 2px solid #3498db;
        border-radius: 4px;
        min-height: 40px;
        font-size: 20px;
      }
      .toolbar button {
        margin: 5px;
        padding: 8px 12px;
      }
    </style>
  </head>
  <body>
    <h1>Math Editor</h1>

    <div class="toolbar">
      <button id="btn-frac">Fraction</button>
      <button id="btn-sqrt">Square Root</button>
      <button id="btn-power">Power</button>
      <button id="btn-clear">Clear</button>
    </div>

    <div id="editor" class="math-editor"></div>

    <p>LaTeX: <code id="output"></code></p>

    <script type="module">
      import { Aphelion } from "@lumilla/aphelion";

      const AP = Aphelion.getInterface(3);
      const output = document.getElementById("output");

      const mathField = AP.MathField(document.getElementById("editor"), {
        handlers: {
          edit: (mf) => {
            output.textContent = mf.latex();
          },
        },
      });

      // Toolbar buttons
      document.getElementById("btn-frac").onclick = () => {
        mathField.cmd("\\frac").focus();
      };

      document.getElementById("btn-sqrt").onclick = () => {
        mathField.cmd("\\sqrt").focus();
      };

      document.getElementById("btn-power").onclick = () => {
        mathField.typedText("^").focus();
      };

      document.getElementById("btn-clear").onclick = () => {
        mathField.latex("").focus();
      };

      // Set initial content
      mathField.latex("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}");
    </script>
  </body>
</html>
```
