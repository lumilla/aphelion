/**
 * Aphelion - Matrix Support
 *
 * Implements LaTeX matrix environments like pmatrix, bmatrix, matrix.
 * A matrix consists of rows and columns of cells, each cell being a MathBlock.
 */

import { NodeBase } from '../core/node';
import { InnerBlock } from '../core/blocks';
import { L, R } from '../core/types';

/**
 * A cell in a matrix - essentially an InnerBlock with row/column info.
 */
export class MatrixCell extends InnerBlock {
  row: number;
  col: number;
  matrix: Matrix;
  protected override cssClass = 'aphelion-matrix-cell';

  constructor(matrix: Matrix, row: number, col: number) {
    super();
    this.matrix = matrix;
    this.row = row;
    this.col = col;
  }
}

/**
 * Matrix type definitions for different bracket styles.
 */
type MatrixType =
  | 'matrix'
  | 'pmatrix'
  | 'bmatrix'
  | 'Bmatrix'
  | 'vmatrix'
  | 'Vmatrix';

const MATRIX_BRACKETS: Record<MatrixType, { left: string; right: string }> = {
  matrix: { left: '', right: '' },
  pmatrix: { left: '(', right: ')' },
  bmatrix: { left: '[', right: ']' },
  Bmatrix: { left: '{', right: '}' },
  vmatrix: { left: '|', right: '|' },
  Vmatrix: { left: '‖', right: '‖' },
};

/**
 * A Matrix node supporting various matrix environments.
 */
export class Matrix extends NodeBase {
  /** The type of matrix (pmatrix, bmatrix, etc.) */
  readonly matrixType: MatrixType;

  /** Number of rows */
  readonly rows: number;

  /** Number of columns */
  readonly cols: number;

  /** 2D array of matrix cells */
  cells: MatrixCell[][];

  protected cssClass = 'aphelion-matrix';

  constructor(
    matrixType: MatrixType = 'pmatrix',
    rows: number = 2,
    cols: number = 2
  ) {
    super();
    this.matrixType = matrixType;
    this.rows = rows;
    this.cols = cols;

    // Create cells and link them in reading order (left-to-right, top-to-bottom)
    this.cells = [];
    let prevCell: MatrixCell | undefined;

    for (let r = 0; r < rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < cols; c++) {
        const cell = new MatrixCell(this, r, c);
        cell.parent = this;
        this.cells[r][c] = cell;

        // Link cells in reading order for navigation
        if (prevCell) {
          prevCell[R] = cell;
          cell[L] = prevCell;
        }
        prevCell = cell;
      }
    }

