# Event Handlers

Aphelion provides comprehensive event handling for user interactions.

## Handler Overview

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

## Edit Handler

The `edit` handler is called whenever the content changes:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const edits = [];

const mathField = AP.MathField(document.createElement("div"), {
  handlers: {
    edit: (mf) => {
      edits.push(mf.latex());
    },
  },
});

// Trigger edits
mathField.latex("x^2");
mathField.latex("y^2");

assert(edits.length >= 0, "Should track edits");
```

Use cases include live preview, validation, auto-save and keeping multiple fields in sync.

## Enter Handler

Called when the Enter key is pressed:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
let enterPressed = false;

const mathField = AP.MathField(document.createElement("div"), {
  handlers: {
    enter: (mf) => {
      enterPressed = true;
      console.log("Submitted:", mf.latex());
    },
  },
});

// Simulate enter
mathField.keystroke("Enter");
```

Use cases include submitting forms, moving to the next field or triggering calculations.

## Navigation Handlers

### moveOutOf

Called when cursor moves past the edge of the field:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
let direction = null;

const mathField = AP.MathField(document.createElement("div"), {
  handlers: {
    moveOutOf: (dir, mf) => {
      direction = dir;
      console.log("Moved out:", dir);
    },
  },
});

mathField.latex("x");
mathField.moveToLeftEnd();
mathField.keystroke("Left"); // Will trigger moveOutOf('left')
```

This is useful for multi-field navigation and spreadsheet-like arrow navigation.

### selectOutOf

Called when selection extends past the edge:

```javascript
{
  handlers: {
    selectOutOf: (direction, mf) => {
      if (direction === 'right') {
        // Extend selection to next field
      }
    },
  },
}
```

### deleteOutOf

Called when backspace/delete is pressed at the edge:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
let deleteDirection = null;

const mathField = AP.MathField(document.createElement("div"), {
  handlers: {
    deleteOutOf: (dir, mf) => {
      deleteDirection = dir;
      console.log("Delete at edge:", dir);
    },
  },
});

mathField.latex("");
mathField.keystroke("Backspace"); // Will trigger deleteOutOf('left')
```

Common actions: join fields or delete a wrapping container.

## Vertical Navigation

### upOutOf and downOutOf

Called when up/down arrows are pressed at vertical edges:

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
let verticalMove = null;

const mathField = AP.MathField(document.createElement("div"), {
  handlers: {
    upOutOf: (mf) => {
      verticalMove = "up";
      console.log("Up out of field");
    },
    downOutOf: (mf) => {
      verticalMove = "down";
      console.log("Down out of field");
    },
  },
});

mathField.keystroke("Up");
mathField.keystroke("Down");
```

Used for multi-line math navigation, matrix input row movement and spreadsheet-style up/down navigation.

## Complete Example: Multi-field Form

```javascript
import { Aphelion } from "@lumilla/aphelion";
import "@lumilla/aphelion/styles.css";

const AP = Aphelion.getInterface(3);

// Create array of field containers
const containers = [
  document.getElementById("field-1"),
  document.getElementById("field-2"),
  document.getElementById("field-3"),
];

// Create fields with navigation
const fields = containers.map((container, index) => {
  return AP.MathField(container, {
    handlers: {
      edit: (mf) => {
        updatePreview(index, mf.latex());
      },

      enter: (mf) => {
        // Move to next field or submit
        if (index < fields.length - 1) {
          fields[index + 1].focus();
        } else {
          submitForm();
        }
      },

      moveOutOf: (direction, mf) => {
        if (direction === "right" && index < fields.length - 1) {
          fields[index + 1].focus().moveToLeftEnd();
        } else if (direction === "left" && index > 0) {
          fields[index - 1].focus().moveToRightEnd();
        }
      },

      deleteOutOf: (direction, mf) => {
        if (direction === "left" && index > 0) {
          fields[index - 1].focus().moveToRightEnd();
        }
      },

      upOutOf: (mf) => {
        if (index > 0) {
          fields[index - 1].focus();
        }
      },

      downOutOf: (mf) => {
        if (index < fields.length - 1) {
          fields[index + 1].focus();
        }
      },
    },
  });
});

function updatePreview(index, latex) {
  document.getElementById(`preview-${index}`).textContent = latex;
}

function submitForm() {
  const values = fields.map((f) => f.latex());
  console.log("Submitted:", values);
}
```

## React Event Handling

In React, you can use both prop-based and config-based handlers:

```tsx
import { MathField } from "@lumilla/aphelion";

function EventfulMathField() {
  return (
    <MathField
      // Prop-based (recommended for these)
      onChange={(latex) => console.log("Changed:", latex)}
      onFocus={() => console.log("Focused")}
      onBlur={() => console.log("Blurred")}
      // Config-based (for advanced handlers)
      config={{
        handlers: {
          enter: (mf) => console.log("Enter pressed"),
          moveOutOf: (dir, mf) => console.log("Moved:", dir),
        },
      }}
    />
  );
}
```

## Handler Best Practices

Keep handlers fast and debounced when needed, avoid storing stale mf refs, don't call `latex()` inside `edit` (avoid loops), and clean up handlers on unmount.
