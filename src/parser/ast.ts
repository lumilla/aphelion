/**
 * Aphelion - LaTeX AST
 *
 * Abstract Syntax Tree types for parsed LaTeX.
 */

/** Base type for all LaTeX AST nodes */
export interface LatexNodeBase {
  type: string;
}

/** A text character */
export interface LatexChar extends LatexNodeBase {
  type: 'char';
  value: string;
}

/** A digit */
export interface LatexDigit extends LatexNodeBase {
  type: 'digit';
  value: string;
}

/** A LaTeX command like \frac */
export interface LatexCommand extends LatexNodeBase {
  type: 'command';
  name: string;
  args: LatexNode[][];
  optionalArgs?: LatexNode[][];
}

/** A group in braces {...} */
export interface LatexGroup extends LatexNodeBase {
  type: 'group';
  content: LatexNode[];
}

/** Subscript */
export interface LatexSubscript extends LatexNodeBase {
  type: 'subscript';
  base: LatexNode[];
  sub: LatexNode[];
}

/** Superscript */
export interface LatexSuperscript extends LatexNodeBase {
  type: 'superscript';
  base: LatexNode[];
  sup: LatexNode[];
}

/** Both subscript and superscript */
export interface LatexSubSup extends LatexNodeBase {
  type: 'subsup';
  base: LatexNode[];
  sub: LatexNode[];
  sup: LatexNode[];
}

/** A symbol (operator, relation, etc.) */
export interface LatexSymbol extends LatexNodeBase {
  type: 'symbol';
  value: string;
  command?: string;
  degradesTo?: string;
}

/** Whitespace */
export interface LatexSpace extends LatexNodeBase {
  type: 'space';
}

/** A text block \text{...} */
export interface LatexText extends LatexNodeBase {
  type: 'text';
  content: string;
}

/** A matrix environment \begin{pmatrix}...\end{pmatrix} */
export interface LatexMatrix extends LatexNodeBase {
  type: 'matrix';
  matrixType:
    | 'matrix'
    | 'pmatrix'
    | 'bmatrix'
    | 'Bmatrix'
    | 'vmatrix'
    | 'Vmatrix';
  cells: LatexNode[][][]; // rows[cols[cell content]]
}

/** All possible LaTeX node types */
export type LatexNode =
  | LatexChar
  | LatexDigit
  | LatexCommand
  | LatexGroup
  | LatexSubscript
  | LatexSuperscript
  | LatexSubSup
  | LatexSymbol
  | LatexSpace
  | LatexText
  | LatexMatrix;

/** Create a character node */
export function char(value: string): LatexChar {
  return { type: 'char', value };
}

/** Create a digit node */
export function digitNode(value: string): LatexDigit {
  return { type: 'digit', value };
}

/** Create a command node */
export function command(
  name: string,
  args: LatexNode[][] = [],
  optionalArgs?: LatexNode[][]
): LatexCommand {
  return { type: 'command', name, args, optionalArgs };
}

/** Create a group node */
export function group(content: LatexNode[]): LatexGroup {
  return { type: 'group', content };
}

/** Create a subscript node */
export function subscript(base: LatexNode[], sub: LatexNode[]): LatexSubscript {
  return { type: 'subscript', base, sub };
}

/** Create a superscript node */
export function superscript(
  base: LatexNode[],
  sup: LatexNode[]
): LatexSuperscript {
  return { type: 'superscript', base, sup };
}

/** Create a subsup node */
export function subsup(
  base: LatexNode[],
  sub: LatexNode[],
  sup: LatexNode[]
): LatexSubSup {
  return { type: 'subsup', base, sub, sup };
}

/** Create a symbol node */
export function symbol(
  value: string,
  cmd?: string,
  degradesTo?: string
): LatexSymbol {
  return { type: 'symbol', value, command: cmd, degradesTo };
}

/** Create a space node */
export function space(): LatexSpace {
  return { type: 'space' };
}

/** Create a text node */
export function text(content: string): LatexText {
  return { type: 'text', content };
}

/** Create a matrix node */
export function matrix(
  matrixType:
    | 'matrix'
    | 'pmatrix'
    | 'bmatrix'
    | 'Bmatrix'
    | 'vmatrix'
    | 'Vmatrix',
  cells: LatexNode[][][]
): LatexMatrix {
  return { type: 'matrix', matrixType, cells };
}

/**
 * Convert an AST back to LaTeX string.
 */
export function astToLatex(nodes: LatexNode[]): string {
  return nodes.map(nodeToLatex).join('');
}

function nodeToLatex(node: LatexNode): string {
  switch (node.type) {
    case 'char':
    case 'digit':
      return node.value;

    case 'command': {
      const args = node.args.map((arg) => `{${astToLatex(arg)}}`).join('');
      const optArgs =
        node.optionalArgs?.map((arg) => `[${astToLatex(arg)}]`).join('') ?? '';
      return `${node.name}${optArgs}${args}`;
    }

    case 'group':
      return `{${astToLatex(node.content)}}`;

    case 'subscript':
      return `${astToLatex(node.base)}_{${astToLatex(node.sub)}}`;

    case 'superscript':
      return `${astToLatex(node.base)}^{${astToLatex(node.sup)}}`;

    case 'subsup':
      return `${astToLatex(node.base)}_{${astToLatex(node.sub)}}^{${astToLatex(
        node.sup
      )}}`;

    case 'symbol':
      return node.command ?? node.value;

    case 'space':
      return '\\ ';

    case 'text':
      return `\\text{${node.content}}`;

    case 'matrix': {
      const env = node.matrixType;
      let result = `\\begin{${env}}`;
      for (let r = 0; r < node.cells.length; r++) {
        const rowLatex = node.cells[r]
          .map((cell) => astToLatex(cell))
          .join(' & ');
        result += rowLatex;
        if (r < node.cells.length - 1) {
          result += ' \\\\ ';
        }
      }
      result += `\\end{${env}}`;
      return result;
    }
  }
}
