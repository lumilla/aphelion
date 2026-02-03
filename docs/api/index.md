# API Reference

This section provides API documentation for Aphelion.

## Overview

Vanilla JavaScript APIs: [Aphelion Interface](./aphelion), [MathField](./mathfield) and [StaticMath](./staticmath). React components are in [React Components](./react-components). Configuration options are documented in [Configuration](./configuration).

## Quick Reference

### Creating a MathField

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"));

assert(mathField !== null, "Should create MathField");
assert(typeof mathField.latex === "function", "Should have methods");
```

### MathField Methods

```javascript doctest\nimport { Aphelion } from '@lumilla/aphelion';
const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"));

// Content
mathField.latex("x^2");
assert(typeof mathField.text() === "string", "Should have methods");
assert(typeof mathField.html() === "string", "Should have html method");
```

### React Usage

```tsx
// Uncontrolled
<MathField
  ref={ref}
  defaultValue="x^2"
  onChange={handleChange}
/>

// Controlled
<ControlledMathField
  value={latex}
  onChange={setLatex}
/>

// Static
<StaticMath>{"\\frac{1}{2}"}</StaticMath>
```

## TypeScript Types

All types are exported:

```typescript doctest
import type {
  AphelionConfig,
  MathFieldInstance,
  StaticMathInstance,
} from "@lumilla/aphelion";

assert(typeof AphelionConfig, "Types should be exported");
assert(typeof MathFieldInstance, "Types should be exported");
```

## Version Compatibility

Interface version is 3
This follows MathQuill's convention for API versioning and does not imply there were v1 or v2 releases.
Interfaces in the future will either stay version 3, or drop the version completely.

```javascript
const AP = Aphelion.getInterface(3);
```
