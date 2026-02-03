# Configuration API

Complete reference for all configuration options.

## AphelionConfig

```typescript doctest
interface AphelionConfig {
  restrictMismatchedBrackets?: boolean;
  autoOperatorNames?: string;
  autoCommands?: string;
  supSubsRequireOperand?: boolean;
  sumStartsWithNEquals?: boolean;
  maxDepth?: number;
  spaceBehavesLikeTab?: boolean;
  leftRightIntoCmdGoes?: "up" | "down";
  handlers?: any;
}

assert(typeof AphelionConfig, "Config interface should be defined");
```

## Options Reference

### `restrictMismatchedBrackets`

| Type      | Default |
| --------- | ------- |
| `boolean` | `true`  |

Prevents creating mismatched brackets.

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"), {
  restrictMismatchedBrackets: true,
});

assert(typeof mf.latex === "function", "MathField should be created");
```

---

### `autoOperatorNames`

| Type     | Default |
| -------- | ------- |
| `string` | `''`    |

Space-separated list of function names to render as operators.

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"), {
  autoOperatorNames:
    "sin cos tan log ln exp arcsin arccos arctan sinh cosh tanh",
});

assert(typeof mf.latex === "function", "MathField should be created");
```

---

### `autoCommands`

| Type     | Default |
| -------- | ------- |
| `string` | `''`    |

Space-separated list of commands that auto-complete without backslash.

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"), {
  autoCommands: "pi theta alpha beta gamma delta epsilon omega infinity",
});

assert(typeof mf.latex === "function", "MathField should be created");
```

---

### `supSubsRequireOperand`

| Type      | Default |
| --------- | ------- |
| `boolean` | `false` |

When true, superscripts and subscripts require an operand to their left.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"), {
  supSubsRequireOperand: true,
});

// Typing '^' at start won't create a superscript
mf.typedText("x^2");

assert(mf.latex().includes("x"), "Should contain x");
```

---

### `sumStartsWithNEquals`

| Type      | Default |
| --------- | ------- |
| `boolean` | `false` |

When true, sum/product subscripts start with `n=`.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"), {
  sumStartsWithNEquals: true,
});

mf.cmd("\\sum");
// Subscript now starts with 'n='

assert(typeof mf.latex === "function", "MathField should be created");
```

---

### `maxDepth`

| Type     | Default    |
| -------- | ---------- |
| `number` | `Infinity` |

Maximum nesting depth for structures.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"), {
  maxDepth: 5,
});

// Prevents deeply nested expressions
assert(typeof mf.latex === "function", "MathField should be created");
```

---

### `spaceBehavesLikeTab`

| Type      | Default |
| --------- | ------- |
| `boolean` | `false` |

When true, space moves to next field instead of inserting a space.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"), {
  spaceBehavesLikeTab: true,
});

mf.cmd("\\frac");
mf.typedText("1");
mf.keystroke("Space"); // Moves to denominator

assert(mf.latex().includes("frac"), "Should contain fraction");
```

---

### `leftRightIntoCmdGoes`

| Type             | Default |
| ---------------- | ------- |
| `'up' \| 'down'` | `'up'`  |

Direction cursor enters command when navigating with left/right keys.

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);

// Enters numerator first
const mfUp = AP.MathField(document.createElement("div"), {
  leftRightIntoCmdGoes: "up",
});

// Enters denominator first
const mfDown = AP.MathField(document.createElement("div"), {
  leftRightIntoCmdGoes: "down",
});

assert(typeof mfUp.latex === "function", "Up should create MathField");
assert(typeof mfDown.latex === "function", "Down should create MathField");
```

---

## EditorHandlers

```typescript
interface EditorHandlers {
  edit?: (mf: MathFieldInstance) => void;
  enter?: (mf: MathFieldInstance) => void;
  moveOutOf?: (direction: "left" | "right", mf: MathFieldInstance) => void;
  selectOutOf?: (direction: "left" | "right", mf: MathFieldInstance) => void;
  deleteOutOf?: (direction: "left" | "right", mf: MathFieldInstance) => void;
  upOutOf?: (mf: MathFieldInstance) => void;
  downOutOf?: (mf: MathFieldInstance) => void;
}
```

### `edit`

Called whenever content changes.

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
let editCalled = false; // doctest-hidden
const mf = AP.MathField(document.createElement("div"), {
  handlers: {
    edit: (mf) => {
      console.log("Content:", mf.latex());
      editCalled = true; // doctest-hidden
    },
  },
});

mf.latex("x^2");
assert(editCalled, "Edit handler should be called");
```

### `enter`

Called when Enter key is pressed.

```javascript
{
  handlers: {
    enter: (mf) => {
      submitForm(mf.latex());
    },
  },
}
```

### `moveOutOf`

Called when cursor moves past edge.

```javascript
{
  handlers: {
    moveOutOf: (direction, mf) => {
      if (direction === 'right') {
        focusNextField();
      } else {
        focusPreviousField();
      }
    },
  },
}
```

### `selectOutOf`

Called when selection extends past edge.

```javascript
{
  handlers: {
    selectOutOf: (direction, mf) => {
      console.log('Selection extended:', direction);
    },
  },
}
```

### `deleteOutOf`

Called when delete/backspace pressed at edge.

```javascript
{
  handlers: {
    deleteOutOf: (direction, mf) => {
      if (direction === 'left') {
        mergeWithPreviousField();
      }
    },
  },
}
```

### `upOutOf` / `downOutOf`

Called when up/down arrow pressed at vertical edge.

```javascript
{
  handlers: {
    upOutOf: (mf) => focusFieldAbove(),
    downOutOf: (mf) => focusFieldBelow(),
  },
}
```

---

## Runtime Configuration

Update configuration after creation:

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mf = AP.MathField(document.createElement("div"));

// Update config later
mf.config({
  spaceBehavesLikeTab: true,
  maxDepth: 3,
  handlers: {
    edit: (mf) => console.log("New handler"),
  },
});
```
