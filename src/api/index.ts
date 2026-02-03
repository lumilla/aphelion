/**
 * Aphelion - Public API
 *
 * A beautiful, interactive math editor for the modern web.
 */

import { Controller } from "../controller/controller";
import { EditorConfig, EditorHandlers } from "../core/types";

/**
 * Aphelion API interface.
 */
export interface AphelionAPI {
  /** Create a MathField from an element */
  MathField: (
    element: HTMLElement,
    config?: AphelionConfig,
  ) => MathFieldInstance;

  /** Create a StaticMath display from an element */
  StaticMath: (
    element: HTMLElement,
    config?: AphelionStaticConfig,
  ) => StaticMathInstance;

  /** Get an existing Aphelion instance from an element */
  (element: HTMLElement): AphelionInstance | null;

  /** API version */
  version: string;

  /** Interface version */
  interfaceVersion: number;
}

/**
 * Configuration options for MathField.
 */
export interface AphelionConfig {
  /** Whether brackets should be auto-balanced */
  restrictMismatchedBrackets?: boolean;

  /** Auto-recognize operator names like sin, cos */
  autoOperatorNames?: string;

  /** Auto-complete commands */
  autoCommands?: string;

  /** Suppress space characters */
  supSubsRequireOperand?: boolean;

  /** Enable sum starts with n= */
  sumStartsWithNEquals?: boolean;

  /** Maximum nesting depth */
  maxDepth?: number;

  /** Space behavior */
  spaceBehavesLikeTab?: boolean;

  /** Left-right behavior */
  leftRightIntoCmdGoes?: "up" | "down";

  /** Event handlers */
  handlers?: {
    edit?: (mathField: MathFieldInstance) => void;
    enter?: (mathField: MathFieldInstance) => void;
    moveOutOf?: (
      direction: "left" | "right",
      mathField: MathFieldInstance,
    ) => void;
    selectOutOf?: (
      direction: "left" | "right",
      mathField: MathFieldInstance,
    ) => void;
    deleteOutOf?: (
      direction: "left" | "right",
      mathField: MathFieldInstance,
    ) => void;
    upOutOf?: (mathField: MathFieldInstance) => void;
    downOutOf?: (mathField: MathFieldInstance) => void;
  };
}

/**
 * Configuration for StaticMath.
 */
export interface AphelionStaticConfig {
  /** Whether to disable events */
  mouseEvents?: boolean;
}

// Backwards compatibility aliases
export type MathQuillConfig = AphelionConfig;
export type MathQuillStaticConfig = AphelionStaticConfig;

/**
 * Base instance interface.
 */
export interface AphelionInstance {
  /** Get the container element */
  el(): HTMLElement;

  /** Get or set the LaTeX content */
  latex(): string;
  latex(value: string): this;

  /** Get the HTML content */
  html(): string;

  /** Reflow/recalculate layout */
  reflow(): this;
}

/**
 * MathField instance interface.
 */
export interface MathFieldInstance extends AphelionInstance {
  /** Focus the field */
  focus(): this;

  /** Blur the field */
  blur(): this;

  /** Write LaTeX at cursor position */
  write(latex: string): this;

  /** Execute a command */
  cmd(command: string): this;

  /** Get plain text representation */
  text(): string;

  /** Select all content */
  select(): this;

  /** Clear all content */
  clearSelection(): this;

  /** Move cursor to end */
  moveToRightEnd(): this;

  /** Move cursor to start */
  moveToLeftEnd(): this;

  /** Simulate a keystroke */
  keystroke(key: string): this;

  /** Simulate typing text */
  typedText(text: string): this;

  /** Configuration */
  config(options: MathQuillConfig): this;

  /** Ignore next mousedown (for touch handling) */
  ignoreNextMousedown(callback: () => boolean): this;

  /** Click at position */
  clickAt(x: number, y: number, target?: HTMLElement): this;
}

/**
 * StaticMath instance interface.
 */
export interface StaticMathInstance extends AphelionInstance {
  // StaticMath is read-only, so only base methods
}

/**
 * Create a MathField instance from a controller.
 */
