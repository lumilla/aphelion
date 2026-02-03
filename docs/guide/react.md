# React Components

Aphelion provides first-class React support with both controlled and uncontrolled components.

## Installation

Make sure you have React 19+ as a peer dependency (Other versions may or may not work.):

```bash
npm install @lumilla/aphelion react react-dom
```

## Import

```tsx
import { MathField, ControlledMathField, StaticMath } from "@lumilla/aphelion";
import type { MathFieldRef } from "@lumilla/aphelion";
import "@lumilla/aphelion/styles.css";
```

## Uncontrolled MathField

The uncontrolled component manages its own state internally. Use a ref to read values:

```tsx
import { useRef, useEffect } from "react";
import { MathField } from "@lumilla/aphelion";
import type { MathFieldRef } from "@lumilla/aphelion";

function UncontrolledExample() {
  const ref = useRef<MathFieldRef>(null);

  useEffect(() => {
    // Access via ref
    if (ref.current) {
      ref.current.setLatex("x^2 + y^2 = z^2");
    }
  }, []);

  const handleClick = () => {
    const latex = ref.current?.latex();
    assert(typeof latex === "string", "Should return latex string");
  };

  return (
    <div>
      <MathField
        ref={ref}
        defaultValue="a + b"
        onChange={(latex) => console.log("Changed:", latex)}
      />
      <button onClick={handleClick}>Get LaTeX</button>
    </div>
  );
}
```

## Controlled MathField

For full control over the state, use the controlled component:

```tsx
import { useState } from "react";
import { ControlledMathField } from "@lumilla/aphelion";

function ControlledExample() {
  const [latex, setLatex] = useState("\\frac{1}{2}");

  return (
    <div>
      <ControlledMathField value={latex} onChange={setLatex} />
      <p>Current value: {latex}</p>
      <button onClick={() => setLatex("x^2")}>Set to x²</button>
    </div>
  );
}
```

## StaticMath Component

For read-only math display:

```tsx
import { StaticMath } from "@lumilla/aphelion";

function StaticExample() {
  return (
    <div>
      <p>Euler's Identity:</p>
      <StaticMath>{"e^{i\\pi} + 1 = 0"}</StaticMath>

      <p>Quadratic Formula:</p>
      <StaticMath>{"x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"}</StaticMath>
    </div>
  );
}
```

## Props Reference

### MathField Props

| Prop           | Type                      | Description                 |
| -------------- | ------------------------- | --------------------------- |
| `defaultValue` | `string`                  | Initial LaTeX content       |
| `onChange`     | `(latex: string) => void` | Called when content changes |
| `onFocus`      | `() => void`              | Called when focused         |
| `onBlur`       | `() => void`              | Called when blurred         |
| `config`       | `EditorConfig`            | Configuration options       |
| `className`    | `string`                  | CSS class name              |
| `style`        | `CSSProperties`           | Inline styles               |
| `ariaLabel`    | `string`                  | Accessible label            |

### ControlledMathField Props

| Prop        | Type                      | Description                            |
| ----------- | ------------------------- | -------------------------------------- |
| `value`     | `string`                  | Current LaTeX content (required)       |
| `onChange`  | `(latex: string) => void` | Called when content changes (required) |
| `onFocus`   | `() => void`              | Called when focused                    |
| `onBlur`    | `() => void`              | Called when blurred                    |
| `config`    | `EditorConfig`            | Configuration options                  |
| `className` | `string`                  | CSS class name                         |
| `style`     | `CSSProperties`           | Inline styles                          |
| `ariaLabel` | `string`                  | Accessible label                       |

### StaticMath Props

| Prop        | Type            | Description              |
| ----------- | --------------- | ------------------------ |
| `children`  | `string`        | LaTeX content to display |
| `className` | `string`        | CSS class name           |
| `style`     | `CSSProperties` | Inline styles            |
| `ariaLabel` | `string`        | Accessible label         |

### MathFieldRef Methods

Access these methods via a ref:

```tsx
const ref = useRef<MathFieldRef>(null);

// Available methods:
ref.current?.latex(); // Get LaTeX
ref.current?.setLatex(value); // Set LaTeX
ref.current?.text(); // Get plain text
ref.current?.focus(); // Focus the editor
ref.current?.blur(); // Blur the editor
ref.current?.insertCommand(cmd); // Insert a command
ref.current?.getController(); // Get internal controller
```

## Configuration Example

```tsx
import { MathField } from "@lumilla/aphelion";

function ConfiguredExample() {
  return (
    <MathField
      defaultValue=""
      config={{
        spaceBehavesLikeTab: true,
        supSubsRequireOperand: true,
        restrictMismatchedBrackets: true,
        autoOperatorNames: "sin cos tan log ln",
        maxDepth: 10,
      }}
      onChange={(latex) => console.log(latex)}
    />
  );
}
```

## Event Handlers Example

```tsx
import { MathField } from "@lumilla/aphelion";

function EventExample() {
  return (
    <MathField
      config={{
        handlers: {
          enter: () => {
            console.log("Enter pressed");
          },
          moveOutOf: (direction) => {
            console.log("Moved out:", direction);
          },
          deleteOutOf: (direction) => {
            console.log("Delete at edge:", direction);
          },
        },
      }}
    />
  );
}
```

## Styling Example

```tsx
import { MathField } from "@lumilla/aphelion";

function StyledExample() {
  return (
    <MathField
      className="custom-math-field"
      style={{
        fontSize: "24px",
        padding: "16px",
        border: "2px solid #3498db",
        borderRadius: "8px",
      }}
      defaultValue="\\int_0^\\infty e^{-x^2} dx"
    />
  );
}
```

## Complete Example: Math Quiz

```tsx
import { useState, useRef } from "react";
import { MathField, StaticMath, MathFieldRef } from "@lumilla/aphelion";
import "@lumilla/aphelion/styles.css";

interface Question {
  prompt: string;
  answer: string;
}

const questions: Question[] = [
  { prompt: "What is 2 + 2?", answer: "4" },
  { prompt: "Simplify \\frac{4}{8}", answer: "\\frac{1}{2}" },
];

function MathQuiz() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const ref = useRef<MathFieldRef>(null);

  const question = questions[current];

  const checkAnswer = () => {
    const userAnswer = ref.current?.latex() ?? "";
    if (userAnswer === question.answer) {
      setScore((s) => s + 1);
      alert("Correct!");
    } else {
      alert(`Incorrect. The answer was: ${question.answer}`);
    }

    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      ref.current?.setLatex("");
    }
  };

  return (
    <div className="quiz">
      <h2>Math Quiz</h2>
      <p>
        Score: {score}/{questions.length}
      </p>

      <div className="question">
        <StaticMath>{question.prompt}</StaticMath>
      </div>

      <MathField ref={ref} defaultValue="" />

      <button onClick={checkAnswer}>Submit</button>
    </div>
  );
}
```
