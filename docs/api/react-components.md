# React Components API

Aphelion provides first-class React components.

## Import

```tsx
import { MathField, ControlledMathField, StaticMath } from "@lumilla/aphelion";
import type { MathFieldRef } from "@lumilla/aphelion";
import "@lumilla/aphelion/styles.css";
```

## MathField

Uncontrolled component that manages its own state.

### Props

```typescript doctest
interface MathFieldProps {
  defaultValue?: string;
  onChange?: (latex: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  config?: object;
  className?: string;
  style?: object;
  ariaLabel?: string;
}

assert(typeof MathFieldProps, "Interface should be defined");
```

### Example

```tsx
import { MathField } from "@lumilla/aphelion";

function Example() {
  return (
    <MathField
      defaultValue="x^2 + y^2"
      onChange={(latex) => console.log(latex)}
      className="my-math-field"
    />
  );
}
```

### With Ref

```tsx
import { useRef } from "react";
import { MathField } from "@lumilla/aphelion";
import type { MathFieldRef } from "@lumilla/aphelion";

function RefExample() {
  const ref = useRef<MathFieldRef>(null);

  const handleClick = () => {
    // Access imperative methods
    const latex = ref.current?.latex();
    assert(typeof latex === "string", "Should return string");
    ref.current?.focus();
  };

  return (
    <div>
      <MathField ref={ref} defaultValue="\\frac{1}{2}" />
      <button onClick={handleClick}>Get LaTeX</button>
    </div>
  );
}
```

---

## ControlledMathField

Fully controlled component where you manage the state.

### Props

```typescript doctest
interface ControlledMathFieldProps {
  value: string;
  onChange: (latex: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  config?: object;
  className?: string;
  style?: object;
  ariaLabel?: string;
}

assert(typeof ControlledMathFieldProps, "Interface should be defined");
```

### Example

```tsx
import { useState } from "react";
import { ControlledMathField } from "@lumilla/aphelion";

function ControlledExample() {
  const [latex, setLatex] = useState("\\frac{a}{b}");

  return (
    <div>
      <ControlledMathField value={latex} onChange={setLatex} />
      <p>Current: {latex}</p>
      <button onClick={() => setLatex("x^2")}>Reset</button>
    </div>
  );
}
```

---

## StaticMath

Read-only math display component.

### Props

```typescript doctest
interface StaticMathProps {
  children: string;
  className?: string;
  style?: object;
  ariaLabel?: string;
}

assert(typeof StaticMathProps, "Interface should be defined");
```

### Example

```tsx
import { StaticMath } from "@lumilla/aphelion";

function StaticExample() {
  return (
    <div>
      <p>Euler's identity:</p>
      <StaticMath>{"e^{i\\pi} + 1 = 0"}</StaticMath>
    </div>
  );
}
```

---

## MathFieldRef

Reference type for accessing imperative methods.

### Methods

```typescript doctest
interface MathFieldRef {
  latex: () => string;
  setLatex: (value: string) => void;
  text: () => string;
  focus: () => void;
  blur: () => void;
  insertCommand: (cmd: string) => void;
  getController: () => any;
}

assert(typeof MathFieldRef, "Interface should be defined");
```

### Usage

```tsx
import { useRef } from "react";
import type { MathFieldRef } from "@lumilla/aphelion";

const ref = useRef<MathFieldRef>(null);

// In event handlers or effects:
if (ref.current) {
  const latex = ref.current.latex(); // Get current LaTeX
  ref.current.setLatex("x^2"); // Set LaTeX
  const text = ref.current.text(); // Get plain text
  ref.current.focus(); // Focus
  ref.current.blur(); // Blur
  ref.current.insertCommand("\\frac"); // Insert fraction

  assert(typeof latex === "string", "Should return string");
  assert(typeof text === "string", "Should return string");
}
```

---

## EditorConfig

Configuration passed via the `config` prop.

```typescript
interface EditorConfig {
  restrictMismatchedBrackets?: boolean;
  autoOperatorNames?: string;
  autoCommands?: string;
  supSubsRequireOperand?: boolean;
  sumStartsWithNEquals?: boolean;
  maxDepth?: number;
  spaceBehavesLikeTab?: boolean;
  leftRightIntoCmdGoes?: "up" | "down";
  handlers?: {
    edit?: (ctrl: Controller) => void;
    enter?: (ctrl: Controller) => void;
    moveOutOf?: (direction: "left" | "right", ctrl: Controller) => void;
    selectOutOf?: (direction: "left" | "right", ctrl: Controller) => void;
    deleteOutOf?: (direction: "left" | "right", ctrl: Controller) => void;
    upOutOf?: (ctrl: Controller) => void;
    downOutOf?: (ctrl: Controller) => void;
  };
}
```

### Example

```tsx
import { MathField } from "@lumilla/aphelion";

const config = {
  spaceBehavesLikeTab: true,
  autoOperatorNames: "sin cos tan log",
  handlers: {
    enter: (ctrl: any) => console.log("Enter pressed"),
  },
};

function ConfigExample() {
  return <MathField config={config} />;
}
```

---

## Hooks

### useAphelion

Low-level hook for custom implementations.

```tsx
import { useAphelion } from "@lumilla/aphelion";

function CustomMathField() {
  const {
    containerRef,
    controller,
    focus,
    blur,
    getLatex,
    setLatex,
    getText,
    insertCommand,
  } = useAphelion({
    handlers: {
      edit: (ctrl: any) => console.log("Changed"),
    },
  });

  assert(typeof focus === "function", "focus should be function");
  assert(typeof blur === "function", "blur should be function");
  assert(typeof getLatex === "function", "getLatex should be function");

  return <div ref={containerRef} />;
}
```

### useControlledAphelion

Hook for controlled usage pattern.

```tsx
import { useControlledAphelion } from "@lumilla/aphelion";

function CustomControlledField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { containerRef } = useControlledAphelion({
    value,
    onChange,
  });

  assert(containerRef !== null, "containerRef should be defined");

  return <div ref={containerRef} />;
}
```

# How about {other framework}?

PRs that bring support for other frameworks are welcome.
Only React is natively supported at this time.
