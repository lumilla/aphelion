/**
 * Aphelion - LaTeX Parser
 *
 * Parses LaTeX math expressions into an AST.
 */

import {
  Parser,
  string,
  satisfy,
  regex,
  map,
  or,
  choice,
  many,
  many1,
  optional,
  seqLeft,
  seqRight,
  seq,
  lazy,
  latexCommand,
  bracedGroup,
  parse as runParser,
  tryParse,
} from "./combinators";
import {
  LatexNode,
  char,
  digitNode,
  command,
  group,
  subscript,
  superscript,
  subsup,
  symbol,
  space,
  text,
  matrix,
} from "./ast";

/**
 * Parse a single digit.
 */
const digitParser: Parser<LatexNode> = map(
  satisfy((c) => c >= "0" && c <= "9", "digit"),
  (d) => digitNode(d),
);

/**
 * Parse a single letter.
 */
const letterParser: Parser<LatexNode> = map(
  satisfy((c) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z"), "letter"),
  (l) => char(l),
);

/**
 * Operators and symbols that can appear directly.
 */
const operatorParser: Parser<LatexNode> = map(
  satisfy((c) => "+-*/=<>!|()[],.;:".includes(c), "operator"),
  (op) => symbol(op),
);

/**
 * Map of commands to their degraded form (for backspace behavior).
 * E.g., ≤ → <, ≥ → >, ≠ → =
 */
const SYMBOL_DEGRADATION: Record<string, string> = {
  "\\leq": "<",
  "\\le": "<",
  "\\geq": ">",
  "\\ge": ">",
  "\\neq": "=",
  "\\ne": "=",
};

/**
 * Map of LaTeX commands to their symbol representations.
 */
const SYMBOL_COMMANDS: Record<string, string> = {
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
  "\\Gamma": "Γ",
  "\\Delta": "Δ",
  "\\Theta": "Θ",
  "\\Lambda": "Λ",
  "\\Xi": "Ξ",
  "\\Pi": "Π",
  "\\Sigma": "Σ",
  "\\Upsilon": "Υ",
  "\\Phi": "Φ",
  "\\Psi": "Ψ",
  "\\Omega": "Ω",
  "\\pm": "±",
  "\\mp": "∓",
  "\\times": "×",
  "\\div": "÷",
  "\\cdot": "·",
  "\\ast": "∗",
  "\\star": "⋆",
  "\\circ": "∘",
  "\\bullet": "•",
  "\\leq": "≤",
  "\\le": "≤",
  "\\geq": "≥",
  "\\ge": "≥",
  "\\neq": "≠",
  "\\ne": "≠",
  "\\approx": "≈",
  "\\equiv": "≡",
  "\\sim": "∼",
  "\\simeq": "≃",
  "\\cong": "≅",
  "\\propto": "∝",
  "\\subset": "⊂",
  "\\supset": "⊃",
  "\\subseteq": "⊆",
  "\\supseteq": "⊇",
  "\\in": "∈",
  "\\ni": "∋",
  "\\notin": "∉",
  "\\cup": "∪",
  "\\cap": "∩",
  "\\emptyset": "∅",
  "\\varnothing": "∅",
  "\\land": "∧",
  "\\lor": "∨",
  "\\lnot": "¬",
  "\\neg": "¬",
  "\\forall": "∀",
  "\\exists": "∃",
  "\\nexists": "∄",
  "\\partial": "∂",
  "\\nabla": "∇",
  "\\infty": "∞",
  "\\aleph": "ℵ",
  "\\Re": "ℜ",
  "\\Im": "ℑ",
  "\\wp": "℘",
  "\\ell": "ℓ",
  "\\hbar": "ℏ",
  "\\to": "→",
  "\\rightarrow": "→",
  "\\leftarrow": "←",
  "\\leftrightarrow": "↔",
  "\\Rightarrow": "⇒",
  "\\Leftarrow": "⇐",
  "\\Leftrightarrow": "⇔",
  "\\uparrow": "↑",
  "\\downarrow": "↓",
  "\\mapsto": "↦",
  "\\ldots": "…",
  "\\cdots": "⋯",
  "\\vdots": "⋮",
  "\\ddots": "⋱",
  "\\prime": "′",
  "\\angle": "∠",
  "\\triangle": "△",
  "\\square": "□",
  "\\diamond": "◇",
  "\\clubsuit": "♣",
  "\\diamondsuit": "♢",
  "\\heartsuit": "♡",
  "\\spadesuit": "♠",
  "\\sharp": "♯",
  "\\flat": "♭",
  "\\natural": "♮",
  "\\int": "∫",
  "\\iint": "∬",
  "\\iiint": "∭",
  "\\oint": "∮",
  "\\sum": "∑",
  "\\prod": "∏",
  "\\coprod": "∐",
  "\\bigcup": "⋃",
  "\\bigcap": "⋂",
  "\\bigvee": "⋁",
  "\\bigwedge": "⋀",
  "\\lim": "lim",
  "\\sin": "sin",
  "\\cos": "cos",
  "\\tan": "tan",
  "\\cot": "cot",
  "\\sec": "sec",
  "\\csc": "csc",
  "\\arcsin": "arcsin",
  "\\arccos": "arccos",
  "\\arctan": "arctan",
  "\\sinh": "sinh",
  "\\cosh": "cosh",
  "\\tanh": "tanh",
  "\\log": "log",
  "\\ln": "ln",
  "\\exp": "exp",
  "\\det": "det",
  "\\dim": "dim",
  "\\ker": "ker",
  "\\hom": "hom",
  "\\min": "min",
  "\\max": "max",
  "\\sup": "sup",
  "\\inf": "inf",
  "\\gcd": "gcd",
  "\\lcm": "lcm",
  "\\deg": "deg",
  "\\arg": "arg",
  "\\mod": "mod",
  "\\ ": " ",
  "\\,": " ",
  "\\;": " ",
  "\\!": "",
  "\\quad": "  ",
  "\\qquad": "    ",
};

/**
 * Commands that take arguments.
 */
interface CommandDef {
  numArgs: number;
  numOptArgs?: number;
}

const COMMAND_DEFS: Record<string, CommandDef> = {
  "\\frac": { numArgs: 2 },
  "\\dfrac": { numArgs: 2 },
  "\\tfrac": { numArgs: 2 },
  "\\sqrt": { numArgs: 1, numOptArgs: 1 },
  "\\root": { numArgs: 2 },
  "\\overline": { numArgs: 1 },
  "\\underline": { numArgs: 1 },
  "\\hat": { numArgs: 1 },
  "\\bar": { numArgs: 1 },
  "\\vec": { numArgs: 1 },
  "\\dot": { numArgs: 1 },
  "\\ddot": { numArgs: 1 },
  "\\tilde": { numArgs: 1 },
  "\\widehat": { numArgs: 1 },
  "\\widetilde": { numArgs: 1 },
  "\\text": { numArgs: 1 },
  "\\textbf": { numArgs: 1 },
  "\\textit": { numArgs: 1 },
  "\\textrm": { numArgs: 1 },
  "\\mathrm": { numArgs: 1 },
  "\\mathbf": { numArgs: 1 },
  "\\mathit": { numArgs: 1 },
  "\\mathsf": { numArgs: 1 },
  "\\mathtt": { numArgs: 1 },
  "\\mathcal": { numArgs: 1 },
  "\\mathbb": { numArgs: 1 },
  "\\mathfrak": { numArgs: 1 },
  "\\binom": { numArgs: 2 },
  "\\choose": { numArgs: 2 },
  "\\left": { numArgs: 0 },
  "\\right": { numArgs: 0 },
  "\\big": { numArgs: 0 },
  "\\Big": { numArgs: 0 },
  "\\bigg": { numArgs: 0 },
  "\\Bigg": { numArgs: 0 },
  "\\color": { numArgs: 1 },
  "\\textcolor": { numArgs: 2 },
  "\\boxed": { numArgs: 1 },
  "\\cancel": { numArgs: 1 },
  "\\bcancel": { numArgs: 1 },
  "\\xcancel": { numArgs: 1 },
  "\\not": { numArgs: 0 },
  "\\phantom": { numArgs: 1 },
  "\\underbrace": { numArgs: 1 },
  "\\overbrace": { numArgs: 1 },
  "\\stackrel": { numArgs: 2 },
  "\\overset": { numArgs: 2 },
  "\\underset": { numArgs: 2 },
};

/**
 * Valid matrix environment types.
 */
const MATRIX_TYPES = [
  "matrix",
  "pmatrix",
  "bmatrix",
  "Bmatrix",
  "vmatrix",
  "Vmatrix",
] as const;
type MatrixType = (typeof MATRIX_TYPES)[number];

/**
 * Parse a matrix environment like \begin{pmatrix}...\end{pmatrix}.
 */
const matrixEnvironmentParser: Parser<LatexNode> = (input, position = 0) => {
  // Check for \begin{matrixType}
  const beginMatch = input.match(
    /^\\begin\{(matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix)\}/,
  );
  if (!beginMatch) {
    return { success: false, expected: "matrix environment", position };
  }

  const matrixType = beginMatch[1] as MatrixType;
  const endTag = `\\end{${matrixType}}`;
  let remaining = input.slice(beginMatch[0].length);

  // Find the closing \end{matrixType}
  const endPos = remaining.indexOf(endTag);
  if (endPos === -1) {
    return { success: false, expected: endTag, position };
  }

  const bodyContent = remaining.slice(0, endPos);
  remaining = remaining.slice(endPos + endTag.length);

  // Parse the body: split by \\ for rows, and & for columns
  const rows = bodyContent.split(/\s*\\\\\s*/);
  const cells: LatexNode[][][] = [];

  for (const row of rows) {
    const cols = row.split(/\s*&\s*/);
    const rowCells: LatexNode[][] = [];

    for (const cell of cols) {
      // Parse each cell content
      const cellContent = cell.trim();
      if (cellContent) {
        const parseResult = tryParse(latexContent, cellContent);
        rowCells.push(parseResult ?? []);
      } else {
        rowCells.push([]);
      }
    }

    if (rowCells.length > 0) {
      cells.push(rowCells);
    }
  }

  return {
    success: true,
    value: matrix(matrixType, cells),
    remaining,
  };
};

/**
 * Parse LaTeX expression content (the main parser).
 */
const latexContent: Parser<LatexNode[]> = lazy(() =>
  many(
    choice<LatexNode>(
      // Whitespace - skip or convert to space
      map(regex(/\s+/), () => space()),
      // Matrix environments like \begin{pmatrix}...\end{pmatrix}
      matrixEnvironmentParser,
      // Subscript/superscript handled in post-processing
      commandWithArgsParser,
      symbolCommandParser,
      bracedGroupParser,
      digitParser,
      letterParser,
      operatorParser,
      subscriptMarker,
      superscriptMarker,
    ),
  ),
);

/**
 * Parse a braced group.
 */
const bracedGroupParser: Parser<LatexNode> = map(
  bracedGroup(latexContent),
  (content) => group(content),
);

/**
 * Parse a symbol command (no arguments).
 */
const symbolCommandParser: Parser<LatexNode> = (input, position = 0) => {
  const cmdResult = latexCommand(input, position);
  if (!cmdResult.success) return cmdResult;

  const cmd = cmdResult.value;

  // Check if it's a known symbol command
  const symbolValue = SYMBOL_COMMANDS[cmd];
  if (symbolValue !== undefined) {
    // Check if this symbol has a degradation
    const degradesTo = SYMBOL_DEGRADATION[cmd];
    return {
      success: true,
      value: symbol(symbolValue, cmd, degradesTo),
      remaining: cmdResult.remaining,
    };
  }

  // Check if it's a command with arguments
  const cmdDef = COMMAND_DEFS[cmd];
  if (cmdDef && cmdDef.numArgs > 0) {
    // Let commandWithArgsParser handle this
    return { success: false, expected: "symbol command", position };
  }

  // Unknown command - treat as symbol with the command text
  return {
    success: true,
    value: symbol(cmd.slice(1), cmd),
    remaining: cmdResult.remaining,
  };
};

/**
 * Parse a command with arguments.
 */
const commandWithArgsParser: Parser<LatexNode> = (input, position = 0) => {
  const cmdResult = latexCommand(input, position);
  if (!cmdResult.success) return cmdResult;

  const cmd = cmdResult.value;
  const cmdDef = COMMAND_DEFS[cmd];

  if (!cmdDef || cmdDef.numArgs === 0) {
    return { success: false, expected: "command with arguments", position };
  }

  let remaining = cmdResult.remaining;
  const args: LatexNode[][] = [];
  const optArgs: LatexNode[][] = [];

  // Parse optional arguments first
  if (cmdDef.numOptArgs) {
    for (let i = 0; i < cmdDef.numOptArgs; i++) {
      if (remaining.startsWith("[")) {
        const endBracket = findMatchingBracket(remaining, "[", "]");
        if (endBracket !== -1) {
          const content = remaining.slice(1, endBracket);
          const parsed = tryParse(latexContent, content) ?? [];
          optArgs.push(parsed);
          remaining = remaining.slice(endBracket + 1);
        }
      }
    }
  }

  // Parse required arguments
  for (let i = 0; i < cmdDef.numArgs; i++) {
    // Skip whitespace
    remaining = remaining.replace(/^\s*/, "");

    if (remaining.startsWith("{")) {
      const endBrace = findMatchingBracket(remaining, "{", "}");
      if (endBrace === -1) {
        return { success: false, expected: "closing brace", position };
      }
      const content = remaining.slice(1, endBrace);
      const parsed = tryParse(latexContent, content) ?? [];
      args.push(parsed);
      remaining = remaining.slice(endBrace + 1);
    } else if (remaining.length > 0) {
      // Single character/token argument
      const singleResult = choice(
        digitParser,
        letterParser,
        operatorParser,
      )(remaining, position);
      if (singleResult.success) {
        args.push([singleResult.value]);
        remaining = singleResult.remaining;
      } else {
        return { success: false, expected: "argument", position };
      }
    } else {
      return { success: false, expected: "argument", position };
    }
  }

  return {
    success: true,
    value: command(cmd, args, optArgs.length > 0 ? optArgs : undefined),
    remaining,
  };
};

/**
 * Subscript marker _.
 */
const subscriptMarker: Parser<LatexNode> = map(string("_"), () =>
  symbol("_", "_"),
);

/**
 * Superscript marker ^.
 */
const superscriptMarker: Parser<LatexNode> = map(string("^"), () =>
  symbol("^", "^"),
);

/**
 * Find matching bracket position.
 */
function findMatchingBracket(
  input: string,
  open: string,
  close: string,
): number {
  let depth = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === open) depth++;
    else if (input[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Post-process to handle subscripts and superscripts.
 */
function processSubSup(nodes: LatexNode[]): LatexNode[] {
  const result: LatexNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;

    // Check for subscript/superscript markers
    if (node.type === "symbol" && (node.value === "_" || node.value === "^")) {
      const base = result.pop();
      const baseNodes = base ? [base] : [];
      const isSubscript = node.value === "_";

      // Get the argument
      const arg = nodes[++i];
      const argNodes = arg ? (arg.type === "group" ? arg.content : [arg]) : [];

      // Check for the other script
      const next = nodes[i + 1];
      if (next?.type === "symbol") {
        const isNextSub = next.value === "_";
        const isNextSup = next.value === "^";

        if ((isSubscript && isNextSup) || (!isSubscript && isNextSub)) {
          i++; // consume the marker
          const nextArg = nodes[++i];
          const nextArgNodes = nextArg
            ? nextArg.type === "group"
              ? nextArg.content
              : [nextArg]
            : [];

          result.push(
            subsup(
              baseNodes,
              isSubscript ? argNodes : nextArgNodes,
              isSubscript ? nextArgNodes : argNodes,
            ),
          );
          continue;
        }
      }

      // Just one script
      result.push(
        isSubscript
          ? subscript(baseNodes, argNodes)
          : superscript(baseNodes, argNodes),
      );
    } else {
      result.push(node);
    }
  }

  return result;
}

/**
 * Parse a complete LaTeX expression.
 */
export function parseLatex(input: string): LatexNode[] {
  const result = latexContent(input.trim());
  if (!result.success) {
    throw new Error(
      `Parse error at position ${result.position}: expected ${result.expected}`,
    );
  }

  // Post-process for subscripts/superscripts
  return processSubSup(result.value);
}

/**
 * Try to parse LaTeX, returning undefined on failure.
 */
export function tryParseLatex(input: string): LatexNode[] | undefined {
  try {
    return parseLatex(input);
  } catch {
    return undefined;
  }
}

export { astToLatex } from "./ast";