function createMathFieldInstance(
  controller: Controller,
  element: HTMLElement,
): MathFieldInstance {
  const instance: MathFieldInstance = {
    el: () => element,

    latex: ((value?: string) => {
      if (value === undefined) {
        return controller.latex();
      }
      controller.setLatex(value);
      return instance;
    }) as MathFieldInstance["latex"],

    html: () => controller.root.domElement.innerHTML,

    reflow: () => {
      controller.root.postOrder((node) => node.reflow());
      return instance;
    },

    focus: () => {
      controller.focus();
      return instance;
    },

    blur: () => {
      controller.blur();
      return instance;
    },

    write: (latex: string) => {
      controller.paste(latex);
      return instance;
    },

    cmd: (command: string) => {
      switch (command) {
        case "\\frac":
          controller.insertFraction();
          break;
        case "\\sqrt":
          controller.insertSquareRoot();
          break;
        case "^":
          controller.insertSuperscript();
          break;
        case "_":
          controller.insertSubscript();
          break;
        case "(":
          controller.insertParentheses();
          break;
        case "[":
          controller.insertSquareBrackets();
          break;
        case "{":
          controller.insertCurlyBraces();
          break;
        // Text mode commands
        case "\\text":
        case "\\mathrm":
        case "\\mathbf":
        case "\\mathit":
        case "\\mathsf":
        case "\\mathtt":
        case "\\mathcal":
        case "\\mathbb":
        case "\\mathfrak":
        case "\\mathscr":
          controller.insertTextMode(
            command as
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
          );
          break;
        default:
          // Try to paste as LaTeX
          controller.paste(command);
      }
      return instance;
    },

    text: () => controller.text(),

    select: () => {
      controller.cursor.selectAll();
      return instance;
    },

    clearSelection: () => {
      controller.cursor.clearSelection();
      return instance;
    },

    moveToRightEnd: () => {
      controller.cursor.moveToEnd();
      return instance;
    },

    moveToLeftEnd: () => {
      controller.cursor.moveToStart();
      return instance;
    },

    keystroke: (key: string) => {
      // Simulate keystroke
      const event = new KeyboardEvent("keydown", { key });
      controller.textarea?.dispatchEvent(event);
      return instance;
    },

    typedText: (text: string) => {
      controller.typedText(text);
      return instance;
    },

    config: (options: AphelionConfig) => {
      // Merge new options
      Object.assign(controller.options, convertConfig(options));
      return instance;
    },

    ignoreNextMousedown: () => instance,

    clickAt: (x: number, y: number, target?: HTMLElement) => {
      // Simulate click at position
      controller.focus();
      return instance;
    },
  };

  return instance;
}

/**
 * Create a StaticMath instance.
 */
function createStaticMathInstance(
  controller: Controller,
  element: HTMLElement,
): StaticMathInstance {
  return {
    el: () => element,

    latex: ((value?: string) => {
      if (value === undefined) {
        return controller.latex();
      }
      controller.setLatex(value);
      return createStaticMathInstance(controller, element);
    }) as StaticMathInstance["latex"],

    html: () => controller.root.domElement.innerHTML,

    reflow: () => {
      controller.root.postOrder((node) => node.reflow());
      return createStaticMathInstance(controller, element);
    },
  };
}

/**
 * Convert legacy config to modern config.
 */
function convertConfig(config: AphelionConfig): EditorConfig {
  const handlers: EditorHandlers = {};

  if (config.handlers?.edit) {
    handlers.edit = config.handlers.edit as EditorHandlers["edit"];
  }

  if (config.handlers?.enter) {
    handlers.enter = config.handlers.enter as EditorHandlers["enter"];
  }

  return {
    restrictMismatchedBrackets: config.restrictMismatchedBrackets,
    autoOperatorNames: config.autoOperatorNames,
    autoCommands: config.autoCommands,
    maxDepth: config.maxDepth,
    handlers,
  };
}

// Store instances by element
const instances = new WeakMap<HTMLElement, AphelionInstance>();

/**
 * Get the Aphelion API (interface version 3).
 */
// Interface version 3 is for API compatibility with MathQuill, in reality it doesn't really mean anything here.
export function getInterface(version: number = 3): AphelionAPI {
  const api = function Aphelion(element: HTMLElement): AphelionInstance | null {
    return instances.get(element) ?? null;
  } as AphelionAPI;

  api.version = "1.0.0";
  api.interfaceVersion = version;

  api.MathField = (
    element: HTMLElement,
    config?: AphelionConfig,
  ): MathFieldInstance => {
    // Check if already initialized
    const existing = instances.get(element);
    if (existing) {
      return existing as MathFieldInstance;
    }

    // Create controller and initialize
    const controller = new Controller(config ? convertConfig(config) : {});
    controller.init(element);

    // Create instance
    const instance = createMathFieldInstance(controller, element);
    instances.set(element, instance);

    return instance;
  };

  api.StaticMath = (
    element: HTMLElement,
    config?: AphelionStaticConfig,
  ): StaticMathInstance => {
    // Check if already initialized
    const existing = instances.get(element);
    if (existing) {
      return existing as StaticMathInstance;
    }

    // Get initial LaTeX from element content
    const initialLatex = element.textContent ?? "";
    element.textContent = "";

    // Create controller (non-editable)
    const controller = new Controller({
      editable: false,
      mouseEvents: config?.mouseEvents ?? true,
    });
    controller.init(element);
    controller.setLatex(initialLatex);

    // Remove textarea for static math
    const textarea = element.querySelector(".aphelion-textarea");
    textarea?.remove();

    // Create instance
    const instance = createStaticMathInstance(controller, element);
    instances.set(element, instance);

    return instance;
  };

  return api;
}

/**
 * Get maximum supported interface version.
 */
getInterface.MAX = 3;

/**
 * Default export for Aphelion API.
 */
export const Aphelion = {
  getInterface,
  noConflict: () => Aphelion,
};

export default Aphelion;
