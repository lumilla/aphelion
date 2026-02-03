---
layout: page
title: Demo
---

<script setup>
//TODO: Rewrite this entire thing
import { ref, onMounted, computed, watch } from 'vue'

const editorContainer = ref(null)
const staticContainers = ref([])
const mathField = ref(null)
const currentLatex = ref('')
const selectedExample = ref('')

const examples = [
  { name: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' },
  { name: "Euler's Identity", latex: 'e^{i\\pi} + 1 = 0' },
  { name: 'Pythagorean Theorem', latex: 'a^2 + b^2 = c^2' },
  { name: 'Summation', latex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}' },
  { name: 'Integral', latex: '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}' },
  { name: 'Matrix', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { name: 'Limit', latex: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1' },
  { name: 'Derivative', latex: '\\frac{d}{dx} e^x = e^x' },
  { name: 'Taylor Series', latex: 'e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!}' },
  { name: "Maxwell's Equations", latex: '\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\epsilon_0}' },
]

const famousEquations = [
  { name: "Euler's Identity", latex: 'e^{i\\pi} + 1 = 0' },
  { name: 'Mass-Energy Equivalence', latex: 'E = mc^2' },
  { name: 'Schrödinger Equation', latex: 'i\\hbar \\frac{\\partial}{\\partial t} \\Psi = \\hat{H} \\Psi' },
  { name: "Cauchy's Integral", latex: 'f(a) = \\frac{1}{2\\pi i} \\oint_\\gamma \\frac{f(z)}{z-a} dz' },
]

onMounted(async () => {
  if (typeof window !== 'undefined' && editorContainer.value) {
    try {
      // Dynamic import for client-side only
      const aphelionModule = await import('@lumilla/aphelion')
      const Aphelion = aphelionModule.Aphelion || aphelionModule.default
      
      const AP = Aphelion.getInterface(3)
      
      // Create main editor
      mathField.value = AP.MathField(editorContainer.value, {
        handlers: {
          edit: (mf) => {
            currentLatex.value = mf.latex()
          }
        }
      })
      
      // Set initial content
      mathField.value.latex(examples[0].latex)
      
      // Create static displays
      famousEquations.forEach((eq, i) => {
        if (staticContainers.value[i]) {
          AP.StaticMath(staticContainers.value[i]).latex(eq.latex)
        }
      })
    } catch (e) {
      console.log('Demo not available:', e)
    }
  }
})

function loadExample(latex) {
  if (mathField.value) {
    mathField.value.latex(latex)
  }
}

function insertCommand(cmd) {
  if (mathField.value) {
    mathField.value.cmd(cmd).focus()
  }
}

function insertLatex(latex) {
  if (mathField.value) {
    mathField.value.write(latex).focus()
  }
}

function clearEditor() {
  if (mathField.value) {
    mathField.value.latex('').focus()
  }
}
</script>

# Interactive Demo

Try it here - no setup required

## Math Editor

<div class="demo-section">
  <div class="toolbar">
    <button @click="insertCommand('\\frac')">Fraction ÷</button>
    <button @click="insertCommand('\\sqrt')">√ Root</button>
    <button @click="insertLatex('\\sum_{}^{}')">∑ Sum</button>
    <button @click="insertLatex('\\int_{}^{}')">∫ Integral</button>
    <button @click="insertLatex('\\prod_{}^{}')">∏ Product</button>
    <button @click="clearEditor()">Clear</button>
  </div>
  
  <div ref="editorContainer" class="math-editor"></div>
  
  <div class="output">
    <strong>LaTeX Output:</strong>
    <code class="latex-output">{{ currentLatex }}</code>
  </div>
</div>

## Example Formulas

Click a formula to load it:

<div class="examples-grid">
  <button 
    v-for="ex in examples" 
    :key="ex.name"
    @click="loadExample(ex.latex)"
    class="example-btn"
  >
    {{ ex.name }}
  </button>
</div>

## Famous equations - static display

<div class="famous-equations">
  <div v-for="(eq, i) in famousEquations" :key="eq.name" class="equation-card">
    <h4>{{ eq.name }}</h4>
    <div :ref="el => staticContainers[i] = el" class="static-math"></div>
  </div>
</div>

## Usage

```javascript
import { Aphelion } from "@lumilla/aphelion";
import "@lumilla/aphelion/styles.css";

const AP = Aphelion.getInterface(3);

const mathField = AP.MathField(document.createElement("div"), {
  handlers: {
    edit: (mf) => console.log(mf.latex()),
  },
});

mathField.latex("\\frac{a}{b}");
assert(mathField.latex().includes("frac"), "Should render fraction");
assert(mathField.latex().includes("a"), "Should contain a");
assert(mathField.latex().includes("b"), "Should contain b");
```

## Keyboard Shortcuts

| Key           | Action                     |
| ------------- | -------------------------- |
| `Tab`         | Move to next field         |
| `Shift+Tab`   | Move to previous field     |
| `Arrow keys`  | Navigate within expression |
| `Backspace`   | Delete left                |
| `Delete`      | Delete right               |
| `/`           | Insert fraction            |
| `^`           | Superscript                |
| `_`           | Subscript                  |
| `(`, `[`, `{` | Auto-matching brackets     |

<style>
.demo-section {
  margin: 2rem 0;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.toolbar button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar button:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand);
}

.math-editor {
  min-height: 80px;
  padding: 1rem;
  border: 2px solid var(--vp-c-brand);
  border-radius: 8px;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  background: var(--vp-c-bg);
}

.output {
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
}

.latex-output {
  display: block;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.example-btn {
  padding: 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.example-btn:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand);
  transform: translateY(-1px);
}

.famous-equations {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.equation-card {
  padding: 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.equation-card h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.static-math {
  font-size: 1.25rem;
  text-align: center;
}
</style>
