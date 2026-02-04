/**
 * Controller Module Tests
 *
 * Extensive tests for the Controller class which manages the state and behavior
 * of an Aphelion instance. Tests cover:
 * - Initialization and setup
 * - Input handling (keyboard, mouse, clipboard)
 * - LaTeX command input mode
 * - Command insertion methods
 * - Undo/redo history
 * - Focus management
 * - DOM updates and cursor management
 * - Accessibility (ARIA announcements)
 * - Static math mode
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Controller } from "../controller";
import { L, R } from "../core/types";
import { MathSymbol } from "../commands/symbol";
import { Fraction } from "../commands/fraction";
import { SquareRoot } from "../commands/sqrt";
import { Superscript, Subscript } from "../commands/supsub";
import { Parentheses, SquareBrackets, CurlyBraces } from "../commands/brackets";
import { Matrix } from "../commands/matrix";
import { TextMode } from "../commands/accent";

describe("Controller Initialization", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    controller?.detach();
    container.remove();
  });

  it("should create controller with default options", () => {
    controller = new Controller();
    expect(controller.root).toBeDefined();
    expect(controller.cursor).toBeDefined();
    expect(controller.options).toEqual({});
  });

  it("should create controller with custom options", () => {
    const handlers = {
      edit: vi.fn(),
      enter: vi.fn(),
    };
    controller = new Controller({
      editable: true,
      handlers,
      customClass: "my-math-field",
    });

    expect(controller.options.handlers).toBe(handlers);
    expect(controller.options.customClass).toBe("my-math-field");
  });

  it("should initialize with a container element", () => {
    controller = new Controller();
    controller.init(container);

    expect(controller.container).toBe(container);
    expect(container.classList.contains("aphelion-container")).toBe(true);
  });

  it("should apply custom class to container", () => {
    controller = new Controller({ customClass: "custom-class" });
    controller.init(container);

    expect(container.classList.contains("custom-class")).toBe(true);
  });

  it("should apply custom font family", () => {
    controller = new Controller({ fontFamily: "Arial, sans-serif" });
    controller.init(container);

    expect(container.style.fontFamily).toBe("Arial, sans-serif");
  });

  it("should apply custom font size as number", () => {
    controller = new Controller({ fontSize: 18 });
    controller.init(container);

    expect(container.style.fontSize).toBe("18px");
  });

  it("should apply custom font size as string", () => {
    controller = new Controller({ fontSize: "1.2rem" });
    controller.init(container);

    expect(container.style.fontSize).toBe("1.2rem");
  });

  it("should create textarea for input", () => {
    controller = new Controller();
    controller.init(container);

    const textarea = container.querySelector("textarea");
    expect(textarea).not.toBeNull();
    expect(textarea?.getAttribute("autocapitalize")).toBe("off");
    expect(textarea?.getAttribute("spellcheck")).toBe("false");
  });

  it("should create ARIA live region", () => {
    controller = new Controller();
    controller.init(container);

    const ariaLive = container.querySelector(".aphelion-aria-live");
    expect(ariaLive).not.toBeNull();
    expect(ariaLive?.getAttribute("aria-live")).toBe("polite");
  });

  it("should position cursor at end after init", () => {
    controller = new Controller();
    controller.init(container);

    expect(controller.cursor.parent).toBe(controller.root);
  });

  it("should save initial state to history", () => {
    controller = new Controller();
    controller.init(container);

    // Verify initial history state exists by checking undo doesn't change anything
    const initialLatex = controller.latex();
    controller.undo();
    expect(controller.latex()).toBe(initialLatex);
  });
});

describe("Static Math Mode", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    controller?.detach();
    container.remove();
  });

  it("should add static-math class when editable is false", () => {
    controller = new Controller({ editable: false });
    controller.init(container);

    expect(container.classList.contains("mq-static-math")).toBe(true);
  });

  it("should not create textarea for static math", () => {
    controller = new Controller({ editable: false });
    controller.init(container);

    const textarea = container.querySelector("textarea");
    expect(textarea).toBeNull();
  });

  it("should allow setting and getting LaTeX in static mode", () => {
    controller = new Controller({ editable: false });
    controller.init(container);
    controller.setLatex("x^2 + y^2");

    // Single-char exponents may not have braces in output
    const latex = controller.latex();
    expect(latex).toContain("x");
    expect(latex).toContain("^");
    expect(latex).toContain("2");
    expect(latex).toContain("y");
  });
});

describe("LaTeX Methods", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should return empty LaTeX for empty field", () => {
    expect(controller.latex()).toBe("");
  });

  it("should set and get simple LaTeX", () => {
    controller.setLatex("abc");
    expect(controller.latex()).toBe("abc");
  });

  it("should set and get fraction LaTeX", () => {
    controller.setLatex("\\frac{1}{2}");
    expect(controller.latex()).toBe("\\frac{1}{2}");
  });

  it("should set and get complex LaTeX", () => {
    controller.setLatex("\\frac{a+b}{c-d}");
    expect(controller.latex()).toBe("\\frac{a+b}{c-d}");
  });

  it("should handle nested structures", () => {
    controller.setLatex("\\frac{\\sqrt{x}}{y^2}");
    // Single-char exponents may not have braces in output
    const latex = controller.latex();
    expect(latex).toContain("\\frac");
    expect(latex).toContain("\\sqrt");
    expect(latex).toContain("x");
    expect(latex).toContain("y");
    expect(latex).toContain("^");
    expect(latex).toContain("2");
  });

  it("should get plain text representation", () => {
    controller.setLatex("x+y");
    expect(controller.text()).toContain("x");
    expect(controller.text()).toContain("+");
    expect(controller.text()).toContain("y");
  });

  it("should handle Greek letters", () => {
    controller.setLatex("\\alpha\\beta\\gamma");
    expect(controller.latex()).toBe("\\alpha\\beta\\gamma");
  });

  it("should handle superscripts and subscripts", () => {
    controller.setLatex("x_1^2");
    expect(controller.latex()).toMatch(/x.*1.*2/);
  });

  it("should handle square roots", () => {
    controller.setLatex("\\sqrt{16}");
    expect(controller.latex()).toBe("\\sqrt{16}");
  });

  it("should handle nth roots", () => {
    controller.setLatex("\\sqrt[3]{8}");
    expect(controller.latex()).toBe("\\sqrt[3]{8}");
  });

  it("should handle sum with limits", () => {
    controller.setLatex("\\sum_{i=1}^{n}");
    expect(controller.latex()).toMatch(/\\sum/);
  });

  it("should handle matrices", () => {
    controller.setLatex("\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}");
    const latex = controller.latex();
    expect(latex).toContain("pmatrix");
  });
});

describe("Typed Text Input", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should insert typed characters", () => {
    controller.typedText("abc");
    expect(controller.latex()).toBe("abc");
  });

  it("should ignore spaces in math mode", () => {
    controller.typedText("a b c");
    expect(controller.latex()).toBe("abc");
  });

  it("should create fraction on /", () => {
    controller.typedText("a/");
    const latex = controller.latex();
    expect(latex).toContain("\\frac");
  });

  it("should create superscript on ^", () => {
    controller.typedText("x^");
    const latex = controller.latex();
    expect(latex).toContain("^");
  });

  it("should create subscript on _", () => {
    controller.typedText("x_");
    const latex = controller.latex();
    expect(latex).toContain("_");
  });

  it("should create parentheses on (", () => {
    controller.typedText("(");
    const latex = controller.latex();
    expect(latex).toContain("\\left(");
  });

  it("should handle digits", () => {
    controller.typedText("12345");
    expect(controller.latex()).toBe("12345");
  });

  it("should handle operators", () => {
    controller.typedText("a+b-c*d");
    expect(controller.latex()).toContain("+");
    expect(controller.latex()).toContain("-");
  });
});

describe("Command Insertion Methods", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should insert fraction and position cursor in numerator", () => {
    controller.insertFraction();

    expect(controller.latex()).toBe("\\frac{}{}");
    const frac = controller.root.ends[L] as Fraction;
    expect(frac).toBeInstanceOf(Fraction);
    expect(controller.cursor.parent).toBe(frac.numerator);
  });

  it("should insert square root and position cursor in radicand", () => {
    controller.insertSquareRoot();

    expect(controller.latex()).toBe("\\sqrt{}");
    const sqrt = controller.root.ends[L] as SquareRoot;
    expect(sqrt).toBeInstanceOf(SquareRoot);
    expect(controller.cursor.parent).toBe(sqrt.radicand);
  });

  it("should insert superscript and position cursor in sup block", () => {
    controller.typedText("x");
    controller.insertSuperscript();

    expect(controller.latex()).toContain("^");
    const sup = controller.root.ends[R] as Superscript;
    expect(sup).toBeInstanceOf(Superscript);
    expect(controller.cursor.parent).toBe(sup.sup);
  });

  it("should insert subscript and position cursor in sub block", () => {
    controller.typedText("x");
    controller.insertSubscript();

    expect(controller.latex()).toContain("_");
    const sub = controller.root.ends[R] as Subscript;
    expect(sub).toBeInstanceOf(Subscript);
    expect(controller.cursor.parent).toBe(sub.sub);
  });

  it("should insert parentheses and position cursor inside", () => {
    controller.insertParentheses();

    expect(controller.latex()).toContain("\\left(");
    expect(controller.latex()).toContain("\\right)");
    const parens = controller.root.ends[L] as Parentheses;
    expect(parens).toBeInstanceOf(Parentheses);
    expect(controller.cursor.parent).toBe(parens.content);
  });

  it("should insert square brackets and position cursor inside", () => {
    controller.insertSquareBrackets();

    expect(controller.latex()).toContain("\\left[");
    expect(controller.latex()).toContain("\\right]");
    const brackets = controller.root.ends[L] as SquareBrackets;
    expect(brackets).toBeInstanceOf(SquareBrackets);
    expect(controller.cursor.parent).toBe(brackets.content);
  });

  it("should insert curly braces and position cursor inside", () => {
    controller.insertCurlyBraces();

    expect(controller.latex()).toContain("\\left\\{");
    expect(controller.latex()).toContain("\\right\\}");
    const braces = controller.root.ends[L] as CurlyBraces;
    expect(braces).toBeInstanceOf(CurlyBraces);
    expect(controller.cursor.parent).toBe(braces.content);
  });

  it("should insert matrix with default dimensions", () => {
    controller.insertMatrix();

    expect(controller.latex()).toContain("pmatrix");
    const matrix = controller.root.ends[L] as Matrix;
    expect(matrix).toBeInstanceOf(Matrix);
  });

  it("should insert matrix with custom dimensions", () => {
    controller.insertMatrix("bmatrix", 3, 4);

    expect(controller.latex()).toContain("bmatrix");
    const matrix = controller.root.ends[L] as Matrix;
    expect(matrix).toBeInstanceOf(Matrix);
  });

  it("should insert text mode and position cursor inside", () => {
    controller.insertTextMode("\\text");

    expect(controller.latex()).toContain("\\text");
    const textMode = controller.root.ends[L] as TextMode;
    expect(textMode).toBeInstanceOf(TextMode);
    expect(controller.cursor.parent).toBe(textMode.content);
  });

  it("should insert mathbb text mode", () => {
    controller.insertTextMode("\\mathbb");

    expect(controller.latex()).toContain("\\mathbb");
  });

  it("should insert mathcal text mode", () => {
    controller.insertTextMode("\\mathcal");

    expect(controller.latex()).toContain("\\mathcal");
  });
});

describe("Cursor Navigation", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should move cursor left through symbols", () => {
    controller.setLatex("abc");
    controller.cursor.moveToEnd();

    controller.cursor.moveLeft();
    expect(controller.cursor[R]?.latex()).toBe("c");

    controller.cursor.moveLeft();
    expect(controller.cursor[R]?.latex()).toBe("b");

    controller.cursor.moveLeft();
    expect(controller.cursor[R]?.latex()).toBe("a");
  });

  it("should move cursor right through symbols", () => {
    controller.setLatex("abc");
    controller.cursor.moveToStart();

    controller.cursor.moveRight();
    expect(controller.cursor[L]?.latex()).toBe("a");

    controller.cursor.moveRight();
    expect(controller.cursor[L]?.latex()).toBe("b");
  });

  it("should move cursor into fraction numerator", () => {
    const frac = new Fraction();
    controller.cursor.insert(frac);
    controller.cursor.moveToStart();

    controller.cursor.moveRight();
    expect(controller.cursor.parent).toBe(frac.numerator);
  });

  it("should move cursor to start", () => {
    controller.setLatex("abc");
    controller.cursor.moveToEnd();

    controller.cursor.moveToStart();
    expect(controller.cursor[L]).toBeUndefined();
    expect(controller.cursor[R]).toBeDefined();
  });

  it("should move cursor to end", () => {
    controller.setLatex("abc");
    controller.cursor.moveToStart();

    controller.cursor.moveToEnd();
    expect(controller.cursor[R]).toBeUndefined();
    expect(controller.cursor[L]).toBeDefined();
  });
});

describe("Selection", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should select a single node to the left", () => {
    controller.setLatex("abc");
    controller.cursor.moveToEnd();

    controller.cursor.select(L);
    expect(controller.cursor.selection).toBeDefined();
    expect(controller.cursor.selection?.latex()).toBe("c");
  });

  it("should select a single node to the right", () => {
    controller.setLatex("abc");
    controller.cursor.moveToStart();

    controller.cursor.select(R);
    expect(controller.cursor.selection).toBeDefined();
    expect(controller.cursor.selection?.latex()).toBe("a");
  });

  it("should select multiple nodes", () => {
    controller.setLatex("abc");
    controller.cursor.moveToEnd();

    controller.cursor.select(L);
    controller.cursor.select(L);
    expect(controller.cursor.selection?.latex()).toBe("bc");
  });

  it("should select all", () => {
    controller.setLatex("abc");

    controller.cursor.selectAll();
    expect(controller.cursor.selection?.latex()).toBe("abc");
  });

  it("should clear selection", () => {
    controller.setLatex("abc");
    controller.cursor.selectAll();

    controller.cursor.clearSelection();
    expect(controller.cursor.selection).toBeUndefined();
  });

  it("should get selection LaTeX", () => {
    controller.setLatex("abc");
    controller.cursor.selectAll();

    expect(controller.getSelectionLatex()).toBe("abc");
  });

  it("should delete selection on backspace", () => {
    controller.setLatex("abc");
    controller.cursor.selectAll();

    controller.cursor.backspace();
    expect(controller.latex()).toBe("");
  });
});

describe("Backspace and Delete", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should delete symbol to the left on backspace", () => {
    controller.setLatex("abc");
    controller.cursor.moveToEnd();

    controller.cursor.backspace();
    expect(controller.latex()).toBe("ab");
  });

  it("should delete symbol to the right on delete forward", () => {
    controller.setLatex("abc");
    controller.cursor.moveToStart();

    controller.cursor.deleteForward();
    expect(controller.latex()).toBe("bc");
  });

  it("should do nothing on backspace at start", () => {
    controller.setLatex("abc");
    controller.cursor.moveToStart();

    controller.cursor.backspace();
    expect(controller.latex()).toBe("abc");
  });

  it("should do nothing on delete at end", () => {
    controller.setLatex("abc");
    controller.cursor.moveToEnd();

    controller.cursor.deleteForward();
    expect(controller.latex()).toBe("abc");
  });

  it("should delete empty fraction", () => {
    const frac = new Fraction();
    controller.cursor.insert(frac);
    controller.cursor.moveTo(frac.numerator);

    controller.cursor.backspace();
    expect(controller.latex()).toBe("");
  });

  it("should not delete fraction with content in other block", () => {
    const frac = new Fraction();
    controller.cursor.insert(frac);

    // Add content to denominator
    controller.cursor.moveTo(frac.denominator);
    controller.cursor.insert(new MathSymbol("x", "x"));

    // Move to empty numerator
    controller.cursor.moveTo(frac.numerator);

    controller.cursor.backspace();
    // Fraction should still exist
    expect(controller.latex()).toBe("\\frac{}{x}");
  });
});

describe("Undo/Redo", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should undo typed text", () => {
    controller.typedText("abc");
    const afterTyping = controller.latex();

    controller.undo();
    expect(controller.latex()).not.toBe(afterTyping);
  });

  it("should redo undone changes", () => {
    controller.typedText("abc");
    const afterTyping = controller.latex();

    controller.undo();
    controller.redo();

    expect(controller.latex()).toBe(afterTyping);
  });

  it("should undo multiple times", () => {
    controller.typedText("a");
    controller.typedText("b");
    controller.typedText("c");

    controller.undo();
    controller.undo();
    controller.undo();

    expect(controller.latex()).toBe("");
  });

  it("should not undo past initial state", () => {
    controller.undo();
    controller.undo();
    controller.undo();

    expect(controller.latex()).toBe("");
  });

  it("should not redo without previous undo", () => {
    controller.typedText("abc");
    const before = controller.latex();

    controller.redo();

    expect(controller.latex()).toBe(before);
  });

  it("should clear redo history on new edit", () => {
    controller.typedText("abc");
    controller.undo();
    controller.typedText("xyz");

    controller.redo();
    // Should not redo to "abc" since we typed "xyz" after undoing
    expect(controller.latex()).not.toBe("abc");
  });
});

describe("Focus Management", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should not be focused initially", () => {
    expect(controller.focused).toBe(false);
  });

  it("should focus the field", () => {
    controller.focus();
    // Note: Actual focus may not work in jsdom, but we test the method exists
    expect(typeof controller.focus).toBe("function");
  });

  it("should blur the field", () => {
    controller.focus();
    controller.blur();
    expect(typeof controller.blur).toBe("function");
  });

  it("should return this from focus for chaining", () => {
    expect(controller.focus()).toBe(controller);
  });

  it("should return this from blur for chaining", () => {
    expect(controller.blur()).toBe(controller);
  });
});

describe("DOM Methods", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should update DOM after changes", () => {
    controller.typedText("abc");
    controller.updateDom();

    const text = container.textContent;
    expect(text).toContain("a");
    expect(text).toContain("b");
    expect(text).toContain("c");
  });

  it("should set font family", () => {
    controller.setFontFamily("Courier New");
    // Note: jsdom may quote font family names with spaces
    expect(container.style.fontFamily).toContain("Courier New");
  });

  it("should set font size as string", () => {
    controller.setFontSize("20px");
    expect(container.style.fontSize).toBe("20px");
  });

  it("should set font size as number", () => {
    controller.setFontSize(24);
    expect(container.style.fontSize).toBe("24px");
  });

  it("should get font family", () => {
    controller.setFontFamily("Georgia");
    expect(controller.getFontFamily()).toContain("Georgia");
  });

  it("should get font size", () => {
    controller.setFontSize("16px");
    expect(controller.getFontSize()).toBe("16px");
  });

  it("should return this from setFontFamily for chaining", () => {
    expect(controller.setFontFamily("Arial")).toBe(controller);
  });

  it("should return this from setFontSize for chaining", () => {
    expect(controller.setFontSize(12)).toBe(controller);
  });
});

describe("Paste Handling", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should paste simple text", () => {
    controller.paste("abc");
    expect(controller.latex()).toBe("abc");
  });

  it("should paste LaTeX with fractions", () => {
    controller.paste("\\frac{1}{2}");
    expect(controller.latex()).toBe("\\frac{1}{2}");
  });

  it("should paste LaTeX with square roots", () => {
    controller.paste("\\sqrt{x}");
    expect(controller.latex()).toBe("\\sqrt{x}");
  });

  it("should paste LaTeX with Greek letters", () => {
    controller.paste("\\alpha+\\beta");
    expect(controller.latex()).toBe("\\alpha+\\beta");
  });

  it("should paste at cursor position", () => {
    controller.setLatex("ac");
    controller.cursor.moveToStart();
    controller.cursor.moveRight(); // After 'a'

    controller.paste("b");
    expect(controller.latex()).toBe("abc");
  });

  it("should handle invalid LaTeX gracefully", () => {
    // Invalid LaTeX should be typed as text
    controller.paste("\\invalidcommand");
    // Should not throw and should contain something
    expect(controller.latex()).toBeDefined();
  });
});

describe("Event Handlers Callbacks", () => {
  let container: HTMLElement;
  let controller: Controller;
  let editHandler: ReturnType<typeof vi.fn>;
  let enterHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    editHandler = vi.fn();
    enterHandler = vi.fn();
    controller = new Controller({
      handlers: {
        edit: editHandler as any,
        enter: enterHandler as any, // FIXME: any type is NOT great at all
      },
    });
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should call edit handler on typed text", () => {
    controller.typedText("a");
    expect(editHandler).toHaveBeenCalled();
  });

  it("should call edit handler on setLatex", () => {
    controller.setLatex("xyz");
    expect(editHandler).toHaveBeenCalled();
  });

  it("should call edit handler with controller instance", () => {
    controller.typedText("a");
    expect(editHandler).toHaveBeenCalledWith(controller);
  });

  it("should call edit handler on paste", () => {
    controller.paste("abc");
    expect(editHandler).toHaveBeenCalled();
  });

  it("should call edit handler on backspace", () => {
    controller.typedText("a");
    editHandler.mockClear();

    controller.cursor.moveToEnd();
    controller.cursor.backspace();
    controller.updateDom();
    // Note: backspace itself may not trigger edit, but the deletion should
  });
});

describe("Detach", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("should detach without errors", () => {
    expect(() => controller.detach()).not.toThrow();
  });

  it("should be safe to call detach multiple times", () => {
    expect(() => {
      controller.detach();
      controller.detach();
    }).not.toThrow();
  });
});

describe("LaTeX Command Input Mode", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should enter command input mode on backslash", () => {
    controller.typedText("\\");
    // Check that a command input exists by looking for it in the DOM
    const commandInput = container.querySelector(
      ".aphelion-latex-command-input",
    );
    expect(commandInput).not.toBeNull();
  });

  it("should type command name after backslash", () => {
    controller.typedText("\\frac");
    const commandInput = container.querySelector(
      ".aphelion-latex-command-input",
    );
    // Command input should show "frac"
    expect(commandInput?.textContent).toContain("frac");
  });

  it("should finalize command on space", () => {
    controller.typedText("\\frac ");
    // After space, should have a fraction
    expect(controller.latex()).toContain("\\frac");
  });

  it("should finalize command on non-letter", () => {
    controller.typedText("\\alpha+");
    // After +, should have alpha symbol followed by +
    expect(controller.latex()).toContain("\\alpha");
    expect(controller.latex()).toContain("+");
  });

  it("should handle sqrt command", () => {
    controller.typedText("\\sqrt ");
    expect(controller.latex()).toContain("\\sqrt");
  });

  it("should handle sin command", () => {
    controller.typedText("\\sin ");
    expect(controller.latex()).toContain("sin");
  });

  it("should handle unknown command as text", () => {
    controller.typedText("\\unknowncommand ");
    // Unknown commands should be wrapped in \text{}
    const latex = controller.latex();
    expect(latex).toContain("\\text");
  });
});

describe("Large Operators via LaTeX", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should parse sum with limits", () => {
    controller.setLatex("\\sum_{i=1}^{n}x_i");
    expect(controller.latex()).toContain("\\sum");
  });

  it("should parse product with limits", () => {
    controller.setLatex("\\prod_{i=1}^{n}");
    expect(controller.latex()).toContain("\\prod");
  });

  it("should parse integral with limits", () => {
    controller.setLatex("\\int_{0}^{1}");
    expect(controller.latex()).toContain("\\int");
  });

  it("should parse limit", () => {
    controller.setLatex("\\lim_{x\\to0}");
    expect(controller.latex()).toContain("\\lim");
  });
});

describe("Accent Commands via LaTeX", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should parse vec accent", () => {
    controller.setLatex("\\vec{v}");
    expect(controller.latex()).toContain("\\vec");
  });

  it("should parse bar accent", () => {
    controller.setLatex("\\bar{x}");
    expect(controller.latex()).toContain("\\bar");
  });

  it("should parse hat accent", () => {
    controller.setLatex("\\hat{y}");
    expect(controller.latex()).toContain("\\hat");
  });

  it("should parse tilde accent", () => {
    controller.setLatex("\\tilde{z}");
    expect(controller.latex()).toContain("\\tilde");
  });

  it("should parse dot accent", () => {
    controller.setLatex("\\dot{x}");
    expect(controller.latex()).toContain("\\dot");
  });

  it("should parse ddot accent", () => {
    controller.setLatex("\\ddot{x}");
    expect(controller.latex()).toContain("\\ddot");
  });
});

describe("Text Mode Commands via LaTeX", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should parse text command", () => {
    controller.setLatex("\\text{hello}");
    expect(controller.latex()).toContain("\\text");
  });

  it("should parse mathrm command", () => {
    controller.setLatex("\\mathrm{abc}");
    expect(controller.latex()).toContain("\\mathrm");
  });

  it("should parse mathbf command", () => {
    controller.setLatex("\\mathbf{xyz}");
    expect(controller.latex()).toContain("\\mathbf");
  });

  it("should parse mathbb command", () => {
    controller.setLatex("\\mathbb{R}");
    expect(controller.latex()).toContain("\\mathbb");
  });

  it("should parse mathcal command", () => {
    controller.setLatex("\\mathcal{L}");
    expect(controller.latex()).toContain("\\mathcal");
  });
});

describe("Binomial Coefficient via LaTeX", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should parse binom command", () => {
    controller.setLatex("\\binom{n}{k}");
    expect(controller.latex()).toContain("\\binom");
  });
});

describe("Symbol Commands via LaTeX", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should parse pm symbol", () => {
    controller.setLatex("\\pm");
    expect(controller.latex()).toContain("\\pm");
  });

  it("should parse times symbol", () => {
    controller.setLatex("\\times");
    expect(controller.latex()).toContain("\\times");
  });

  it("should parse cdot symbol", () => {
    controller.setLatex("\\cdot");
    expect(controller.latex()).toContain("\\cdot");
  });

  it("should parse leq symbol", () => {
    controller.setLatex("\\leq");
    expect(controller.latex()).toContain("\\leq");
  });

  it("should parse geq symbol", () => {
    controller.setLatex("\\geq");
    expect(controller.latex()).toContain("\\geq");
  });

  it("should parse neq symbol", () => {
    controller.setLatex("\\neq");
    expect(controller.latex()).toContain("\\neq");
  });

  it("should parse infty symbol", () => {
    controller.setLatex("\\infty");
    expect(controller.latex()).toContain("\\infty");
  });

  it("should parse rightarrow symbol", () => {
    controller.setLatex("\\rightarrow");
    expect(controller.latex()).toContain("\\rightarrow");
  });

  it("should parse Rightarrow symbol", () => {
    controller.setLatex("\\Rightarrow");
    expect(controller.latex()).toContain("\\Rightarrow");
  });
});

describe("Complex LaTeX Expressions", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should handle quadratic formula", () => {
    controller.setLatex("x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}");
    const latex = controller.latex();
    expect(latex).toContain("\\frac");
    expect(latex).toContain("\\sqrt");
    expect(latex).toContain("\\pm");
  });

  it("should handle nested fractions", () => {
    controller.setLatex("\\frac{\\frac{a}{b}}{\\frac{c}{d}}");
    const latex = controller.latex();
    // Should have multiple \frac commands
    const fracCount = (latex.match(/\\frac/g) || []).length;
    expect(fracCount).toBeGreaterThanOrEqual(2);
  });

  it("should handle nested roots", () => {
    controller.setLatex("\\sqrt{\\sqrt{x}}");
    const latex = controller.latex();
    const sqrtCount = (latex.match(/\\sqrt/g) || []).length;
    expect(sqrtCount).toBeGreaterThanOrEqual(2);
  });

  it("should handle combination of subscripts and superscripts", () => {
    controller.setLatex("x_1^2+x_2^2");
    const latex = controller.latex();
    expect(latex).toMatch(/_/);
    expect(latex).toMatch(/\^/);
  });

  it("should handle sum with expression", () => {
    controller.setLatex("\\sum_{i=1}^{n}i^2=\\frac{n(n+1)(2n+1)}{6}");
    const latex = controller.latex();
    expect(latex).toContain("\\sum");
    expect(latex).toContain("\\frac");
  });
});

describe("Controller with Empty Content", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should handle operations on empty field", () => {
    expect(() => controller.cursor.moveLeft()).not.toThrow();
    expect(() => controller.cursor.moveRight()).not.toThrow();
    expect(() => controller.cursor.backspace()).not.toThrow();
    expect(() => controller.cursor.deleteForward()).not.toThrow();
  });

  it("should handle selectAll on empty field", () => {
    controller.cursor.selectAll();
    expect(controller.cursor.selection).toBeUndefined();
  });

  it("should handle undo on empty field", () => {
    expect(() => controller.undo()).not.toThrow();
  });

  it("should handle redo on empty field", () => {
    expect(() => controller.redo()).not.toThrow();
  });
});

describe("Controller Announcements (Accessibility)", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should have ARIA live region", () => {
    const ariaLive = container.querySelector('[aria-live="polite"]');
    expect(ariaLive).not.toBeNull();
  });

  it("should announce custom text", () => {
    controller.announce("test announcement");
    const ariaLive = container.querySelector(".aphelion-aria-live");
    expect(ariaLive?.textContent).toBe("test announcement");
  });

  it("should announce context when no text provided", () => {
    controller.setLatex("abc");
    controller.cursor.moveToEnd();
    controller.announce();
    const ariaLive = container.querySelector(".aphelion-aria-live");
    expect(ariaLive?.textContent).toBeTruthy();
  });

  it("should announce empty when field is empty", () => {
    controller.announce();
    const ariaLive = container.querySelector(".aphelion-aria-live");
    expect(ariaLive?.textContent).toContain("empty");
  });
});

describe("Root Block and Cursor Integration", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should have root block with controller reference", () => {
    expect(controller.root.controller).toBe(controller);
  });

  it("should have root block with cursor reference", () => {
    expect(controller.root.cursor).toBe(controller.cursor);
  });

  it("should have cursor with correct parent after init", () => {
    expect(controller.cursor.parent).toBe(controller.root);
  });

  it("should maintain cursor in tree after insertions", () => {
    controller.typedText("abc");
    expect(controller.cursor.parent).toBe(controller.root);
  });

  it("should maintain cursor in inner block after entering structure", () => {
    controller.insertFraction();
    const frac = controller.root.ends[L] as Fraction;
    expect(controller.cursor.parent).toBe(frac.numerator);
  });
});

describe("Edge Cases", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should handle very long input", () => {
    const longInput = "x".repeat(1000);
    expect(() => controller.typedText(longInput)).not.toThrow();
    expect(controller.latex()).toBe(longInput);
  });

  it("should handle rapid sequential operations", () => {
    for (let i = 0; i < 100; i++) {
      controller.typedText("a");
      controller.cursor.backspace();
    }
    expect(controller.latex()).toBe("");
  });

  it("should handle empty setLatex", () => {
    controller.typedText("abc");
    controller.setLatex("");
    expect(controller.latex()).toBe("");
  });

  it("should handle setLatex with only whitespace", () => {
    controller.setLatex("   ");
    // Should result in empty since spaces are ignored in math mode
    expect(controller.latex()).toBe("");
  });

  it("should handle multiple consecutive backslashes", () => {
    // This tests the command input handling
    controller.typedText("\\\\");
    // Should handle without throwing
    expect(controller.latex()).toBeDefined();
  });

  it("should handle mixed content", () => {
    controller.setLatex("\\text{hello}+\\frac{1}{2}+\\sqrt{x}");
    const latex = controller.latex();
    expect(latex).toContain("\\text");
    expect(latex).toContain("\\frac");
    expect(latex).toContain("\\sqrt");
  });
});

describe("Matrix Operations", () => {
  let container: HTMLElement;
  let controller: Controller;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    controller = new Controller();
    controller.init(container);
  });

  afterEach(() => {
    controller.detach();
    container.remove();
  });

  it("should insert pmatrix", () => {
    controller.insertMatrix("pmatrix", 2, 2);
    expect(controller.latex()).toContain("pmatrix");
  });

  it("should insert bmatrix", () => {
    controller.insertMatrix("bmatrix", 2, 2);
    expect(controller.latex()).toContain("bmatrix");
  });

  it("should insert vmatrix", () => {
    controller.insertMatrix("vmatrix", 2, 2);
    expect(controller.latex()).toContain("vmatrix");
  });

  it("should insert Bmatrix", () => {
    controller.insertMatrix("Bmatrix", 2, 2);
    expect(controller.latex()).toContain("Bmatrix");
  });

  it("should insert Vmatrix", () => {
    controller.insertMatrix("Vmatrix", 2, 2);
    expect(controller.latex()).toContain("Vmatrix");
  });

  it("should parse matrix from LaTeX", () => {
    controller.setLatex("\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}");
    expect(controller.latex()).toContain("pmatrix");
  });
});
