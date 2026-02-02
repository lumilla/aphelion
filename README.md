# Aphelion

A beautiful, interactive math editor for the modern web.

[![Tests](https://github.com/lumilla/aphelion/actions/workflows/test.yml/badge.svg)](https://github.com/lumilla/aphelion/actions)
[![codecov](https://codecov.io/gh/lumilla/aphelion/branch/main/graph/badge.svg)](https://codecov.io/gh/lumilla/aphelion)
[![TypeScript](https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square)](https://www.typescriptlang.org/)
[![License: LGPL v3](https://img.shields.io/github/license/lumilla/aphelion)](LICENSE)

Aphelion is a LaTeX-based math input library that renders editable mathematical expressions in the browser. It supports both vanilla JavaScript and React applications.

> **Note:** Aphelion is an inspired modern reimplementation of the fantastic [mathquill/mathquill](https://github.com/mathquill/mathquill) (MPL licensed). It is not a derivative work. The codebase has been written from scratch.

## Installation

```bash
npm install @lumilla/aphelion
```

## Usage

### Vanilla JavaScript

```javascript
import { Aphelion } from '@lumilla/aphelion';
import '@lumilla/aphelion/styles.css';

const AP = Aphelion.getInterface(3);

// Create an editable math field
const mathField = AP.MathField(document.getElementById('math-field'), {
  handlers: {
    edit: (mf) => {
      console.log('LaTeX:', mf.latex());
    }
  }
});

// Set content programmatically
mathField.latex('\\frac{a}{b}');
```

### React Components

Aphelion provides React components for both controlled and uncontrolled usage patterns.

#### Uncontrolled MathField

```tsx
import { useRef } from 'react';
import { MathField, MathFieldRef } from '@lumilla/aphelion';
import '@lumilla/aphelion/styles.css';

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

#### Controlled MathField

```tsx
import { useState } from 'react';
import { ControlledMathField } from '@lumilla/aphelion';
import '@lumilla/aphelion/styles.css';

function App() {
  const [latex, setLatex] = useState('x^2');

  return (
    <ControlledMathField
      value={latex}
      onChange={setLatex}
    />
  );
}
```

#### Static Math Display

```tsx
import { StaticMath } from '@lumilla/aphelion';
import '@lumilla/aphelion/styles.css';

function App() {
  return <StaticMath>{"\\frac{1}{2}"}</StaticMath>;
}
```

## API

### MathField Instance Methods

| Method | Description |
|--------|-------------|
| `latex()` | Get the current LaTeX content |
| `latex(value)` | Set the LaTeX content |
| `text()` | Get plain text representation |
| `html()` | Get the HTML content |
| `focus()` | Focus the field |
| `blur()` | Blur the field |
| `write(latex)` | Write LaTeX at cursor position |
| `cmd(command)` | Execute a command (e.g., `\\frac`, `\\sqrt`) |
| `select()` | Select all content |
| `clearSelection()` | Clear the selection |
| `moveToRightEnd()` | Move cursor to end |
| `moveToLeftEnd()` | Move cursor to start |
| `keystroke(key)` | Simulate a keystroke |
| `typedText(text)` | Simulate typing text |
| `config(options)` | Update configuration |
| `reflow()` | Recalculate layout |

### Configuration Options

```typescript
interface AphelionConfig {
  restrictMismatchedBrackets?: boolean;
  autoOperatorNames?: string;
  autoCommands?: string;
  supSubsRequireOperand?: boolean;
  sumStartsWithNEquals?: boolean;
  maxDepth?: number;
  spaceBehavesLikeTab?: boolean;
  leftRightIntoCmdGoes?: 'up' | 'down';
  handlers?: {
    edit?: (mathField: MathFieldInstance) => void;
    enter?: (mathField: MathFieldInstance) => void;
    moveOutOf?: (direction: 'left' | 'right', mathField: MathFieldInstance) => void;
    selectOutOf?: (direction: 'left' | 'right', mathField: MathFieldInstance) => void;
    deleteOutOf?: (direction: 'left' | 'right', mathField: MathFieldInstance) => void;
    upOutOf?: (mathField: MathFieldInstance) => void;
    downOutOf?: (mathField: MathFieldInstance) => void;
  };
}
```

## Features

Aphelion supports a large subset of LaTeX commands including, but not limited to:

- **Fractions & Roots**: `\frac{a}{b}`, `\sqrt{x}`, `\sqrt[n]{x}`
- **Subscripts & Superscripts**: `x^{n}`, `x_{n}`, `x_{a}^{b}`
- **Greek Letters**: All lowercase and uppercase Greek symbols (`\alpha`, `\pi`, `\omega`, etc.)
- **Operators**: Binary operators (`\pm`, `\times`, `\div`), large operators (`\sum`, `\prod`, `\int`)
- **Brackets**: Automatic bracket balancing and nesting
- **Text Modes**: `\text`, `\mathbf`, `\mathcal`, `\mathbb`, and more
- **Matrices**: Multiple matrix formats (`\pmatrix`, `\bmatrix`, `\vmatrix`, etc.)
- **Accents**: Decorations like `\hat`, `\bar`, `\vec`, `\overline`

For a complete list of supported commands, see [latexCommandInput.ts](src/commands/latexCommandInput.ts).

## Examples

### Quadratic Formula

```javascript
mathField.latex('x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}');
```

### Euler's Identity

```javascript
mathField.latex('e^{i\\pi}+1=0');
```

### Summation

```javascript
mathField.latex('\\sum_{i=1}^{n}i=\\frac{n(n+1)}{2}');
```

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:lib    # Build as library
npm test             # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
npm run lint         # Lint source files
npm run typecheck    # Type check without emitting
```

### Building

The library builds to both ES modules and UMD formats:

- `dist/aphelion.es.js` - ES module
- `dist/aphelion.js` - UMD bundle (for dinosaurs, will probably be dropped in the future)
- `dist/styles.css` - Stylesheet (Obviously)
- `dist/index.d.ts` - TypeScript declarations

### Testing

For this repository, Vitest is used for testing.
Run the test suite with

```bash
npm test
```

### CI & Nightly artifacts

CI runs on every PR with GitHub Actions (`.github/workflows/test.yml`).
When tests and checks succeed a job runs and uploads an artifact containing `dist/`.
Code coverage is automatically updated during the test build.

#### Publishing

Publishing to npm is handled by `.github/workflows/publish.yml` which runs on pushes with tags matching `v*` or manual dispatch. T
Published on npm under scope @lumilla

## Browser Support

Aphelion should work in all modern browsers, so Internet Explorer is not supported. Intentionally.

## License

LGPL-3.0 - see [LICENSE](LICENSE) for details.
