# API Reference

This section provides API documentation for Aphelion.

## Overview

Vanilla JavaScript APIs: [Aphelion Interface](./aphelion), [MathField](./mathfield) and [StaticMath](./staticmath). Configuration options are documented in [Configuration](./configuration).

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

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";
const AP = Aphelion.getInterface(3);
const mathField = AP.MathField(document.createElement("div"));

// Content
mathField.latex("x^2");
assert(typeof mathField.text() === "string", "Should have methods");
assert(typeof mathField.html() === "string", "Should have html method");
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
