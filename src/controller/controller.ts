/**
 * Aphelion - Controller
 *
 * The controller manages the state and behavior of an Aphelion instance.
 * It coordinates between the tree, cursor, DOM, and input handling.
 */

import { RootBlock, MathBlock } from "../core/blocks";
import { Cursor } from "../core/cursor";
import { NodeBase } from "../core/node";
import { EditorConfig, L, R } from "../core/types";
import { createSymbolFromChar, MathSymbol } from "../commands/symbol";
import { Fraction } from "../commands/fraction";
import { SquareRoot, NthRoot } from "../commands/sqrt";
import { Subscript, Superscript, SupSub } from "../commands/supsub";
import { Parentheses, SquareBrackets, CurlyBraces } from "../commands/brackets";
import { OperatorName } from "../commands/text";
import { BinomialCoefficient } from "../commands/binom";
import {
  LatexCommandInput,
  LATEX_COMMANDS,
} from "../commands/latexCommandInput";
import { Matrix } from "../commands/matrix";
import { Accent, TextMode } from "../commands/accent";
import { parseLatex, LatexNode } from "../parser";
import {
  LargeOperator,
  Summation,
  Product,
  Integral,
  DoubleIntegral,
  TripleIntegral,
  ContourIntegral,
  BigUnion,
  BigIntersection,
  Limit,
} from "../commands/largeops";

/**
 * Controller for an Aphelion instance.
 */
export class Controller {
  /** The root block */
  readonly root: RootBlock;

  /** The cursor */
  readonly cursor: Cursor;

  /** Configuration options */
  readonly options: EditorConfig;

  /** The container element */
  container?: HTMLElement;

  /** The hidden textarea for input */
  textarea?: HTMLTextAreaElement;

  /** Whether the field is currently focused */
  private _focused = false;

  /** ARIA live region for announcements */
  private ariaLive?: HTMLElement;

  /** Undo/redo history */
  private history: string[] = [];
  private historyIndex = -1;
  private maxHistory = 50;

  /** Current LaTeX command input (if in command mode) */
  private _commandInput?: LatexCommandInput;

  constructor(options: EditorConfig = {}) {
    this.options = options;
    this.root = new RootBlock();
    this.root.controller = this;
    this.cursor = new Cursor(this.root, options);
    this.root.cursor = this.cursor;
  }

  /**
   * Initialize the controller with a container element.
   */
  init(container: HTMLElement): this {
    this.container = container;
    container.classList.add("aphelion-container");

    // Apply custom class if specified
    if (this.options.customClass) {
      container.classList.add(this.options.customClass);
    }

    // Apply font customization
    if (this.options.fontFamily) {
      container.style.fontFamily = this.options.fontFamily;
    }
    if (this.options.fontSize) {
      container.style.fontSize =
        typeof this.options.fontSize === "number"
          ? `${this.options.fontSize}px`
          : this.options.fontSize;
    }

    // Create the root element
    this.root.updateDom();
    container.appendChild(this.root.domElement);

    // For static (non-editable) math, skip all interactive setup
    // but keep copy functionality
    if (this.options.editable === false) {
      container.classList.add("mq-static-math");
      // Enable copy for static math via container selection
      container.addEventListener("copy", this.handleStaticCopy);
      return this;
    }

    // Create and attach hidden textarea for input
    this.createTextarea();

    // Create ARIA live region
    this.createAriaLive();

    // Set up event listeners
    this.attachEventListeners();

    // Initial cursor position
    this.cursor.moveToEnd().show().startBlink();

    // Save initial state
    this.saveHistory();

    return this;
  }

  /**
   * Create the hidden textarea for capturing input.
   */
  private createTextarea(): void {
    const textareaSpan = document.createElement("span");
    textareaSpan.className = "aphelion-textarea";

    const textarea = document.createElement("textarea");
    textarea.setAttribute("autocapitalize", "off");
    textarea.setAttribute("autocomplete", "off");
    textarea.setAttribute("autocorrect", "off");
    textarea.setAttribute("spellcheck", "false");
    textarea.setAttribute("tabindex", "0");
    textarea.setAttribute("aria-hidden", "true");

    textareaSpan.appendChild(textarea);
    this.container?.prepend(textareaSpan);
    this.textarea = textarea;
  }

  /**
   * Create ARIA live region for screen reader announcements.
   */
  private createAriaLive(): void {
    const ariaLive = document.createElement("span");
    ariaLive.className = "aphelion-aria-live";
    ariaLive.setAttribute("aria-live", "polite");
    ariaLive.setAttribute("aria-atomic", "true");
    this.container?.appendChild(ariaLive);
    this.ariaLive = ariaLive;
  }

  /**
   * Attach event listeners.
   */
  private attachEventListeners(): void {
    if (!this.container || !this.textarea) return;

    // Focus management
    this.container.addEventListener("mousedown", this.handleMouseDown);
    this.textarea.addEventListener("focus", this.handleFocus);
    this.textarea.addEventListener("blur", this.handleBlur);

    // Mouse drag selection
    this.container.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);

