/**
 * Aphelion - Core Types
 *
 * These types define the fundamental building blocks of the math editing system.
 */

/** Direction for cursor movement and node traversal */
export const Direction = {
  Left: -1,
  Right: 1,
} as const;

export type DirectionType = (typeof Direction)[keyof typeof Direction];

/** Shorthand for left/right directions */
export const L = Direction.Left;
export const R = Direction.Right;

/** Get opposite direction */
export function otherDir(dir: DirectionType): DirectionType {
  return dir === L ? R : L;
}

/** Node ends - references to first/last children */
export interface Ends<T> {
  [L]?: T;
  [R]?: T;
}

/** Unique ID counter for nodes */
let nodeIdCounter = 0;

export function generateNodeId(): number {
  return ++nodeIdCounter;
}

/** Reset ID counter (for testing) */
export function resetNodeIdCounter(): void {
  nodeIdCounter = 0;
}

/** Configuration options for the editor */
export interface EditorConfig {
  /** Whether the field is editable */
  editable?: boolean;
  /** Whether to enable auto-operator names (sin, cos, etc.) */
  autoOperatorNames?: string;
  /** Whether to auto-complete commands */
  autoCommands?: string;
  /** Maximum depth of nested expressions */
  maxDepth?: number;
  /** Whether to restrict mismatched brackets */
  restrictMismatchedBrackets?: boolean;
  /** Whether to sum exponents like a^n+m becomes a^{n+m} */
  sumStartsWithNEquals?: boolean;
  /** Handlers for various events */
  handlers?: EditorHandlers;
  /** Substitution for text input */
  substituteTextarea?: () => HTMLTextAreaElement;
  /** Whether to enable typing in static math */
  mouseEvents?: boolean;
  /** Character width for spacing calculations */
  charWidth?: number;

  // --- Font Customization ---
  /** Font family for math content (default: 'Times New Roman', 'Cambria Math', serif) */
  fontFamily?: string;
  /** Font size in pixels or CSS units (default: '1em') */
  fontSize?: string | number;
  /** Custom CSS class to apply to the math field container */
  customClass?: string;
}

/** Event handlers for the editor */
export interface EditorHandlers {
  /** Called when the content changes */
  edit?: (mathField: unknown) => void;
  /** Called when cursor moves */
  moveOutOf?: (direction: DirectionType, mathField: unknown) => void;
  /** Called when selection changes */
  selectOutOf?: (direction: DirectionType, mathField: unknown) => void;
  /** Called when deleting at boundary */
  deleteOutOf?: (direction: DirectionType, mathField: unknown) => void;
  /** Called when entering the field */
  enter?: (mathField: unknown) => void;
  /** Called when using up arrow at boundary */
  upOutOf?: (mathField: unknown) => void;
  /** Called when using down arrow at boundary */
  downOutOf?: (mathField: unknown) => void;
  /** Called on reflow/resize */
  reflow?: (mathField: unknown) => void;
}

/** LaTeX command definition for registration */
export interface LatexCommandDef {
  /** The LaTeX command string (e.g., '\\frac') */
  latex: string;
  /** How to render this command */
  render: (node: MathNode) => string;
  /** Parse this command from LaTeX */
  parse?: (parser: unknown) => MathNode;
  /** Number of required arguments */
  numArgs?: number;
  /** Number of optional arguments */
  numOptionalArgs?: number;
}

/** Base interface for all math nodes */
export interface MathNode {
  id: number;
  parent?: MathNode;
  ends: Ends<MathNode>;
  [L]?: MathNode;
  [R]?: MathNode;
}

/** Selection range (interface) */
export interface SelectionRange {
  start: MathNode;
  end: MathNode;
  direction: DirectionType;
}

/** Point in the tree (for cursor) */
export interface TreePoint {
  parent: MathNode;
  [L]?: MathNode;
  [R]?: MathNode;
}
