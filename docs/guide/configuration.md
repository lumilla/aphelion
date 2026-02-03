# Configuration

Aphelion provides extensive configuration options to customize behavior.

## Configuration Options

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);

// Example configuration
const exampleConfig = {
  // Bracket balancing
  restrictMismatchedBrackets: true,

  // Auto-recognize operator names (space-separated)
  autoOperatorNames: "sin cos tan log ln exp",

  // Auto-complete these commands
  autoCommands: "pi theta alpha beta gamma",

  // Require operand before sup/sub
  supSubsRequireOperand: true,

  // Sum starts with n=
  sumStartsWithNEquals: true,

  // Maximum nesting depth
  maxDepth: 10,

  // Space behavior
  spaceBehavesLikeTab: true,

  // Arrow key behavior in commands
  leftRightIntoCmdGoes: "up", // or 'down'
};

assert(exampleConfig.maxDepth === 10, "Config should have maxDepth");
```

## Option Details

### `restrictMismatchedBrackets`

When `true`, prevents creating mismatched brackets like `(x]`.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"), {
  restrictMismatchedBrackets: true,
});

// Brackets will auto-balance
mathField.latex("(x + y)");
assert(mathField.latex().includes("("), "Should have opening bracket");
```

### `autoOperatorNames`

Space-separated list of functions that should render as operators:

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"), {
  autoOperatorNames: "sin cos tan log ln exp arcsin arccos arctan",
});

mathField.typedText("sin");
// 'sin' will be rendered as an operator, not three variables
```

### `autoCommands`

Commands that auto-complete without needing backslash:

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"), {
  autoCommands: "pi theta alpha beta gamma delta epsilon",
});

// Typing 'pi' will auto-complete to π
mathField.typedText("pi");
```

### `supSubsRequireOperand`

When `true`, superscripts and subscripts require an operand:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"), {
  supSubsRequireOperand: true,
});

// Typing '^' at the start won't create a superscript without operand
mathField.typedText("x");
mathField.typedText("^");
mathField.typedText("2");

const latex = mathField.latex();
assert(latex.includes("^"), "Should create superscript");
```

### `sumStartsWithNEquals`

When `true`, sum/product subscripts start with `n=`:

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"), {
  sumStartsWithNEquals: true,
});

mathField.cmd("\\sum");
// Subscript will start with 'n='
```

### `maxDepth`

Maximum nesting depth for structures:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"), {
  maxDepth: 5,
});

// Prevents deeply nested fractions like \frac{\frac{\frac{...}}}
mathField.latex("\\frac{1}{2}");
```

### `spaceBehavesLikeTab`

When `true`, space moves to next field instead of inserting space:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"), {
  spaceBehavesLikeTab: true,
});

mathField.cmd("\\frac");
mathField.typedText("1");
// Space will move to denominator instead of inserting space
mathField.keystroke("Space");
mathField.typedText("2");
```

### `leftRightIntoCmdGoes`

Direction cursor enters command from outside:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);

// Cursor enters at top field (numerator for fractions)
const mathFieldUp = AP.MathField(document.createElement("div"), {
  leftRightIntoCmdGoes: "up",
});

// Cursor enters at bottom field (denominator for fractions)
const mathFieldDown = AP.MathField(document.createElement("div"), {
  leftRightIntoCmdGoes: "down",
});
```

## Event Handlers

### `edit`

Called whenever content changes:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
let editCount = 0;

const mathField = AP.MathField(document.createElement("div"), {
  handlers: {
    edit: (mf) => {
      editCount++;
      console.log(`Edit #${editCount}:`, mf.latex());
    },
  },
});

mathField.latex("x^2");
assert(editCount >= 0, "Edit handler should track changes");
```

### `enter`

Called when Enter key is pressed:

```javascript
{
  handlers: {
    enter: (mf) => {
      // Submit form, move to next field, etc.
      console.log('Submitted:', mf.latex());
    },
  },
}
```

### Navigation Handlers

```javascript
{
  handlers: {
    // Cursor moved past edge
    moveOutOf: (direction, mf) => {
      if (direction === 'left') {
        // Focus previous field
      } else {
        // Focus next field
      }
    },

    // Selection extended past edge
    selectOutOf: (direction, mf) => {
      console.log('Selection extended:', direction);
    },

    // Backspace/Delete at edge
    deleteOutOf: (direction, mf) => {
      console.log('Delete at edge:', direction);
    },

    // Up arrow at top
    upOutOf: (mf) => {
      // Focus field above
    },

    // Down arrow at bottom
    downOutOf: (mf) => {
      // Focus field below
    },
  },
}
```

## Updating Configuration

Configuration can be updated after creation:

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"));

// Update configuration
mathField.config({
  spaceBehavesLikeTab: true,
  maxDepth: 3,
});
```

## Default Configuration

The default configuration values:

```typescript
const defaults = {
  restrictMismatchedBrackets: true,
  supSubsRequireOperand: false,
  sumStartsWithNEquals: false,
  maxDepth: Infinity,
  spaceBehavesLikeTab: false,
  leftRightIntoCmdGoes: "up",
  autoOperatorNames: "",
  autoCommands: "",
  handlers: {},
};
```
