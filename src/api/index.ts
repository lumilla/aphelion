/**
 * Aphelion - Public API
 *
 * A beautiful, interactive math editor for the modern web.
 */

import { Controller } from "../controller/controller";
import { EditorConfig, EditorHandlers, L } from "../core/types";

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

  /** Font family for the math field */
  fontFamily?: string;

  /** Font size for the math field */
  fontSize?: string | number;

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
 * StaticMath is fully static with no interactivity - no cursor, no events.
 */
export interface AphelionStaticConfig {
  // StaticMath has no configuration options - it's fully static
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
        case "\\dfrac":
        case "\\tfrac":
          controller.insertFraction();
          break;
        case "/":
          controller.insertSlashFraction();
          break;
        case "\\sqrt":
          controller.insertSquareRoot();
          break;
        case "\\nthroot":
          controller.insertNthRoot();
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
        case ")":
          controller.closeBracket(")");
          break;
        case "[":
          controller.insertSquareBrackets();
          break;
        case "]":
          controller.closeBracket("]");
          break;
        case "{":
          controller.insertCurlyBraces();
          break;
        case "}":
          controller.closeBracket("}");
          break;
        case "|":
        case "\\abs":
          controller.insertAbsoluteValue();
          break;
        case "\\deriv":
          controller.insertDerivative(1);
          break;
        case "\\deriv2":
          controller.insertDerivative(2);
          break;
        case "\\derivN":
          controller.insertDerivative("n");
          break;
        case "\\int":
          controller.insertIntegralTemplate(true);
          break;
        case "\\intIndef":
          controller.insertIntegralTemplate(false);
          break;
        case "\\sum":
          controller.insertSumProductTemplate("sum");
          break;
        case "\\prod":
          controller.insertSumProductTemplate("prod");
          break;
        case "\\lim":
          controller.insertLimitTemplate();
          break;
        case "\\logbase":
          controller.insertLogBase();
          break;
        case "\\dms":
          controller.insertDMS();
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
      controller.clickAt(x, y, target);
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
  const instance: StaticMathInstance = {
    el: () => element,

    latex: ((value?: string) => {
      if (value === undefined) {
        return controller.latex();
      }
      controller.setLatex(value);
      return instance;
    }) as StaticMathInstance["latex"],

    html: () => controller.root.domElement.innerHTML,

    reflow: () => {
      controller.root.postOrder((node) => node.reflow());
      return instance;
    },
  };
  return instance;
}

/**
 * Convert legacy config to modern config.
 */
function convertConfig(
  config: AphelionConfig,
  getInstance?: () => MathFieldInstance,
): EditorConfig {
  const handlers: EditorHandlers = {};

  if (config.handlers?.edit) {
    handlers.edit = (ctrl) => {
      config.handlers?.edit?.((getInstance?.() ?? ctrl) as MathFieldInstance);
    };
  }

  if (config.handlers?.enter) {
    handlers.enter = (ctrl) => {
      config.handlers?.enter?.((getInstance?.() ?? ctrl) as MathFieldInstance);
    };
  }

  if (config.handlers?.moveOutOf) {
    handlers.moveOutOf = (dir) => {
      config.handlers?.moveOutOf?.(
        dir === L ? "left" : "right",
        getInstance?.() as MathFieldInstance,
      );
    };
  }

  if (config.handlers?.selectOutOf) {
    handlers.selectOutOf = (dir) => {
      config.handlers?.selectOutOf?.(
        dir === L ? "left" : "right",
        getInstance?.() as MathFieldInstance,
      );
    };
  }

  if (config.handlers?.deleteOutOf) {
    handlers.deleteOutOf = (dir) => {
      config.handlers?.deleteOutOf?.(
        dir === L ? "left" : "right",
        getInstance?.() as MathFieldInstance,
      );
    };
  }

  if (config.handlers?.upOutOf) {
    handlers.upOutOf = () => {
      config.handlers?.upOutOf?.(getInstance?.() as MathFieldInstance);
    };
  }

  if (config.handlers?.downOutOf) {
    handlers.downOutOf = () => {
      config.handlers?.downOutOf?.(getInstance?.() as MathFieldInstance);
    };
  }

  return {
    restrictMismatchedBrackets: config.restrictMismatchedBrackets,
    autoOperatorNames: config.autoOperatorNames,
    autoCommands: config.autoCommands,
    maxDepth: config.maxDepth,
    fontSize: config.fontSize,
    fontFamily: config.fontFamily,
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
    let instance: MathFieldInstance;
    const controller = new Controller(
      config ? convertConfig(config, () => instance) : {},
    );
    controller.init(element);

    // Create instance
    instance = createMathFieldInstance(controller, element);
    instances.set(element, instance);

    return instance;
  };

  api.StaticMath = (
    element: HTMLElement,
    _config?: AphelionStaticConfig,
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
    });
    controller.init(element);
    controller.setLatex(initialLatex);

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
