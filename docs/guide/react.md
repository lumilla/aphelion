# React Components

> **Note:** React components have been removed from the main `@lumilla/aphelion` package as of version 1.1.0.
>
> Framework-specific components (React, Preact, Vue, etc.) may be released as separate packages in the future.
>
> For now, you can use the vanilla JavaScript API in your React applications. See [Vanilla JavaScript](/guide/vanilla-js) for the API reference.

## Using Aphelion with React

You can integrate Aphelion into React applications using the vanilla JavaScript API with refs:

## Using Aphelion with React

You can integrate Aphelion into React applications using the vanilla JavaScript API with refs:

```tsx
import { useEffect, useRef } from "react";
import { Aphelion } from "@lumilla/aphelion";
import type { MathFieldInstance } from "@lumilla/aphelion";
import "@lumilla/aphelion/styles.css";

function MathFieldComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mathFieldRef = useRef<MathFieldInstance | null>(null);

  useEffect(() => {
    if (containerRef.current && !mathFieldRef.current) {
      const AP = Aphelion.getInterface(3);
      mathFieldRef.current = AP.MathField(containerRef.current, {
        handlers: {
          edit: () => {
            const latex = mathFieldRef.current?.latex();
            console.log("Changed:", latex);
          },
        },
      });
      mathFieldRef.current.latex("x^2 + y^2 = z^2");
    }

    return () => {
      // Cleanup if needed
      mathFieldRef.current = null;
    };
  }, []);

  return <div ref={containerRef} />;
}
```

## Example with State Management

```tsx
import { useEffect, useRef, useState } from "react";
import { Aphelion } from "@lumilla/aphelion";
import type { MathFieldInstance } from "@lumilla/aphelion";

function ControlledMathField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mathFieldRef = useRef<MathFieldInstance | null>(null);
  const [latex, setLatex] = useState("\\frac{1}{2}");

  useEffect(() => {
    if (containerRef.current && !mathFieldRef.current) {
      const AP = Aphelion.getInterface(3);
      mathFieldRef.current = AP.MathField(containerRef.current, {
        handlers: {
          edit: () => {
            const newLatex = mathFieldRef.current?.latex();
            if (newLatex) setLatex(newLatex);
          },
        },
      });
    }
  }, []);

  useEffect(() => {
    if (mathFieldRef.current && mathFieldRef.current.latex() !== latex) {
      mathFieldRef.current.latex(latex);
    }
  }, [latex]);

  return (
    <div>
      <div ref={containerRef} />
      <p>Current value: {latex}</p>
      <button onClick={() => setLatex("x^2")}>Set to x²</button>
    </div>
  );
}
```

## Static Math Display

For read-only math display:

```tsx
import { useEffect, useRef } from "react";
import { Aphelion } from "@lumilla/aphelion";

function StaticMath({ children }: { children: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const AP = Aphelion.getInterface(3);
      AP.StaticMath(containerRef.current);
      containerRef.current.textContent = children;
    }
  }, [children]);

  return <span ref={containerRef} />;
}

function App() {
  return (
    <div>
      <p>Euler's Identity:</p>
      <StaticMath>{"e^{i\\pi} + 1 = 0"}</StaticMath>
    </div>
  );
}
```

---

For more details on the vanilla JavaScript API, see the [API Reference](/api/).