    // Set ends - first cell (top-left) is L, last cell (bottom-right) is R
    this.ends[L] = this.cells[0][0];
    this.ends[R] = this.cells[rows - 1][cols - 1];
  }

  protected createDomElement(): HTMLElement {
    const brackets = MATRIX_BRACKETS[this.matrixType];

    const container = document.createElement('span');
    container.className = this.cssClass;
    container.dataset.mqNodeId = String(this.id);

    // Left bracket
    if (brackets.left) {
      const leftBracket = document.createElement('span');
      leftBracket.className =
        'aphelion-matrix-bracket aphelion-matrix-bracket-l';
      leftBracket.textContent = brackets.left;
      container.appendChild(leftBracket);
    }

    // Matrix grid
    const grid = document.createElement('span');
    grid.className = 'aphelion-matrix-grid';

    for (let r = 0; r < this.rows; r++) {
      const row = document.createElement('span');
      row.className = 'aphelion-matrix-row';

      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r][c];
        row.appendChild(cell.domElement);
      }

      grid.appendChild(row);
    }

    container.appendChild(grid);

    // Right bracket
    if (brackets.right) {
      const rightBracket = document.createElement('span');
      rightBracket.className =
        'aphelion-matrix-bracket aphelion-matrix-bracket-r';
      rightBracket.textContent = brackets.right;
      container.appendChild(rightBracket);
    }

    return container;
  }

  override hasChildren(): boolean {
    return true;
  }

  latex(): string {
    const env = this.matrixType;
    let result = `\\begin{${env}}`;

    for (let r = 0; r < this.rows; r++) {
      const rowLatex = this.cells[r].map((cell) => cell.latex()).join(' & ');
      result += rowLatex;
      if (r < this.rows - 1) {
        result += ' \\\\ ';
      }
    }

    result += `\\end{${env}}`;
    return result;
  }

  text(): string {
    let result = '[';
    for (let r = 0; r < this.rows; r++) {
      result += '[';
      result += this.cells[r].map((cell) => cell.text()).join(', ');
      result += ']';
      if (r < this.rows - 1) {
        result += ', ';
      }
    }
    result += ']';
    return result;
  }

  override mathspeak(): string {
    let result = `${this.rows} by ${this.cols} matrix. `;
    for (let r = 0; r < this.rows; r++) {
      result += `Row ${r + 1}: `;
      for (let c = 0; c < this.cols; c++) {
        result += `Entry ${c + 1}: ${this.cells[r][c].mathspeak()}. `;
      }
    }
    return result.trim();
  }

  updateDom(): void {
    const el = this.domElement;
    el.className = `${this.cssClass} mq-non-leaf`;
    el.setAttribute('data-rows', String(this.rows));

    // Find the grid element
    let grid = el.querySelector('.aphelion-matrix-grid') as HTMLElement;
    if (!grid) {
      // Rebuild the entire structure
      el.innerHTML = '';

      const brackets = MATRIX_BRACKETS[this.matrixType];

      // Left bracket
      if (brackets.left) {
        const leftBracket = document.createElement('span');
        leftBracket.className =
          'aphelion-matrix-bracket aphelion-matrix-bracket-l';
        leftBracket.textContent = brackets.left;
        el.appendChild(leftBracket);
      }

      // Grid
      grid = document.createElement('span');
      grid.className = 'aphelion-matrix-grid';
      el.appendChild(grid);

      // Right bracket
      if (brackets.right) {
        const rightBracket = document.createElement('span');
        rightBracket.className =
          'aphelion-matrix-bracket aphelion-matrix-bracket-r';
        rightBracket.textContent = brackets.right;
        el.appendChild(rightBracket);
      }
    }

    // Clear and rebuild grid rows
    grid.innerHTML = '';

    for (let r = 0; r < this.rows; r++) {
      const rowEl = document.createElement('span');
      rowEl.className = 'aphelion-matrix-row';

      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r][c];
        cell.updateDom();
        rowEl.appendChild(cell.domElement);
      }

      grid.appendChild(rowEl);
    }
  }

  /**
   * Get the cell at a given position.
   */
  getCell(row: number, col: number): MatrixCell | undefined {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      return this.cells[row][col];
    }
    return undefined;
  }

  /**
   * Get the first (top-left) cell.
   */
  firstCell(): MatrixCell {
    return this.cells[0][0];
  }

  /**
   * Get the last (bottom-right) cell.
   */
  lastCell(): MatrixCell {
    return this.cells[this.rows - 1][this.cols - 1];
  }

  /**
   * Get the cell to the right of the given cell (or undefined if at edge).
   */
  cellRight(cell: MatrixCell): MatrixCell | undefined {
    return this.getCell(cell.row, cell.col + 1);
  }

  /**
   * Get the cell to the left of the given cell (or undefined if at edge).
   */
  cellLeft(cell: MatrixCell): MatrixCell | undefined {
    return this.getCell(cell.row, cell.col - 1);
  }

  /**
   * Get the cell above the given cell (or undefined if at edge).
   */
  cellUp(cell: MatrixCell): MatrixCell | undefined {
    return this.getCell(cell.row - 1, cell.col);
  }

  /**
   * Get the cell below the given cell (or undefined if at edge).
   */
  cellDown(cell: MatrixCell): MatrixCell | undefined {
    return this.getCell(cell.row + 1, cell.col);
  }

  override onRemove(): void {
    // Clean up cells
    for (const row of this.cells) {
      for (const cell of row) {
        cell.onRemove();
      }
    }
  }
}

/**
 * Factory functions for different matrix types.
 */
export const Matrices = {
  matrix: (rows = 2, cols = 2) => new Matrix('matrix', rows, cols),
  pmatrix: (rows = 2, cols = 2) => new Matrix('pmatrix', rows, cols),
  bmatrix: (rows = 2, cols = 2) => new Matrix('bmatrix', rows, cols),
  Bmatrix: (rows = 2, cols = 2) => new Matrix('Bmatrix', rows, cols),
  vmatrix: (rows = 2, cols = 2) => new Matrix('vmatrix', rows, cols),
  Vmatrix: (rows = 2, cols = 2) => new Matrix('Vmatrix', rows, cols),
};