    // Keyboard input
    this.textarea.addEventListener("keydown", this.handleKeyDown);
    this.textarea.addEventListener("input", this.handleInput);
    this.textarea.addEventListener("paste", this.handlePaste);
    this.textarea.addEventListener("cut", this.handleCut);
    this.textarea.addEventListener("copy", this.handleCopy);
  }

  /**
   * Remove event listeners.
   */
  detach(): void {
    if (this.container) {
      this.container.removeEventListener("mousedown", this.handleMouseDown);
      this.container.removeEventListener("mousemove", this.handleMouseMove);
      // Remove static copy listener if present
      this.container.removeEventListener("copy", this.handleStaticCopy);
    }
    document.removeEventListener("mouseup", this.handleMouseUp);
    if (this.textarea) {
      this.textarea.removeEventListener("focus", this.handleFocus);
      this.textarea.removeEventListener("blur", this.handleBlur);
      this.textarea.removeEventListener("keydown", this.handleKeyDown);
      this.textarea.removeEventListener("input", this.handleInput);
      this.textarea.removeEventListener("paste", this.handlePaste);
      this.textarea.removeEventListener("cut", this.handleCut);
      this.textarea.removeEventListener("copy", this.handleCopy);
    }
  }

  // --- Event Handlers ---

  /** Whether mouse button is currently held down for drag selection */
  private _isDragging = false;

  /** Starting X position for drag selection */
  private _dragStartX = 0;

  /** The anticursor position saved when drag started */
  private _dragStarted = false;

  private handleMouseDown = (e: MouseEvent): void => {
    e.preventDefault();
    this.focus();

    // Clear any existing selection
    this.cursor.clearSelection();

    // Find clicked position and move cursor there
    const target = e.target as HTMLElement;
    this.seekToElement(target, e.clientX);

    // Start drag selection
    this._isDragging = true;
    this._dragStartX = e.clientX;
    this._dragStarted = false;
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this._isDragging) return;

    // Only start selection if mouse has moved enough
    const dx = Math.abs(e.clientX - this._dragStartX);
    if (dx < 3) return;

    // Start selection on first move
    if (!this._dragStarted) {
      this.cursor.startSelection();
      this._dragStarted = true;
    }

    // Determine direction and select
    const dir = e.clientX > this._dragStartX ? R : L;

    // Try to select in the current direction
    const sibling = this.cursor[dir];
    if (sibling) {
      // Check if mouse is past this sibling
      const rect = sibling.domElement?.getBoundingClientRect();
      if (rect) {
        const pastSibling =
          dir === R ? e.clientX > rect.right : e.clientX < rect.left;
        if (pastSibling) {
          this.cursor.select(dir);
          this.updateDom();
        }
      }
    }
  };

  private handleMouseUp = (): void => {
    this._isDragging = false;
    this._dragStarted = false;
  };

  private handleFocus = (): void => {
    this._focused = true;
    this.container?.classList.add("aphelion-focused");
    this.cursor.show().startBlink();
    this.options.handlers?.enter?.(this);
  };

  private handleBlur = (): void => {
    this._focused = false;
    this.container?.classList.remove("aphelion-focused");
    this.cursor.hide();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = this.getKeyName(e);
    // Normalize arrow key names
    const normalizedKey = key
      .replace("ArrowLeft", "Left")
      .replace("ArrowRight", "Right")
      .replace("ArrowUp", "Up")
      .replace("ArrowDown", "Down");

    // If in command input mode, handle special keys
    if (this._commandInput) {
      if (normalizedKey === "Tab" || normalizedKey === "Enter") {
        e.preventDefault();
        this.finalizeCommandInput();
        return;
      }
      if (normalizedKey === "Escape") {
        e.preventDefault();
        // Cancel command input - remove the command input and restore cursor
        this.cancelCommandInput();
        return;
      }
      if (normalizedKey === "Backspace") {
        e.preventDefault();
        // If command input is empty, cancel it; otherwise delete char
        if (this._commandInput.isEmpty()) {
          this.cancelCommandInput();
        } else {
          this.cursor.backspace();
          this.updateDom();
        }
        return;
      }
      // Let other keys through to normal handling
    }

    // Handle special keys
    switch (normalizedKey) {
      // Shift+Arrow for selection
      case "Shift-Left":
        e.preventDefault();
        this.cursor.select(L);
        this.updateDom();
        this.announce();
        break;

      case "Shift-Right":
        e.preventDefault();
        this.cursor.select(R);
        this.updateDom();
        this.announce();
        break;

      // Ctrl+Arrow for word-level navigation
      case "Ctrl-Left":
      case "Meta-Left":
        e.preventDefault();
        this.cursor.moveToStart();
        this.announce();
        break;

      case "Ctrl-Right":
      case "Meta-Right":
        e.preventDefault();
        this.cursor.moveToEnd();
        this.announce();
        break;

      // Ctrl+Shift+Arrow for word-level selection
      case "Ctrl-Shift-Left":
      case "Meta-Shift-Left":
        e.preventDefault();
        // Select all to the left
        while (this.cursor[L]) {
          this.cursor.select(L);
        }
        this.updateDom();
        this.announce();
        break;

      case "Ctrl-Shift-Right":
      case "Meta-Shift-Right":
        e.preventDefault();
        // Select all to the right
        while (this.cursor[R]) {
          this.cursor.select(R);
        }
        this.updateDom();
        this.announce();
        break;

      case "Left":
        e.preventDefault();
        this.cursor.moveLeft();
        this.announce();
        break;

      case "Right":
        e.preventDefault();
        this.cursor.moveRight();
        this.announce();
        break;

      case "Up":
        e.preventDefault();
        this.cursor.moveUp();
        this.announce();
        break;

      case "Down":
        e.preventDefault();
        this.cursor.moveDown();
        this.announce();
        break;

      case "Home":
      case "Shift-Home":
        e.preventDefault();
        if (normalizedKey.startsWith("Shift-")) {
          while (this.cursor[L]) {
            this.cursor.select(L);
          }
          this.updateDom();
        } else {
          this.cursor.moveToStart();
        }
        this.announce();
        break;

      case "End":
      case "Shift-End":
        e.preventDefault();
        if (normalizedKey.startsWith("Shift-")) {
          while (this.cursor[R]) {
            this.cursor.select(R);
          }
          this.updateDom();
        } else {
          this.cursor.moveToEnd();
        }
        this.announce();
        break;

      case "Backspace":
        e.preventDefault();
        this.cursor.backspace();
        this.updateDom();
        this.triggerEdit();
        break;

      case "Delete":
        e.preventDefault();
        this.cursor.deleteForward();
        this.updateDom();
        this.triggerEdit();
        break;

      case "Enter":
        e.preventDefault();
        // Could trigger submit or newline based on config
        break;

      case "Tab":
        // Allow natural tab behavior, or could navigate between blocks
        break;

      case "Escape":
        e.preventDefault();
        this.blur();
        break;

      // Ctrl/Cmd + key combinations
      case "Ctrl-a":
      case "Meta-a":
        e.preventDefault();
        this.cursor.selectAll();
        this.announce("selected all");
        break;

      case "Ctrl-z":
      case "Meta-z":
        e.preventDefault();
        this.undo();
        break;

      case "Ctrl-y":
      case "Meta-y":
      case "Ctrl-Shift-z":
      case "Meta-Shift-z":
        e.preventDefault();
        this.redo();
        break;

      // Math shortcuts
      case "/":
        e.preventDefault();
        this.insertFraction();
        break;

      case "^":
        e.preventDefault();
        this.insertSuperscript();
        break;

      case "_":
        e.preventDefault();
        this.insertSubscript();
        break;

      case "(":
        e.preventDefault();
        this.insertParentheses();
        break;

      case "[":
        e.preventDefault();
        this.insertSquareBrackets();
        break;

      case "{":
        e.preventDefault();
        this.insertCurlyBraces();
        break;

      default:
        // Let input handler deal with regular characters
        break;
    }
  };

  private handleInput = (e: Event): void => {
    const textarea = this.textarea;
    if (!textarea) return;

    const text = textarea.value;
    textarea.value = "";

    if (text) {
      this.typedText(text);
    }
  };

  private handlePaste = (e: ClipboardEvent): void => {
    e.preventDefault();
    const text = e.clipboardData?.getData("text/plain");
    if (text) {
      this.paste(text);
    }
  };

  private handleCut = (e: ClipboardEvent): void => {
    e.preventDefault();
    const latex = this.getSelectionLatex();
    if (latex) {
      e.clipboardData?.setData("text/plain", latex);
      this.cursor.deleteSelection();
      this.updateDom();
      this.triggerEdit();
    }
  };

  private handleCopy = (e: ClipboardEvent): void => {
    e.preventDefault();
    const latex = this.getSelectionLatex();
    if (latex) {
      e.clipboardData?.setData("text/plain", latex);
    }
  };

  /**
   * Handle copy for static math - copies full LaTeX content.
   */
  private handleStaticCopy = (e: ClipboardEvent): void => {
    e.preventDefault();
    const latex = this.latex();
    if (latex) {
      e.clipboardData?.setData("text/plain", latex);
    }
  };

  // --- Input Methods ---

  /**
   * Handle typed text.
   */
  typedText(text: string): void {
    for (const char of text) {
      this.typeChar(char);
    }
    this.updateDom();
    this.triggerEdit();
  }

  /**
   * Type a single character.
   */
  private typeChar(char: string): void {
    // If in command input mode, handle typing in the command name
    if (this._commandInput) {
      this.typeInCommandInput(char);
      return;
    }

    // Ignore spaces in math mode - LaTeX ignores spaces in math
    // To insert a visible space, use \  or \quad commands
    if (char === " " || char === "\t") {
      return;
    }

    // Check for special characters that should create commands
    switch (char) {
      case "\\":
        this.startCommandInput();
        return;
      case "/":
        this.insertFraction();
        return;
      case "^":
        this.insertSuperscript();
        return;
      case "_":
        this.insertSubscript();
        return;
      case "(":
      case ")":
        this.insertParentheses();
        return;
    }

    // Regular character - create a symbol node
    const symbol = createSymbolFromChar(char);
    this.cursor.insert(symbol);

    // Check if we're in a TextMode that should auto-exit after one character
    const block = this.cursor.parent;
    const textModeParent = block?.parent;
    if (
      textModeParent instanceof TextMode &&
      textModeParent.autoExitAfterOne &&
      block === textModeParent.content
    ) {
      // Move cursor out of the TextMode to the right
      this.cursor.moveRight();
    }
  }

  /**
   * Start LaTeX command input mode.
   */
  private startCommandInput(): void {
    const cmdInput = new LatexCommandInput();
    this._commandInput = cmdInput;
    this.cursor.insert(cmdInput);
    this.cursor.moveTo(cmdInput.commandBlock);
    this.updateDom();

    // Add focus class to the command input
    const wrapper = cmdInput.domElement.querySelector(
      ".aphelion-latex-command-input",
    );
    if (wrapper) {
      wrapper.classList.add("aphelion-hasCursor");
    }
  }

  /**
   * Type a character in the command input.
   */
  private typeInCommandInput(char: string): void {
    if (!this._commandInput) return;

    // Check if this character should finalize the command
    if (char === " " || char === "\t") {
      this.finalizeCommandInput();
      // Don't insert space after finalizing - LaTeX ignores spaces in math mode
      return;
    }

    // Only allow letters in command names
    if (/^[a-zA-Z]$/.test(char)) {
      const symbol = createSymbolFromChar(char);
      this.cursor.insert(symbol);
      this.updateDom();
    } else {
      // Non-letter character - finalize and then type the char
      this.finalizeCommandInput();
      // Type the character after finalizing (if not a space)
      if (char !== " " && char !== "\t") {
        this.typeChar(char);
      }
    }
  }

  /**
   * Finalize the command input and create the actual command.
   */
  private finalizeCommandInput(): void {
    if (!this._commandInput) return;

    const cmdInput = this._commandInput;
    const commandName = cmdInput.getCommandName();

    // Remove the command input from the tree
    const leftSibling = cmdInput[L];
    const rightSibling = cmdInput[R];
    const parent = cmdInput.parent as MathBlock;

    cmdInput.remove();

    // Position cursor where the command input was
    this.cursor.moveTo(parent, leftSibling, rightSibling);

    // Clear command mode
    this._commandInput = undefined;

    // Look up the command
    if (commandName) {
      const cmdDef = LATEX_COMMANDS[commandName];
      if (cmdDef) {
        this.executeCommand(cmdDef, commandName);
      } else {
        // Unknown command - insert as literal text in \text{}
        console.warn(`Unknown LaTeX command: \\${commandName}`);
        // Create a text node and fill it with the command name
        const textNode = new TextMode("\\text");
        this.cursor.insert(textNode);
        // Fill the content with the command name (including backslash)
        const fullCommand = "\\" + commandName;
        // Move cursor into text node and type the content
        this.cursor.moveTo(textNode.content);
        for (const ch of fullCommand) {
          const symbol = createSymbolFromChar(ch);
          this.cursor.insert(symbol);
        }
        // Position cursor after the text node
        this.cursor.moveTo(textNode.parent as MathBlock, textNode, textNode[R]);
      }
    }

    this.updateDom();
    this.triggerEdit();
  }

  /**
   * Execute a LaTeX command.
   */
  private executeCommand(
    cmdDef: (typeof LATEX_COMMANDS)[string],
    name: string,
  ): void {
    switch (cmdDef.type) {
      case "fraction":
        this.insertFraction();
        break;
      case "sqrt":
        this.insertSquareRoot();
        break;
      case "symbol": {
        if (cmdDef.symbol && cmdDef.latexCmd) {
          const symbol = new MathSymbol(
            cmdDef.symbol,
            cmdDef.latexCmd,
            cmdDef.degradesTo,
          );
          this.cursor.insert(symbol);
        }
        break;
      }
      case "operator": {
        // Operator names like sin, cos, log, etc.
        if (cmdDef.symbol && cmdDef.latexCmd) {
          // Check if it's a large operator (sum, prod, int) or a function name
          const largeOp = this.createLargeOperator(cmdDef.latexCmd, true);
          if (largeOp) {
            // Insert as a LargeOperator with limit fields
            this.cursor.insert(largeOp);
            // Move cursor into lower limit
            if (largeOp.lower) {
              this.cursor.moveTo(largeOp.lower);
            }
          } else if (cmdDef.latexCmd === "\\lim") {
            // Special case for \lim which has only subscript
            const limit = new Limit(true);
            this.cursor.insert(limit);
            if (limit.subscript) {
              this.cursor.moveTo(limit.subscript);
            }
          } else {
            // Insert as an operator name (non-italic text)
            const operatorName = new OperatorName(
              cmdDef.symbol,
              cmdDef.latexCmd,
            );
            this.cursor.insert(operatorName);
          }
        }
        break;
      }
      case "text": {
        // Legacy text handling - use textmode instead
        const textNode = new TextMode("\\text");
        this.cursor.insert(textNode);
        this.cursor.moveTo(textNode.content);
        break;
      }
      case "textmode": {
        // Text mode commands like \text, \mathrm, etc.
        const latexCmd = cmdDef.latexCmd || "\\text";
        const textNode = new TextMode(latexCmd);
        this.cursor.insert(textNode);
        this.cursor.moveTo(textNode.content);
        break;
      }
      case "accent": {
        // Accent commands like \vec, \bar, etc.
        if (cmdDef.accent && cmdDef.latexCmd) {
          const accentNode = new Accent(cmdDef.accent, cmdDef.latexCmd);
          this.cursor.insert(accentNode);
          this.cursor.moveTo(accentNode.content);
        }
        break;
      }
      case "matrix": {
        // Create a matrix with the specified type, rows, and columns
        const matrixType = cmdDef.matrixType || "pmatrix";
        const rows = cmdDef.rows || 2;
        const cols = cmdDef.cols || 2;
        this.insertMatrix(matrixType, rows, cols);
        break;
      }
      case "binom": {
        // Binomial coefficient
        const binom = new BinomialCoefficient();
        this.cursor.insert(binom);
        this.cursor.moveTo(binom.numerator);
        break;
      }
      default:
        console.warn(`Unhandled command type: ${cmdDef.type}`);
    }
  }

  /**
   * Cancel the current command input without creating any command.
   */
  private cancelCommandInput(): void {
    if (!this._commandInput) return;

    const cmdInput = this._commandInput;
    const leftSibling = cmdInput[L];
    const rightSibling = cmdInput[R];
    const parent = cmdInput.parent as MathBlock;

    // Remove the command input node
    cmdInput.remove();

    // Restore cursor position
    this.cursor.moveTo(parent, leftSibling, rightSibling);

    // Clear command mode
    this._commandInput = undefined;

    this.updateDom();
  }

  /**
   * Paste text (assumed to be LaTeX).
   */
  paste(text: string): void {
    try {
      // Try to parse as LaTeX
      const nodes = parseLatex(text);
      this.insertParsedNodes(nodes);
    } catch {
      // Fall back to typing as plain text
      this.typedText(text);
    }
    this.updateDom();
    this.triggerEdit();
  }

  /**
   * Insert parsed LaTeX nodes.
   */
  private insertParsedNodes(nodes: LatexNode[]): void {
    for (const node of nodes) {
      this.insertAstNode(node);
    }
  }

  /**
   * Insert a single AST node at the current cursor position.
   */
  private insertAstNode(node: LatexNode): void {
    switch (node.type) {
      case "char":
      case "digit": {
        const symbol = createSymbolFromChar(node.value);
        this.cursor.insert(symbol);
        break;
      }

      case "symbol": {
        const symbol = new MathSymbol(
          node.value,
          node.command || node.value,
          node.degradesTo,
        );
        this.cursor.insert(symbol);
        break;
      }

      case "space":
        // Skip spaces or insert space symbol
        break;

      case "group": {
        // Insert content of the group
        for (const child of node.content) {
          this.insertAstNode(child);
        }
        break;
      }

      case "command":
        this.insertCommandFromAst(node.name, node.args, node.optionalArgs);
        break;

      case "subscript": {
        // Check if base is a large operator command
        const subBaseCmd = this.getLargeOperatorFromBase(node.base);
        if (subBaseCmd) {
          const largeOp = this.createLargeOperator(subBaseCmd, true);
          if (largeOp) {
            this.cursor.insert(largeOp);
            if (largeOp.lower) this.fillBlockWithNodes(largeOp.lower, node.sub);
            break;
          }
        }
        // Check if base is \lim
        const limBaseCmd = this.getLimitFromBase(node.base);
        if (limBaseCmd) {
          const limit = new Limit(true);
          this.cursor.insert(limit);
          if (limit.subscript)
            this.fillBlockWithNodes(limit.subscript, node.sub);
          break;
        }
        // Regular subscript
        if (node.base) {
          for (const baseNode of node.base) {
            this.insertAstNode(baseNode);
          }
        }
        const sub = new Subscript();
        this.cursor.insert(sub);
        this.fillBlockWithNodes(sub.sub, node.sub);
        break;
      }

      case "superscript": {
        // Check if base is a large operator command
        const supBaseCmd = this.getLargeOperatorFromBase(node.base);
        if (supBaseCmd) {
          const largeOp = this.createLargeOperator(supBaseCmd, true);
          if (largeOp) {
            this.cursor.insert(largeOp);
            if (largeOp.upper) this.fillBlockWithNodes(largeOp.upper, node.sup);
            break;
          }
        }
        // Regular superscript
        if (node.base) {
          for (const baseNode of node.base) {
            this.insertAstNode(baseNode);
          }
        }
        const sup = new Superscript();
        this.cursor.insert(sup);
        this.fillBlockWithNodes(sup.sup, node.sup);
        break;
      }

      case "subsup": {
        // Check if base is a large operator command
        const subSupBaseCmd = this.getLargeOperatorFromBase(node.base);
        if (subSupBaseCmd) {
          const largeOp = this.createLargeOperator(subSupBaseCmd, true);
          if (largeOp) {
            this.cursor.insert(largeOp);
            if (largeOp.lower) this.fillBlockWithNodes(largeOp.lower, node.sub);
            if (largeOp.upper) this.fillBlockWithNodes(largeOp.upper, node.sup);
            break;
          }
        }
        // Regular subscript+superscript
        if (node.base) {
          for (const baseNode of node.base) {
            this.insertAstNode(baseNode);
          }
        }
        const supsub = new SupSub();
        this.cursor.insert(supsub);
        this.fillBlockWithNodes(supsub.sub, node.sub);
        this.fillBlockWithNodes(supsub.sup, node.sup);
        break;
      }

      case "text": {
        // Insert as plain text symbols
        for (const char of node.content) {
          const symbol = createSymbolFromChar(char);
          this.cursor.insert(symbol);
        }
        break;
      }

      case "matrix": {
        // Create a matrix with the parsed structure
        const matrixNode = node as import("../parser").LatexNode & {
          matrixType:
            | "matrix"
            | "pmatrix"
            | "bmatrix"
            | "Bmatrix"
            | "vmatrix"
            | "Vmatrix";
          cells: import("../parser").LatexNode[][][];
        };
        const rows = matrixNode.cells.length || 2;
        const cols = matrixNode.cells[0]?.length || 2;
        const matrix = new Matrix(matrixNode.matrixType, rows, cols);
        this.cursor.insert(matrix);

        // Fill each cell with its content
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cell = matrix.getCell(r, c);
            const cellContent = matrixNode.cells[r]?.[c] ?? [];
            if (cell && cellContent.length > 0) {
              this.fillBlockWithNodes(cell, cellContent);
            }
          }
        }
        break;
      }

      default:
        console.warn("Unknown AST node type:", (node as any).type);
    }
  }

  /**
   * Fill a block with nodes from AST.
   */
  private fillBlockWithNodes(block: MathBlock, nodes: LatexNode[]): void {
    // Save current cursor position
    const savedPosition = this.cursor.getPosition();

    // Move cursor into the block
    this.cursor.moveTo(block);

    // Insert all nodes
    for (const node of nodes) {
      this.insertAstNode(node);
    }

    // Restore cursor position
    this.cursor.restorePosition(savedPosition);
  }

  /**
   * Insert a LaTeX command from AST.
   */
  private insertCommandFromAst(
    name: string,
    args: LatexNode[][],
    optionalArgs?: LatexNode[][],
  ): void {
    switch (name) {
      case "\\frac":
      case "\\dfrac":
      case "\\tfrac": {
        const frac = new Fraction();
        this.cursor.insert(frac);
        // Fill numerator and denominator
        if (args[0]) this.fillBlockWithNodes(frac.numerator, args[0]);
        if (args[1]) this.fillBlockWithNodes(frac.denominator, args[1]);
        break;
      }

      case "\\sqrt": {
        if (optionalArgs && optionalArgs[0] && optionalArgs[0].length > 0) {
          // Nth root
          const nthroot = new NthRoot();
          this.cursor.insert(nthroot);
          this.fillBlockWithNodes(nthroot.index, optionalArgs[0]);
          if (args[0]) this.fillBlockWithNodes(nthroot.radicand, args[0]);
        } else {
          // Square root
          const sqrt = new SquareRoot();
          this.cursor.insert(sqrt);
          if (args[0]) this.fillBlockWithNodes(sqrt.radicand, args[0]);
        }
        break;
      }

      case "\\left":
      case "\\right":
        // Skip delimiter sizing commands
        break;

      case "\\pm": {
        const symbol = new MathSymbol("±", "\\pm");
        this.cursor.insert(symbol);
        break;
      }

      case "\\cdot": {
        const symbol = new MathSymbol("·", "\\cdot");
        this.cursor.insert(symbol);
        break;
      }

      case "\\times": {
        const symbol = new MathSymbol("×", "\\times");
        this.cursor.insert(symbol);
        break;
      }

      // Large operators with limits
      case "\\sum": {
        const sum = new Summation(true);
        this.cursor.insert(sum);
        // Fill lower/upper if args present (from _{}^{})
        if (args[0] && sum.lower) this.fillBlockWithNodes(sum.lower, args[0]);
        if (args[1] && sum.upper) this.fillBlockWithNodes(sum.upper, args[1]);
        break;
      }

      case "\\prod": {
        const prod = new Product(true);
        this.cursor.insert(prod);
        if (args[0] && prod.lower) this.fillBlockWithNodes(prod.lower, args[0]);
        if (args[1] && prod.upper) this.fillBlockWithNodes(prod.upper, args[1]);
        break;
      }

      case "\\int": {
        const integral = new Integral(true);
        this.cursor.insert(integral);
        if (args[0] && integral.lower)
          this.fillBlockWithNodes(integral.lower, args[0]);
        if (args[1] && integral.upper)
          this.fillBlockWithNodes(integral.upper, args[1]);
        break;
      }

      case "\\iint": {
        const integral = new DoubleIntegral(true);
        this.cursor.insert(integral);
        break;
      }

      case "\\iiint": {
        const integral = new TripleIntegral(true);
        this.cursor.insert(integral);
        break;
      }

      case "\\oint": {
        const integral = new ContourIntegral(true);
        this.cursor.insert(integral);
        if (args[0] && integral.lower)
          this.fillBlockWithNodes(integral.lower, args[0]);
        if (args[1] && integral.upper)
          this.fillBlockWithNodes(integral.upper, args[1]);
        break;
      }

      case "\\bigcup": {
        const union = new BigUnion(true);
        this.cursor.insert(union);
        if (args[0] && union.lower)
          this.fillBlockWithNodes(union.lower, args[0]);
        if (args[1] && union.upper)
          this.fillBlockWithNodes(union.upper, args[1]);
        break;
      }

      case "\\bigcap": {
        const intersection = new BigIntersection(true);
        this.cursor.insert(intersection);
        if (args[0] && intersection.lower)
          this.fillBlockWithNodes(intersection.lower, args[0]);
        if (args[1] && intersection.upper)
          this.fillBlockWithNodes(intersection.upper, args[1]);
        break;
      }

      case "\\lim": {
        const limit = new Limit(true);
        this.cursor.insert(limit);
        if (args[0] && limit.subscript)
          this.fillBlockWithNodes(limit.subscript, args[0]);
        break;
      }

      // Accents like \hat, \bar, \vec, etc.
      case "\\hat":
      case "\\bar":
      case "\\vec":
      case "\\dot":
      case "\\ddot":
      case "\\tilde":
      case "\\widehat":
      case "\\widetilde":
      case "\\overline":
      case "\\underline":
      case "\\overbrace":
      case "\\underbrace": {
        // Use actual Unicode characters (not escape sequences) to ensure matching
        const accentMap: Record<string, string> = {
          "\\vec": "⃗", // U+20D7
          "\\bar": "̄", // U+0304
          "\\overline": "̄", // U+0304
          "\\underline": "̲", // U+0332
          "\\hat": "̂", // U+0302
          "\\dot": "̇", // U+0307
          "\\ddot": "̈", // U+0308
          "\\tilde": "̃", // U+0303
          "\\widehat": "̂", // U+0302
          "\\widetilde": "̃", // U+0303
          "\\overbrace": "⏞", // U+23DE
          "\\underbrace": "⏟", // U+23DF
        };
        const accentChar = accentMap[name] || "̄"; // fallback to bar
        const accentNode = new Accent(accentChar, name);
        this.cursor.insert(accentNode);
        if (args[0]) this.fillBlockWithNodes(accentNode.content, args[0]);
        break;
      }

      // Text mode commands (\\text, \\\mathrm, \\\mathit, \\\mathbb, etc.)
      case "\\text":
      case "\\textrm":
      case "\\textbf":
      case "\\textit":
      case "\\textsf":
      case "\\texttt":
      case "\\mathrm":
      case "\\mathit":
      case "\\mathbf":
      case "\\mathsf":
      case "\\mathtt":
      case "\\mathcal":
      case "\\mathbb":
      case "\\mathfrak":
      case "\\mathscr": {
        const latexCmd = name;
        const textNode = new TextMode(latexCmd);
        this.cursor.insert(textNode);
        if (args[0]) this.fillBlockWithNodes(textNode.content, args[0]);
        break;
      }

      // Binomial coefficients
      case "\\binom":
      case "\\choose": {
        const binom = new BinomialCoefficient();
        this.cursor.insert(binom);
        if (args[0]) this.fillBlockWithNodes(binom.numerator, args[0]);
        if (args[1]) this.fillBlockWithNodes(binom.denominator, args[1]);
        break;
      }

      default: {
        // Try to treat as a symbol command
        const symbolValue = this.getSymbolForCommand(name);
        if (symbolValue) {
          const symbol = new MathSymbol(symbolValue, name);
          this.cursor.insert(symbol);
        } else {
          console.warn("Unknown command:", name);
        }
      }
    }
  }

  /**
   * Get symbol value for common LaTeX commands.
   */
  private getSymbolForCommand(cmd: string): string | undefined {
    const symbols: Record<string, string> = {
      "\\alpha": "α",
      "\\beta": "β",
      "\\gamma": "γ",
      "\\delta": "δ",
      "\\epsilon": "ε",
      "\\zeta": "ζ",
      "\\eta": "η",
      "\\theta": "θ",
      "\\iota": "ι",
      "\\kappa": "κ",
      "\\lambda": "λ",
      "\\mu": "μ",
      "\\nu": "ν",
      "\\xi": "ξ",
      "\\pi": "π",
      "\\rho": "ρ",
      "\\sigma": "σ",
      "\\tau": "τ",
      "\\upsilon": "υ",
      "\\phi": "φ",
      "\\chi": "χ",
      "\\psi": "ψ",
      "\\omega": "ω",
      "\\pm": "±",
      "\\mp": "∓",
      "\\times": "×",
      "\\div": "÷",
      "\\cdot": "·",
      "\\leq": "≤",
      "\\le": "≤",
      "\\geq": "≥",
      "\\ge": "≥",
      "\\neq": "≠",
      "\\ne": "≠",
      "\\approx": "≈",
      "\\equiv": "≡",
      "\\infty": "∞",
      "\\partial": "∂",
      "\\nabla": "∇",
      "\\int": "∫",
      "\\sum": "∑",
      "\\prod": "∏",
      "\\rightarrow": "→",
      "\\leftarrow": "←",
      "\\to": "→",
      "\\Rightarrow": "⇒",
      "\\Leftarrow": "⇐",
    };
    return symbols[cmd];
  }

  /**
   * Large operator commands that should use LargeOperator nodes.
   */
  private readonly LARGE_OPERATOR_COMMANDS = new Set([
    "\\sum",
    "\\prod",
    "\\int",
    "\\iint",
    "\\iiint",
    "\\oint",
    "\\bigcup",
    "\\bigcap",
  ]);

  /**
   * Check if an AST base is a large operator command.
   */
  private getLargeOperatorFromBase(base?: LatexNode[]): string | undefined {
    if (!base || base.length !== 1) return undefined;
    const node = base[0];
    if (
      node?.type === "command" &&
      this.LARGE_OPERATOR_COMMANDS.has(node.name)
    ) {
      return node.name;
    }
    if (node?.type === "symbol") {
      // Check if it's a symbol that corresponds to a large operator
      const symbolToCmd: Record<string, string> = {
        "∑": "\\sum",
        "∏": "\\prod",
        "∫": "\\int",
        "∬": "\\iint",
        "∭": "\\iiint",
        "∮": "\\oint",
        "⋃": "\\bigcup",
        "⋂": "\\bigcap",
      };
      const cmd = symbolToCmd[node.value];
      if (cmd) return cmd;
    }
    return undefined;
  }

  /**
   * Check if an AST base is a \lim command.
   */
  private getLimitFromBase(base?: LatexNode[]): boolean {
    if (!base || base.length !== 1) return false;
    const node = base[0];
    if (node?.type === "command" && node.name === "\\lim") {
      return true;
    }
    // Also check for the text "lim" as a symbol
    if (node?.type === "symbol" && node.value === "lim") {
      return true;
    }
    return false;
  }

  /**
   * Create a LargeOperator instance for a given command.
   */
  private createLargeOperator(
    cmd: string,
    withLimits: boolean,
  ): LargeOperator | undefined {
    switch (cmd) {
      case "\\sum":
        return new Summation(withLimits);
      case "\\prod":
        return new Product(withLimits);
      case "\\int":
        return new Integral(withLimits);
      case "\\iint":
        return new DoubleIntegral(withLimits);
      case "\\iiint":
        return new TripleIntegral(withLimits);
      case "\\oint":
        return new ContourIntegral(withLimits);
      case "\\bigcup":
        return new BigUnion(withLimits);
      case "\\bigcap":
        return new BigIntersection(withLimits);
      default:
        return undefined;
    }
  }

  // --- Command Insertion ---

  /**
   * Insert a fraction at cursor.
   */
  insertFraction(): void {
    const frac = new Fraction();
    this.cursor.insert(frac);
    // Move cursor into numerator
    this.cursor.moveTo(frac.numerator);
    this.updateDom();
    this.triggerEdit();
  }

  /**
   * Insert a square root at cursor.
   */
  insertSquareRoot(): void {
    const sqrt = new SquareRoot();
    this.cursor.insert(sqrt);
    // Move cursor into radicand
    this.cursor.moveTo(sqrt.radicand);
    this.updateDom();
    this.triggerEdit();
  }

  /**
   * Insert superscript at cursor.
   */
  insertSuperscript(): void {
    const sup = new Superscript();
    this.cursor.insert(sup);
    this.cursor.moveTo(sup.sup);
    this.updateDom();
    this.triggerEdit();
  }

  /**
   * Insert subscript at cursor.
   */
  insertSubscript(): void {
    const sub = new Subscript();
    this.cursor.insert(sub);
    this.cursor.moveTo(sub.sub);
    this.updateDom();
    this.triggerEdit();
  }

  /**
   * Insert parentheses at cursor.
   */
  insertParentheses(): void {
    const parens = new Parentheses();
    this.cursor.insert(parens);
    this.cursor.moveTo(parens.content);
    this.updateDom();
    this.triggerEdit();
  }

  /**
   * Insert square brackets at cursor.
   */
  insertSquareBrackets(): void {
    const brackets = new SquareBrackets();
    this.cursor.insert(brackets);
    this.cursor.moveTo(brackets.content);
    this.updateDom();
    this.triggerEdit();
  }

  /**
   * Insert curly braces at cursor.
   */
  insertCurlyBraces(): void {
    const braces = new CurlyBraces();
    this.cursor.insert(braces);
    this.cursor.moveTo(braces.content);
    this.updateDom();
    this.triggerEdit();
  }

  /**
   * Insert a text mode command at cursor (e.g., \text, \mathbb, \mathcal).
   */
  insertTextMode(
    latexCmd:
      | "\\text"
      | "\\mathrm"
      | "\\mathbf"
      | "\\mathit"
      | "\\mathsf"
      | "\\mathtt"
      | "\\mathcal"
      | "\\mathbb"
      | "\\mathfrak"
      | "\\mathscr",
  ): void {
    const textNode = new TextMode(latexCmd);
    this.cursor.insert(textNode);
    this.cursor.moveTo(textNode.content);
    this.updateDom();
    this.triggerEdit();
  }

  /**
   * Insert a matrix at cursor.
   */
  insertMatrix(
    matrixType:
      | "matrix"
      | "pmatrix"
      | "bmatrix"
      | "Bmatrix"
      | "vmatrix"
      | "Vmatrix" = "pmatrix",
    rows: number = 2,
    cols: number = 2,
  ): void {
    const matrix = new Matrix(matrixType, rows, cols);
    this.cursor.insert(matrix);
    // Move cursor into the first cell
    this.cursor.moveTo(matrix.firstCell());
    this.updateDom();
    this.triggerEdit();
  }

  // --- LaTeX Methods ---

  /**
   * Get the current LaTeX content.
   */
  latex(): string {
    return this.root.latex();
  }

  /**
   * Set the content from LaTeX.
   */
  setLatex(latex: string): void {
    // Clear current content
    this.root.clear();

    // Parse and insert
    try {
      const nodes = parseLatex(latex);
      this.cursor.moveTo(this.root);
      this.insertParsedNodes(nodes);
    } catch (e) {
      console.warn("Failed to parse LaTeX:", e);
    }

    this.cursor.moveToEnd();
    this.updateDom();
    this.saveHistory();
    this.triggerEdit();
  }

  /**
   * Get LaTeX of current selection.
   */
  getSelectionLatex(): string {
    return this.cursor.selection?.latex() ?? "";
  }

  // --- Text Methods ---

  /**
   * Get plain text representation.
   */
  text(): string {
    return this.root.text();
  }

  // --- Focus Methods ---

  /**
   * Focus the editor.
   */
  focus(): this {
    this.textarea?.focus();
    return this;
  }

  /**
   * Blur the editor.
   */
  blur(): this {
    this.textarea?.blur();
    return this;
  }

  /**
   * Whether the editor is focused.
   */
  get focused(): boolean {
    return this._focused;
  }

  // --- DOM Methods ---

  /**
   * Update the DOM to reflect the current tree state.
   */
  updateDom(): void {
    this.root.updateDom();
    this.cursor.show();
  }

  /**
   * Set the font family for the math field.
   */
  setFontFamily(fontFamily: string): this {
    if (this.container) {
      this.container.style.fontFamily = fontFamily;
    }
    return this;
  }

  /**
   * Set the font size for the math field.
   */
  setFontSize(size: string | number): this {
    if (this.container) {
      this.container.style.fontSize =
        typeof size === "number" ? `${size}px` : size;
    }
    return this;
  }

  /**
   * Get the current font family.
   */
  getFontFamily(): string {
    return this.container?.style.fontFamily || "";
  }

  /**
   * Get the current font size.
   */
  getFontSize(): string {
    return this.container?.style.fontSize || "";
  }

  /**
   * Seek cursor to an element position based on click coordinates.
   */
  private seekToElement(target: HTMLElement, clientX: number): void {
    // Find the closest math block or node
    let element: HTMLElement | null = target;

    // Traverse up to find a node with data-mq-node-id or a block
    while (element && element !== this.container) {
      const nodeId = element.getAttribute("data-mq-node-id");
      if (nodeId) {
        const node = this.findNodeById(parseInt(nodeId, 10));
        if (node) {
          this.seekToNode(node, clientX, element);
          return;
        }
      }

      // Check if this is a block element
      if (
        element.classList.contains("aphelion-root-block") ||
        element.classList.contains("aphelion-inner-block")
      ) {
        this.seekInBlock(element, clientX);
        return;
      }

      element = element.parentElement;
    }

    // If all else fails, move cursor to end and cry a little
    this.cursor.moveToEnd();
    this.cursor.show();
  }

  /**
   * Find a node in the tree by its ID.
   */
  private findNodeById(
    id: number,
    node: NodeBase = this.root,
  ): NodeBase | undefined {
    if (node.id === id) return node;

    for (const child of node.children()) {
      const found = this.findNodeById(id, child);
      if (found) return found;
    }

    // Check inner blocks (for nodes like Fraction)
    if (node.ends[L]) {
      const found = this.findNodeById(id, node.ends[L]);
      if (found) return found;
    }
    if (node.ends[R] && node.ends[R] !== node.ends[L]) {
      const found = this.findNodeById(id, node.ends[R]);
      if (found) return found;
    }

    return undefined;
  }

  /**
   * Position cursor relative to a specific node.
   */
  private seekToNode(
    node: NodeBase,
    clientX: number,
    element: HTMLElement,
  ): void {
    const rect = element.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;

    // If node has children/blocks, try to seek inside
    if (node.hasChildren()) {
      // Find the appropriate inner block
      const block = node.ends[L] as MathBlock | undefined;
      if (block) {
        this.cursor.moveTo(block);
        this.seekInBlock(block.domElement, clientX);
        return;
      }
    }

    // Position cursor before or after this node based on click position
    const parent = node.parent as MathBlock;
    if (parent) {
      if (clientX < midX) {
        // Click on left half - position cursor before node
        this.cursor.moveTo(parent, node[L], node);
      } else {
        // Click on right half - position cursor after node
        this.cursor.moveTo(parent, node, node[R]);
      }
    }

    this.cursor.show();
  }

  /**
   * Seek to a position within a block element.
   */
  private seekInBlock(blockElement: HTMLElement, clientX: number): void {
    // Get all direct child elements (nodes in the block)
    const children = Array.from(blockElement.children) as HTMLElement[];

    // Filter out non-node elements (like cursor)
    const nodeElements = children.filter(
      (el) =>
        el.hasAttribute("data-mq-node-id") ||
        el.classList.contains("aphelion-inner-block"),
    );

    if (nodeElements.length === 0) {
      // Empty block - position at start
      // Find the corresponding MathBlock
      const block = this.findBlockForElement(blockElement);
      if (block) {
        this.cursor.moveTo(block);
      }
      return;
    }

    // Find which node the click is closest to
    let insertBefore: HTMLElement | null = null;
    for (const el of nodeElements) {
      const rect = el.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      if (clientX < midX) {
        insertBefore = el;
        break;
      }
    }

    // Find the block
    const block = this.findBlockForElement(blockElement);
    if (!block) return;

    if (insertBefore) {
      const nodeId = insertBefore.getAttribute("data-mq-node-id");
      if (nodeId) {
        const node = this.findNodeById(parseInt(nodeId, 10));
        if (node) {
          this.cursor.moveTo(block, node[L], node);
        }
      }
    } else {
      // After all nodes
      this.cursor.moveTo(block, block.ends[R], undefined);
    }

    this.cursor.show();
  }

  /**
   * Find the MathBlock corresponding to a DOM element.
   */
  private findBlockForElement(element: HTMLElement): MathBlock | undefined {
    if (element.classList.contains("aphelion-root-block")) {
      return this.root;
    }

    // Search for inner blocks by traversing the tree
    return this.findBlockInTree(this.root, element);
  }

  /**
   * Recursively find a block in the tree by its DOM element.
   */
  private findBlockInTree(
    node: NodeBase,
    element: HTMLElement,
  ): MathBlock | undefined {
    // Check this node's inner blocks
    for (const child of node.children()) {
      if (child instanceof MathBlock && child.domElement === element) {
        return child;
      }
      // Check if child has blocks
      if (
        child.ends[L] &&
        (child.ends[L] as MathBlock).domElement === element
      ) {
        return child.ends[L] as MathBlock;
      }
      if (
        child.ends[R] &&
        (child.ends[R] as MathBlock).domElement === element
      ) {
        return child.ends[R] as MathBlock;
      }
      // Recurse
      const found = this.findBlockInTree(child, element);
      if (found) return found;
    }
    return undefined;
  }

  // --- History Methods ---

  /**
   * Save current state to history.
   */
  private saveHistory(): void {
    const latex = this.latex();

    // Remove any redo history
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add to history
    this.history.push(latex);
    this.historyIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * Undo last action.
   */
  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const latex = this.history[this.historyIndex]!;
      this.setLatexWithoutHistory(latex);
      this.announce("undo");
    }
  }

  /**
   * Redo last undone action.
   */
  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const latex = this.history[this.historyIndex]!;
      this.setLatexWithoutHistory(latex);
      this.announce("redo");
    }
  }

  /**
   * Set LaTeX without adding to history.
   */
  private setLatexWithoutHistory(latex: string): void {
    this.root.clear();
    try {
      const nodes = parseLatex(latex);
      this.cursor.moveTo(this.root);
      this.insertParsedNodes(nodes);
    } catch {
      // Ignore parse errors
    }
    this.cursor.moveToEnd();
    this.updateDom();
  }

  // --- Callback Methods ---

  /**
   * Trigger the edit handler.
   */
  private triggerEdit(): void {
    this.saveHistory();
    this.options.handlers?.edit?.(this);
  }

  // --- Accessibility ---

  /**
   * Announce text to screen readers.
   */
  announce(text?: string): void {
    if (this.ariaLive) {
      if (text) {
        this.ariaLive.textContent = text;
      } else {
        // Announce current position/context
        const context = this.getAriaContext();
        this.ariaLive.textContent = context;
      }
    }
  }

  /**
   * Get ARIA context for current cursor position.
   */
  private getAriaContext(): string {
    // Get the nodes around the cursor
    const left = this.cursor[L];
    const right = this.cursor[R];

    if (left && right) {
      return `between ${left.mathspeak()} and ${right.mathspeak()}`;
    } else if (left) {
      return `after ${left.mathspeak()}, at end`;
    } else if (right) {
      return `at start, before ${right.mathspeak()}`;
    } else {
      return "empty";
    }
  }

  // --- Utility ---

  /**
   * Get the key name from a keyboard event.
   */
  private getKeyName(e: KeyboardEvent): string {
    let name = "";

    if (e.ctrlKey) name += "Ctrl-";
    if (e.altKey) name += "Alt-";
    if (e.shiftKey) name += "Shift-";
    if (e.metaKey) name += "Meta-";

    name += e.key;

    return name;
  }
}
