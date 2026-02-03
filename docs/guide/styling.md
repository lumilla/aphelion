# Styling

Customize the appearance of Aphelion math fields.

## Importing Styles

Always import the base stylesheet:

```javascript
import "@lumilla/aphelion/styles.css";
```

(Or don't, I'm not a cop)

Or in CSS:

```css
@import "@lumilla/aphelion/styles.css";
```

## CSS Classes

Aphelion applies these classes to elements:

| Class                   | Element                 |
| ----------------------- | ----------------------- |
| `.aphelion-math-field`  | Main container          |
| `.aphelion-root-block`  | Root math block         |
| `.aphelion-cursor`      | Blinking cursor         |
| `.aphelion-selection`   | Selected content        |
| `.aphelion-static-math` | Static (read-only) math |

## Custom Styling

### Basic Customization

```css
/* Container styling */
.aphelion-math-field {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 20px;
  min-height: 48px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

/* Focus state */
.aphelion-math-field:focus-within {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  outline: none;
}

/* Cursor color */
.aphelion-cursor {
  border-color: #3498db;
}

/* Selection highlight */
.aphelion-selection {
  background-color: rgba(52, 152, 219, 0.3);
}
```

### Theme Example: Dark Mode

```css
.dark-theme .aphelion-math-field {
  background-color: #1e1e1e;
  border-color: #444;
  color: #e0e0e0;
}

.dark-theme .aphelion-math-field:focus-within {
  border-color: #64b5f6;
  box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.3);
}

.dark-theme .aphelion-cursor {
  border-color: #64b5f6;
}

.dark-theme .aphelion-selection {
  background-color: rgba(100, 181, 246, 0.4);
}
```

### Theme Example: Minimal

```css
.minimal-theme .aphelion-math-field {
  border: none;
  border-bottom: 2px solid #ddd;
  border-radius: 0;
  padding: 8px 0;
  background: transparent;
}

.minimal-theme .aphelion-math-field:focus-within {
  border-bottom-color: #2196f3;
  box-shadow: none;
}
```

## Inline Styling (React)

```tsx
import { MathField } from "@lumilla/aphelion";

function StyledField() {
  return (
    <MathField
      style={{
        fontSize: "24px",
        padding: "16px",
        border: "2px solid #9c27b0",
        borderRadius: "12px",
        backgroundColor: "#fce4ec",
      }}
      defaultValue="\\frac{1}{2}"
    />
  );
}
```

## CSS Variables

You can define CSS variables for theming:

```css
:root {
  --aphelion-font-size: 18px;
  --aphelion-padding: 12px;
  --aphelion-border-color: #e0e0e0;
  --aphelion-focus-color: #2196f3;
  --aphelion-cursor-color: #2196f3;
  --aphelion-selection-color: rgba(33, 150, 243, 0.3);
}

.aphelion-math-field {
  font-size: var(--aphelion-font-size);
  padding: var(--aphelion-padding);
  border: 2px solid var(--aphelion-border-color);
}

.aphelion-math-field:focus-within {
  border-color: var(--aphelion-focus-color);
}

.aphelion-cursor {
  border-color: var(--aphelion-cursor-color);
}

.aphelion-selection {
  background-color: var(--aphelion-selection-color);
}
```

## Font Customization

### Using Web Fonts

```css
@import url("https://fonts.googleapis.com/css2?family=STIX+Two+Math&display=swap");

.aphelion-math-field {
  font-family: "STIX Two Math", "Times New Roman", serif;
}
```

### Font Size Scaling

```css
/* Base size */
.aphelion-math-field {
  font-size: 20px;
}

/* Subscript/superscript scaling */
.aphelion-math-field .supsub {
  font-size: 0.7em;
}

/* Nested scaling */
.aphelion-math-field .supsub .supsub {
  font-size: 0.7em;
}
```

## Responsive Design

```css
.aphelion-math-field {
  font-size: 16px;
  padding: 8px;
}

@media (min-width: 768px) {
  .aphelion-math-field {
    font-size: 20px;
    padding: 12px;
  }
}

@media (min-width: 1024px) {
  .aphelion-math-field {
    font-size: 24px;
    padding: 16px;
  }
}
```

## Animation

### Cursor Blink

```css
@keyframes aphelion-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.aphelion-cursor {
  animation: aphelion-blink 1s ease-in-out infinite;
}
```

### Focus Transition

```css
.aphelion-math-field {
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.1s ease;
}

.aphelion-math-field:focus-within {
  transform: translateY(-1px);
}
```

## Static Math Styling

For read-only displays:

```css
.aphelion-static-math {
  display: inline-block;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 1.1em;
}

/* Inline in text */
p .aphelion-static-math {
  vertical-align: middle;
  margin: 0 4px;
}

/* Block display */
.display-math .aphelion-static-math {
  display: block;
  text-align: center;
  padding: 16px;
  margin: 16px 0;
  font-size: 1.4em;
}
```

## Complete Theme Example

```css
/* Modern Blue Theme */
.theme-modern-blue {
  --primary: #2196f3;
  --primary-light: #bbdefb;
  --border: #e3f2fd;
  --background: #ffffff;
}

.theme-modern-blue .aphelion-math-field {
  background: var(--background);
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 22px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.theme-modern-blue .aphelion-math-field:focus-within {
  border-color: var(--primary);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.05),
    0 0 0 4px var(--primary-light);
}

.theme-modern-blue .aphelion-cursor {
  border-left: 2px solid var(--primary);
}

.theme-modern-blue .aphelion-selection {
  background: var(--primary-light);
}
```

Usage:

```html
<div class="theme-modern-blue">
  <div id="math-field"></div>
</div>
```
