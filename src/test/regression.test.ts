/**
 * Regression tests for bug fixes
 *
 * These tests ensure that fixed bugs don't regress.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { L, R } from "../core/types";
import { RootBlock, InnerBlock } from "../core/blocks";
import { MathSymbol } from "../commands/symbol";
import { Cursor } from "../core/cursor";
import { Fraction } from "../commands/fraction";
import { Summation, Product, Integral, Limit } from "../commands/largeops";
import { TextMode } from "../commands/accent";
import { Superscript, Subscript } from "../commands/supsub";
import { SquareRoot } from "../commands/sqrt";

describe("Up/Down Navigation in LargeOperators", () => {
  let root: RootBlock;
  let cursor: Cursor;

  beforeEach(() => {
    root = new RootBlock();
    cursor = new Cursor(root);
  });

  it("should have upper limit as ends[L] for proper up navigation", () => {
    const sum = new Summation(true);
    cursor.insert(sum);

    // ends[L] should be upper (for up navigation)
    // ends[R] should be lower (for down navigation)
    expect(sum.ends[L]).toBe(sum.upper);
    expect(sum.ends[R]).toBe(sum.lower);
  });

  it("should navigate up from lower to upper limit", () => {
    const sum = new Summation(true);
    cursor.insert(sum);

    // Move into lower limit
    cursor.moveTo(sum.lower!);
    expect(cursor.parent).toBe(sum.lower);

    // Move up should go to upper
    cursor.moveUp();
    expect(cursor.parent).toBe(sum.upper);
  });

  it("should navigate down from upper to lower limit", () => {
    const sum = new Summation(true);
    cursor.insert(sum);

    // Move into upper limit
    cursor.moveTo(sum.upper!);
    expect(cursor.parent).toBe(sum.upper);

    // Move down should go to lower
    cursor.moveDown();
    expect(cursor.parent).toBe(sum.lower);
  });

  it("should work with Integral", () => {
    const integral = new Integral(true);
    cursor.insert(integral);

    expect(integral.ends[L]).toBe(integral.upper);
    expect(integral.ends[R]).toBe(integral.lower);
  });

  it("should work with Product", () => {
    const prod = new Product(true);
    cursor.insert(prod);

    expect(prod.ends[L]).toBe(prod.upper);
    expect(prod.ends[R]).toBe(prod.lower);
  });
});

describe("Backspace Protection for Containers with Content", () => {
  let root: RootBlock;
  let cursor: Cursor;

  beforeEach(() => {
    root = new RootBlock();
    cursor = new Cursor(root);
  });

  it("should not delete fraction when denominator has content", () => {
    const frac = new Fraction();
    cursor.insert(frac);

    // Add content to denominator
    cursor.moveTo(frac.denominator);
    const sym = new MathSymbol("x", "x");
    cursor.insert(sym);

    // Move to empty numerator
    cursor.moveTo(frac.numerator);

    // Try to backspace out
    cursor.backspace();

    // Fraction should still exist
    expect(root.ends[L]).toBe(frac);
    expect(frac.denominator.ends[L]).toBe(sym);
  });

  it("should not delete fraction when numerator has content", () => {
    const frac = new Fraction();
    cursor.insert(frac);

    // Add content to numerator
    cursor.moveTo(frac.numerator);
    const sym = new MathSymbol("x", "x");
    cursor.insert(sym);

    // Move to empty denominator
    cursor.moveTo(frac.denominator);

    // Try to backspace out
    cursor.backspace();

    // Fraction should still exist
    expect(root.ends[L]).toBe(frac);
    expect(frac.numerator.ends[L]).toBe(sym);
  });

  it("should delete fraction when both blocks are empty", () => {
    const frac = new Fraction();
    cursor.insert(frac);

    // Move to numerator (empty)
    cursor.moveTo(frac.numerator);

    // Backspace should delete the fraction
    cursor.backspace();

    // Fraction should be gone
    expect(root.ends[L]).toBeUndefined();
  });

  it("should not delete sum when lower limit has content", () => {
    const sum = new Summation(true);
    cursor.insert(sum);

    // Add content to lower limit
    cursor.moveTo(sum.lower!);
    const sym = new MathSymbol("i", "i");
    cursor.insert(sym);

    // Move to empty upper limit
    cursor.moveTo(sum.upper!);

    // Try to backspace out
    cursor.backspace();

    // Sum should still exist
    expect(root.ends[L]).toBe(sum);
    expect(sum.lower!.ends[L]).toBe(sym);
  });
});

describe("Limit Class", () => {
  let root: RootBlock;
  let cursor: Cursor;

  beforeEach(() => {
    root = new RootBlock();
    cursor = new Cursor(root);
  });

  it("should create Limit with subscript", () => {
    const lim = new Limit(true);
    cursor.insert(lim);

    expect(lim.subscript).toBeDefined();
    expect(lim.subscript!.parent).toBe(lim);
    expect(lim.ends[L]).toBe(lim.subscript);
    expect(lim.ends[R]).toBe(lim.subscript);
  });

  it("should generate correct LaTeX with subscript", () => {
    const lim = new Limit(true);
    cursor.insert(lim);

    cursor.moveTo(lim.subscript!);
    cursor.insert(new MathSymbol("n", "n"));
    cursor.insert(new MathSymbol("→", "\\to"));
    cursor.insert(new MathSymbol("∞", "\\infty"));

    expect(lim.latex()).toBe("\\lim_{n\\to\\infty}");
  });

  it("should create Limit without subscript", () => {
    const lim = new Limit(false);
    cursor.insert(lim);

    expect(lim.subscript).toBeUndefined();
    expect(lim.latex()).toBe("\\lim");
  });
});

describe("TextMode Auto-Exit", () => {
  it("should mark mathbb for auto-exit", () => {
    const textMode = new TextMode("\\mathbb");
    expect(textMode.autoExitAfterOne).toBe(true);
  });

  it("should mark mathcal for auto-exit", () => {
    const textMode = new TextMode("\\mathcal");
    expect(textMode.autoExitAfterOne).toBe(true);
  });

  it("should mark mathfrak for auto-exit", () => {
    const textMode = new TextMode("\\mathfrak");
    expect(textMode.autoExitAfterOne).toBe(true);
  });

  it("should mark mathscr for auto-exit", () => {
    const textMode = new TextMode("\\mathscr");
    expect(textMode.autoExitAfterOne).toBe(true);
  });

  it("should NOT mark text for auto-exit", () => {
    const textMode = new TextMode("\\text");
    expect(textMode.autoExitAfterOne).toBe(false);
  });

  it("should NOT mark mathrm for auto-exit", () => {
    const textMode = new TextMode("\\mathrm");
    expect(textMode.autoExitAfterOne).toBe(false);
  });
});

describe("InnerBlock Empty State", () => {
  it("should add placeholder when empty and showPlaceholder is true", () => {
    const block = new InnerBlock();
    block.showPlaceholder = true;
    block.updateDom();

    const placeholder = block.domElement.querySelector(".aphelion-placeholder");
    expect(placeholder).not.toBeNull();
    expect(block.domElement.classList.contains("aphelion-empty")).toBe(false);
  });

  it("should add mq-empty when empty and showPlaceholder is false", () => {
    const block = new InnerBlock();
    block.showPlaceholder = false;
    block.updateDom();

    const placeholder = block.domElement.querySelector(".aphelion-placeholder");
    expect(placeholder).toBeNull();
    expect(block.domElement.classList.contains("aphelion-empty")).toBe(true);
  });

  it("should not have double boxes (placeholder AND aphelion-empty)", () => {
    const block = new InnerBlock();
    block.showPlaceholder = true;
    block.updateDom();

    const placeholder = block.domElement.querySelector(".aphelion-placeholder");
    const hasEmptyClass = block.domElement.classList.contains("aphelion-empty");

    // Should have placeholder XOR aphelion-empty, not both
    expect(placeholder !== null && hasEmptyClass).toBe(false);
  });

  it("should remove empty indicators when block has content", () => {
    const block = new InnerBlock();
    const sym = new MathSymbol("x", "x");

    // Add content
    sym.parent = block;
    block.ends[L] = sym;
    block.ends[R] = sym;

    block.updateDom();

    const placeholder = block.domElement.querySelector(".aphelion-placeholder");
    expect(placeholder).toBeNull();
    expect(block.domElement.classList.contains("aphelion-empty")).toBe(false);
  });
});

describe("LargeOperator LaTeX Generation", () => {
  let root: RootBlock;
  let cursor: Cursor;

  beforeEach(() => {
    root = new RootBlock();
    cursor = new Cursor(root);
  });

  it("should generate sum with limits", () => {
    const sum = new Summation(true);
    cursor.insert(sum);

    cursor.moveTo(sum.lower!);
    cursor.insert(new MathSymbol("i", "i"));
    cursor.insert(new MathSymbol("=", "="));
    cursor.insert(new MathSymbol("1", "1"));

    cursor.moveTo(sum.upper!);
    cursor.insert(new MathSymbol("n", "n"));

    expect(sum.latex()).toBe("\\sum_{i=1}^{n}");
  });

  it("should generate integral with limits", () => {
    const integral = new Integral(true);
    cursor.insert(integral);

    cursor.moveTo(integral.lower!);
    cursor.insert(new MathSymbol("0", "0"));

    cursor.moveTo(integral.upper!);
    cursor.insert(new MathSymbol("∞", "\\infty"));

    expect(integral.latex()).toBe("\\int_{0}^{\\infty}");
  });

  it("should generate product with limits", () => {
    const prod = new Product(true);
    cursor.insert(prod);

    cursor.moveTo(prod.lower!);
    cursor.insert(new MathSymbol("k", "k"));
    cursor.insert(new MathSymbol("=", "="));
    cursor.insert(new MathSymbol("1", "1"));

    cursor.moveTo(prod.upper!);
    cursor.insert(new MathSymbol("n", "n"));

    expect(prod.latex()).toBe("\\prod_{k=1}^{n}");
  });
});

describe("TextMode LaTeX Generation", () => {
  let root: RootBlock;
  let cursor: Cursor;

  beforeEach(() => {
    root = new RootBlock();
    cursor = new Cursor(root);
  });

  it("should generate \\mathbb correctly", () => {
    const textMode = new TextMode("\\mathbb");
    cursor.insert(textMode);

    cursor.moveTo(textMode.content);
    cursor.insert(new MathSymbol("R", "R"));

    expect(textMode.latex()).toBe("\\mathbb{R}");
  });

  it("should generate \\text correctly", () => {
    const textMode = new TextMode("\\text");
    cursor.insert(textMode);

    cursor.moveTo(textMode.content);
    cursor.insert(new MathSymbol("h", "h"));
    cursor.insert(new MathSymbol("e", "e"));
    cursor.insert(new MathSymbol("l", "l"));
    cursor.insert(new MathSymbol("l", "l"));
    cursor.insert(new MathSymbol("o", "o"));

    expect(textMode.latex()).toBe("\\text{hello}");
  });
});

describe("SquareRoot", () => {
  let root: RootBlock;
  let cursor: Cursor;

  beforeEach(() => {
    root = new RootBlock();
    cursor = new Cursor(root);
  });

  it("should create sqrt with radicand", () => {
    const sqrt = new SquareRoot();
    cursor.insert(sqrt);

    expect(sqrt.radicand).toBeDefined();
    expect(sqrt.radicand.parent).toBe(sqrt);
    expect(sqrt.ends[L]).toBe(sqrt.radicand);
    expect(sqrt.ends[R]).toBe(sqrt.radicand);
  });

  it("should generate correct LaTeX", () => {
    const sqrt = new SquareRoot();
    cursor.insert(sqrt);

    cursor.moveTo(sqrt.radicand);
    cursor.insert(new MathSymbol("x", "x"));

    expect(sqrt.latex()).toBe("\\sqrt{x}");
  });

  it("should generate correct text", () => {
    const sqrt = new SquareRoot();
    cursor.insert(sqrt);

    cursor.moveTo(sqrt.radicand);
    cursor.insert(new MathSymbol("x", "x"));

    expect(sqrt.text()).toBe("sqrt(x)");
  });
});
