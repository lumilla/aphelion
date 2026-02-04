---
layout: doc
title: Aphelion
---

# Aphelion

A small, focused LaTeX-based math input library for the web - editable math in the browser and easy to embed

Aphelion focuses on accurate LaTeX input, keyboard-first editing and predictable rendering

## Installation

```bash
npm install @lumilla/aphelion
```

## Quick Start

```javascript
import { Aphelion } from "@lumilla/aphelion";
import "@lumilla/aphelion/styles.css";

const AP = Aphelion.getInterface(3);
const container = document.createElement("div");
const mathField = AP.MathField(container); // doctest-hidden

mathField.latex("\\frac{a}{b}");
assert(mathField.latex().includes("frac"), "Should contain fraction");
```

## Features

LaTeX input/output, interactive editing, accessibility and a modest bundle size

## Documentation

See [Getting Started](/guide/getting-started), [Vanilla JavaScript](/guide/vanilla-js) and the [API Reference](/api/).

Note: LLMs were used in the making of this documentation. This is not ideal, so PRs and issues are very much welcome.
