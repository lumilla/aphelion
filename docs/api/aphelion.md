# Aphelion Interface

The main entry point for using Aphelion.

## Import

```javascript
import { Aphelion } from "@lumilla/aphelion";
// or
import Aphelion from "@lumilla/aphelion";
```

## `Aphelion.getInterface(version)`

Get a versioned API interface.

### Parameters

| Parameter | Type     | Description           |
| --------- | -------- | --------------------- |
| `version` | `number` | API version (use `3`) |

### Returns

`AphelionAPI` - The API interface

### Example

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
assert(AP !== null, "Should return API");
assert(typeof AP.MathField === "function", "Should have MathField");
assert(typeof AP.StaticMath === "function", "Should have StaticMath");
assert(typeof AP.version === "string", "Should have version");
assert(AP.interfaceVersion === 3, "Should be interface v3");
assert(AP.version.length > 0, "Version should not be empty");
```

## AphelionAPI Interface

```typescript doctest
interface AphelionAPI {
  /** Create an editable MathField */
  MathField: (element: HTMLElement, config?: object) => any;

  /** Create a read-only StaticMath display */
  StaticMath: (element: HTMLElement, config?: object) => any;

  /** Get existing instance from element */
  (element: HTMLElement): any;

  /** Library version */
  version: string;

  /** Interface version */
  interfaceVersion: number;
}

assert(typeof AphelionAPI, "Interface should be defined");
```

## Creating Instances

### MathField

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const container = document.createElement("div");

const mathField = AP.MathField(container, {
  handlers: {
    edit: (mf) => console.log("Changed:", mf.latex()),
  },
});
assert(mathField !== null, "Should create MathField");
assert(mathField.el() === container, "Should reference container");
assert(typeof mathField.latex === "function", "Should have latex method");
```

### StaticMath

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const container = document.createElement("div");

const staticMath = AP.StaticMath(container);
staticMath.latex("\\frac{1}{2}");
assert(staticMath !== null, "Should create StaticMath");
assert(staticMath.latex().includes("frac"), "Should set content");
assert(staticMath.el() === container, "Should reference container");
```

## Getting Existing Instances

```javascript
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);
const container = document.getElementById("math-field");

// Create a new instance
AP.MathField(container);

// Later, retrieve it
const existingInstance = AP(container);
if (existingInstance) {
  console.log("Found instance:", existingInstance.latex());
}
```

## Version Information

```javascript doctest
import { Aphelion } from "@lumilla/aphelion";

const AP = Aphelion.getInterface(3);

// Note: interfaceVersion reports 3 to follow MathQuill's API convention.
// (It is actually meaningless in Aphelions internals)

assert(typeof AP.version === "string", "Should have version string");
assert(AP.interfaceVersion === 3, "Should be interface v3");
```
