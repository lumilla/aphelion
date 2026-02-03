/**
 * Aphelion - Cursor
 *
 * The cursor represents the current editing position in the math tree.
 * It can be between nodes, inside a block, or selecting a range of nodes.
 */

import { NodeBase, NodeFragment } from "./node";
import { MathBlock, RootBlock } from "./blocks";
import { DirectionType, L, R, otherDir, EditorConfig } from "./types";
import { MathSymbol } from "../commands/symbol";

// Forward declaration for matrix cell detection
interface MatrixCellLike extends MathBlock {
  row: number;
  col: number;
  matrix: {
    getCell(row: number, col: number): MathBlock | undefined;
  };
}

/**
 * Selection state - a contiguous range of nodes.
 */
export class Selection extends NodeFragment {
  /** Direction the selection was made in */
  direction: DirectionType;

  constructor(
    leftEnd: NodeBase,
    rightEnd: NodeBase,
    direction: DirectionType = R,
  ) {
    super(leftEnd, rightEnd);
    this.direction = direction;
  }

  /**
   * Get the "anchor" end of the selection (where it started).
   */
  get anchor(): NodeBase {
    return this.direction === R ? this.leftEnd : this.rightEnd;
  }

  /**
   * Get the "focus" end of the selection (where it ends).
   */
  get focus(): NodeBase {
    return this.direction === R ? this.rightEnd : this.leftEnd;
  }

  /**
   * Clear selection styling from all nodes.
   */
  clearHighlight(): void {
    for (const node of this) {
      node.domElement?.classList.remove("aphelion-selection");
    }
  }

  /**
   * Apply selection styling to all nodes.
   */
  applyHighlight(): void {
    for (const node of this) {
      node.domElement?.classList.add("aphelion-selection");
    }
  }

  /**
   * Join all nodes' mathspeak for accessibility.
   */
  mathspeak(): string {
    const parts: string[] = [];
    for (const node of this) {
      parts.push(node.mathspeak());
    }
    return parts.join(" ");
  }
}

/**
 * The cursor represents the editing position in the tree.
 */
export class Cursor {
  /** The parent block containing the cursor */
  parent: MathBlock;

  /** Node to the left of the cursor (undefined if at start) */
  [L]?: NodeBase;

  /** Node to the right of the cursor (undefined if at end) */
  [R]?: NodeBase;

  /** Current selection (if any) */
  selection?: Selection;

  /** DOM element for the cursor */
  private _domElement?: HTMLElement;

  /** Whether the cursor should blink */
  private _blinkInterval?: ReturnType<typeof setInterval>;

  /** Options/config reference */
  options: EditorConfig;

  /** Starting point for a selection operation */
  private _anticursor?: { parent: MathBlock; [L]?: NodeBase; [R]?: NodeBase };

  constructor(root: RootBlock, options: EditorConfig = {}) {
    this.parent = root;
    this.options = options;
  }

  /**
   * Get or create the cursor DOM element.
   */
  get domElement(): HTMLElement {
    if (!this._domElement) {
      this._domElement = document.createElement("span");
      this._domElement.className = "aphelion-cursor";
      this._domElement.textContent = "\u200B"; // Zero-width space for height
    }
    return this._domElement;
  }

  /**
   * Insert the cursor DOM element at the current position.
   */
  show(): this {
    // Temporarily stop blink animation during repositioning
    const wasBlinking = this.domElement.classList.contains("aphelion-blink");
    this.domElement.classList.remove("aphelion-blink");

    // Remove from previous position
    this.domElement.remove();

    // Insert at current position
    if (this[R]) {
      this[R]!.domElement.before(this.domElement);
    } else if (this[L]) {
      this[L]!.domElement.after(this.domElement);
    } else {
      this.parent.domElement.prepend(this.domElement);
    }

    // Restore blink state after a brief delay to restart animation
    if (wasBlinking) {
      // Force reflow and restart animation
      requestAnimationFrame(() => {
        this.domElement.classList.add("aphelion-blink");
      });
    }

    return this;
  }

  /**
   * Hide the cursor.
   */
  hide(): this {
    this.domElement.remove();
    this.stopBlink();
    return this;
  }

  /**
   * Start the cursor blinking animation.
   */
  startBlink(): this {
    this.stopBlink();
    this.domElement.classList.add("aphelion-blink");
    return this;
  }

  /**
   * Stop the cursor blinking animation.
   */
  stopBlink(): this {
    this.domElement.classList.remove("aphelion-blink");
    return this;
  }

  // --- Movement Methods ---

  /**
   * Move the cursor in the given direction.
   * Returns true if the cursor moved, false if it was blocked.
   */
  move(dir: DirectionType): boolean {
    this.clearSelection();

    const sibling = this[dir];
    if (sibling) {
      // Move past the sibling
      return this.movePast(sibling, dir);
    } else {
      // Try to move out of the current block
      return this.moveOut(dir);
    }
  }

  /**
   * Move past a sibling node.
   */
  private movePast(node: NodeBase, dir: DirectionType): boolean {
    const other = otherDir(dir);

    // Check if we should enter the node (if it has children)
    if (node.hasChildren()) {
      return this.enterNode(node, dir);
    }

    // Otherwise just move past it
    this[other] = node;
    this[dir] = node[dir];

    this.show();
    return true;
  }

  /**
   * Enter a node that has children.
   */
  private enterNode(node: NodeBase, dir: DirectionType): boolean {
    // Find the first block child to enter
    // For now, enter the first/last block
    const enterDir = otherDir(dir);
    const block = this.findBlockChild(node, enterDir);

    if (block) {
      this.parent = block;
      this[dir] = block.ends[enterDir];
      this[otherDir(dir)] = undefined;
      this.show();
      return true;
    }

    // No block to enter, just move past
    const other = otherDir(dir);
    this[other] = node;
    this[dir] = node[dir];
    this.show();
    return true;
  }

  /**
   * Find a MathBlock child of a node.
   */
  private findBlockChild(
    node: NodeBase,
    fromDir: DirectionType,
  ): MathBlock | undefined {
    // Check the node's ends for blocks
    const child = node.ends[fromDir];
    if (child instanceof MathBlock) {
      return child;
    }

    // Check all children
    for (const c of node.children()) {
      if (c instanceof MathBlock) {
        return c;
      }
    }

    return undefined;
  }

  /**
   * Move out of the current block.
   */
  private moveOut(dir: DirectionType): boolean {
    const parent = this.parent;
    const grandparent = parent.parent;

    if (!grandparent) {
      // At root, can't move out
      // TODO: Call moveOutOf handler
      return false;
    }

    // Check if grandparent is a MathBlock (we can position in it)
    if (grandparent instanceof MathBlock) {
      // Move cursor to be past the parent in the grandparent
      const other = otherDir(dir);
      this[other] = parent;
      this[dir] = parent[dir];
      this.parent = grandparent;
      this.show();
      return true;
    }

    // Grandparent is a node like Fraction - we need to go to its parent
    const greatGrandparent = grandparent.parent;
    if (!greatGrandparent || !(greatGrandparent instanceof MathBlock)) {
      return false;
    }

    // Position cursor relative to the grandparent node in its container
    const other = otherDir(dir);
    if (dir === R) {
      // Moving right - position cursor after grandparent
      this[L] = grandparent;
      this[R] = grandparent[R];
    } else {
      // Moving left - position cursor before grandparent
      this[R] = grandparent;
      this[L] = grandparent[L];
    }
    this.parent = greatGrandparent;
    this.show();
    return true;
  }

  /**
   * Move to the left.
   */
  moveLeft(): boolean {
    return this.move(L);
  }

  /**
   * Move to the right.
   */
  moveRight(): boolean {
    return this.move(R);
  }

  /**
   * Move up (to parent block or numerator).
   */
  moveUp(): boolean {
    this.clearSelection();

    const parent = this.parent;
    const grandparent = parent.parent;

    if (!grandparent) {
      // At root, can't move up
      return false;
    }

    // Check if we're in a matrix cell - move to cell above
    if (this.isMatrixCell(parent)) {
      const cell = parent as MatrixCellLike;
      const cellAbove = cell.matrix.getCell(cell.row - 1, cell.col);
      if (cellAbove) {
        this.parent = cellAbove;
        this[L] = cellAbove.ends[R];
        this[R] = undefined;
        this.show();
        return true;
      }
      // At top row, move out of matrix
      return this.moveOut(L);
    }

    // Check if we're in a denominator - move to numerator
    if (
      grandparent.ends[R] === parent &&
      grandparent.ends[L] instanceof MathBlock
    ) {
      // We're in the right/lower block, move to left/upper
      const upperBlock = grandparent.ends[L] as MathBlock;
      this.parent = upperBlock;
      this[L] = upperBlock.ends[R];
      this[R] = undefined;
      this.show();
      return true;
    }

    // Check if we're in a subscript - try to find superscript
    if (parent[L] instanceof MathBlock) {
      const upperBlock = parent[L] as MathBlock;
      this.parent = upperBlock;
      this[L] = upperBlock.ends[R];
      this[R] = undefined;
      this.show();
      return true;
    }

    // Otherwise move out of current block to parent level
    return this.moveOut(L);
  }

  /**
   * Move down (to child block or denominator).
   */
  moveDown(): boolean {
    this.clearSelection();

    const parent = this.parent;
    const grandparent = parent.parent;

    if (!grandparent) {
      // At root, can't move down
      return false;
    }

    // Check if we're in a matrix cell - move to cell below
    if (this.isMatrixCell(parent)) {
      const cell = parent as MatrixCellLike;
      const cellBelow = cell.matrix.getCell(cell.row + 1, cell.col);
      if (cellBelow) {
        this.parent = cellBelow;
        this[L] = undefined;
        this[R] = cellBelow.ends[L];
        this.show();
        return true;
      }
      // At bottom row, move out of matrix
      return this.moveOut(R);
    }

    // Check if we're in a numerator - move to denominator
    if (
      grandparent.ends[L] === parent &&
      grandparent.ends[R] instanceof MathBlock
    ) {
      // We're in the left/upper block, move to right/lower
      const lowerBlock = grandparent.ends[R] as MathBlock;
      this.parent = lowerBlock;
      this[L] = undefined;
      this[R] = lowerBlock.ends[L];
      this.show();
      return true;
    }

    // Check if we're in a superscript - try to find subscript
    if (parent[R] instanceof MathBlock) {
      const lowerBlock = parent[R] as MathBlock;
      this.parent = lowerBlock;
      this[L] = undefined;
      this[R] = lowerBlock.ends[L];
      this.show();
      return true;
    }

    // Otherwise move out of current block to parent level
    return this.moveOut(R);
  }

  /**
   * Check if a block is a matrix cell.
   */
  private isMatrixCell(block: MathBlock): boolean {
    return "row" in block && "col" in block && "matrix" in block;
  }

  /**
   * Move to the start of the current block.
   */
  moveToStart(): this {
    this.clearSelection();
    this[L] = undefined;
    this[R] = this.parent.ends[L];
    this.show();
    return this;
  }

  /**
   * Move to the end of the current block.
   */
  moveToEnd(): this {
    this.clearSelection();
    this[L] = this.parent.ends[R];
    this[R] = undefined;
    this.show();
    return this;
  }

  /**
   * Move to a specific position (before a node).
   */
  moveTo(parent: MathBlock, leftNode?: NodeBase, rightNode?: NodeBase): this {
    this.clearSelection();
    this.parent = parent;
    this[L] = leftNode;
    this[R] = rightNode;
    this.show();
    return this;
  }

  // --- Selection Methods ---

  /**
   * Start a selection operation (remember current position as anchor).
   */
  startSelection(): this {
    this._anticursor = {
      parent: this.parent,
      [L]: this[L],
      [R]: this[R],
    };
    return this;
  }

  /**
   * Extend selection in the given direction.
   */
  select(dir: DirectionType): boolean {
    if (!this._anticursor) {
      this.startSelection();
    }

    const sibling = this[dir];
    if (sibling) {
      this.extendSelectionTo(sibling, dir);
      return true;
    } else {
      // Try to extend out of current block
      return this.extendSelectionOut(dir);
    }
  }

  /**
   * Extend selection to include a node.
   */
  private extendSelectionTo(node: NodeBase, dir: DirectionType): void {
    const other = otherDir(dir);

    if (this.selection) {
      // Extend or contract existing selection
      if (this.selection.direction === dir) {
        // Extending in the same direction
        this.selection = new Selection(
          dir === R ? this.selection.leftEnd : node,
          dir === R ? node : this.selection.rightEnd,
          dir,
        );
      } else {
        // Contracting
        if (
          (dir === R && this.selection.leftEnd === node) ||
          (dir === L && this.selection.rightEnd === node)
        ) {
          // Selection is now empty
          this.clearSelection();
        } else {
          this.selection = new Selection(
            dir === R ? node[R]! : this.selection.leftEnd,
            dir === R ? this.selection.rightEnd : node[L]!,
            other,
          );
        }
      }
    } else {
      // Start new selection
      this.selection = new Selection(node, node, dir);
    }

    // Update cursor position
    this[other] = node;
    this[dir] = node[dir];

    this.updateSelectionHighlight();
    this.show();
  }

  /**
   * Extend selection out of the current block.
   */
  private extendSelectionOut(dir: DirectionType): boolean {
    const parent = this.parent;
    const grandparent = parent.parent;

    if (!grandparent) {
      // At root, can't extend out
      return false;
    }

    // TODO: Handle extending selection across block boundaries
    return false;
  }

  /**
   * Select all content in the entire editor (root block).
   */
  selectAll(): this {
    // Navigate to the root block first
    let root = this.parent;
    while (root.parent instanceof MathBlock) {
      root = root.parent;
    }

    // If we're in a nested block, navigate to the actual root
    while (root.parent) {
      const grandparent = root.parent;
      if (grandparent instanceof MathBlock) {
        root = grandparent;
      } else if (grandparent.parent instanceof MathBlock) {
        root = grandparent.parent as MathBlock;
      } else {
        break;
      }
    }

    this.parent = root;
    const firstChild = root.ends[L];
    const lastChild = root.ends[R];

    if (firstChild && lastChild) {
      this.selection = new Selection(firstChild, lastChild, R);
      this[L] = lastChild;
      this[R] = undefined;
      this.updateSelectionHighlight();
    }

    return this;
  }

  /**
   * Clear the current selection.
   */
  clearSelection(): this {
    if (this.selection) {
      this.selection.clearHighlight();
      this.selection = undefined;
    }
    this._anticursor = undefined;
    return this;
  }

  /**
   * Update selection highlighting.
   */
  private updateSelectionHighlight(): void {
    // Remove all existing highlights
    this.parent.domElement
      .querySelectorAll(".aphelion-selection")
      .forEach((el) => el.classList.remove("aphelion-selection"));

    // Apply new highlights
    this.selection?.applyHighlight();
  }

  // --- Editing Methods ---

  /**
   * Insert a node at the cursor position.
   */
  insert(node: NodeBase): this {
    this.deleteSelection();

    node.parent = this.parent;
    node[L] = this[L];
    node[R] = this[R];

    if (this[L]) {
      this[L]![R] = node;
    } else {
      this.parent.ends[L] = node;
    }

    if (this[R]) {
      this[R]![L] = node;
    } else {
      this.parent.ends[R] = node;
    }

    // Move cursor past the inserted node
    this[L] = node;

    node.onInsert();
    this.show();

    return this;
  }

  /**
   * Delete in the given direction.
   * Returns the deleted nodes, if any.
   */
  delete(dir: DirectionType): NodeBase | undefined {
    // If there's a selection, delete it
    if (this.selection) {
      return this.deleteSelection();
    }

    const nodeToDelete = this[dir];
    if (!nodeToDelete) {
      // Nothing to delete in this direction - try to delete out of current block
      return this.deleteOutOf(dir);
    }

    // Check if the node has children (like a Fraction or SupSub)
    if (nodeToDelete.hasChildren()) {
      // Enter the node instead of deleting it
      const other = otherDir(dir);
      const block = this.findBlockChild(nodeToDelete, other);
      if (block) {
        this.parent = block;
        // When entering via backspace (dir=L), we want to be at the END of the block
        // When entering via delete (dir=R), we want to be at the START of the block
        // So we position at the opposite end from the direction we're deleting
        this[dir] = block.ends[other]; // e.g., for backspace: cursor[L] = block.ends[R] (last child)
        this[other] = undefined;
        this.show();
        return undefined;
      }
    }

    // Check for symbol degradation (e.g., ≤ → < before deleting)
    if (nodeToDelete instanceof MathSymbol && nodeToDelete.canDegrade()) {
      const degraded = nodeToDelete.createDegraded();
      if (degraded) {
        // Replace the symbol with its degraded form instead of deleting
        const parent = nodeToDelete.parent;
        const leftSib = nodeToDelete[L];
        const rightSib = nodeToDelete[R];

        // Remove the original
        nodeToDelete.onRemove();
        nodeToDelete.remove();

        // Insert the degraded version in its place (like cursor.insert but at specific position)
        if (parent) {
          degraded.parent = parent;
          degraded[L] = leftSib;
          degraded[R] = rightSib;

          if (leftSib) {
            leftSib[R] = degraded;
          } else {
            parent.ends[L] = degraded;
          }

          if (rightSib) {
            rightSib[L] = degraded;
          } else {
            parent.ends[R] = degraded;
          }

          // Trigger DOM creation
          degraded.onInsert();
        }

        // Position cursor after (for backspace) or before (for delete) the degraded symbol
        if (dir === L) {
          this[L] = degraded;
          this[R] = rightSib;
        } else {
          this[L] = leftSib;
          this[R] = degraded;
        }

        this.show();
        return nodeToDelete; // Return original as "deleted"
      }
    }

    // Save the next node BEFORE removing (remove() clears the pointers)
    const nextNode = nodeToDelete[dir];

    nodeToDelete.onRemove();
    nodeToDelete.remove();

    // Update cursor position
    this[dir] = nextNode;

    this.show();
    return nodeToDelete;
  }

  /**
   * Delete out of the current block when at the edge.
   * This handles removing empty superscripts/subscripts, etc.
   */
  private deleteOutOf(dir: DirectionType): NodeBase | undefined {
    const parent = this.parent;
    const grandparent = parent.parent;

    // Can't delete out of root
    if (!grandparent || parent instanceof RootBlock) {
      return undefined;
    }

    // Check if the parent block is empty
    const isEmpty = !parent.ends[L];

    if (isEmpty) {
      // Check if the grandparent has OTHER blocks with content
      // If so, don't delete the grandparent - just move out
      const siblingBlocks = this.getSiblingBlocks(parent, grandparent);
      const hasContentInSiblings = siblingBlocks.some(
        (block) => block.ends[L] !== undefined,
      );

      if (hasContentInSiblings) {
        // Don't delete - just move out of the empty block
        const greatGrandparent = grandparent.parent;
        if (greatGrandparent instanceof MathBlock) {
          if (dir === L) {
            this[R] = grandparent;
            this[L] = grandparent[L];
          } else {
            this[L] = grandparent;
            this[R] = grandparent[R];
          }
          this.parent = greatGrandparent;
          this.show();
        }
        return undefined;
      }

      // All blocks empty - remove the grandparent structure
      const greatGrandparent = grandparent.parent;

      if (greatGrandparent instanceof MathBlock) {
        // Save grandparent's neighbors BEFORE removing it
        const gpLeft = grandparent[L];
        const gpRight = grandparent[R];

        // Remove the grandparent node first
        grandparent.onRemove();
        grandparent.remove();

        // Now position cursor using the saved neighbor references
        this.parent = greatGrandparent;
        if (dir === L) {
          // Backspacing - position cursor where grandparent was
          this[L] = gpLeft;
          this[R] = gpRight;
        } else {
          // Forward delete - position cursor where grandparent was
          this[L] = gpLeft;
          this[R] = gpRight;
        }

        this.show();
        return grandparent;
      }
    } else {
      // Non-empty block - move out and position cursor
      const greatGrandparent = grandparent.parent;

      if (greatGrandparent instanceof MathBlock) {
        // Move out of the block, positioning based on direction
        if (dir === L) {
          // Backspacing at start of block - move before grandparent
          this[R] = grandparent;
          this[L] = grandparent[L];
        } else {
          // Deleting at end of block - move after grandparent
          this[L] = grandparent;
          this[R] = grandparent[R];
        }
        this.parent = greatGrandparent;
        this.show();
      }
    }

    return undefined;
  }

  /**
   * Get sibling blocks of the current block within the grandparent.
   */
  private getSiblingBlocks(
    currentBlock: MathBlock,
    grandparent: NodeBase,
  ): MathBlock[] {
    const siblings: MathBlock[] = [];

    // Check ends[L] and ends[R] of grandparent
    if (
      grandparent.ends[L] instanceof MathBlock &&
      grandparent.ends[L] !== currentBlock
    ) {
      siblings.push(grandparent.ends[L]);
    }
    if (
      grandparent.ends[R] instanceof MathBlock &&
      grandparent.ends[R] !== currentBlock
    ) {
      siblings.push(grandparent.ends[R]);
    }

    // Also check named properties common in multi-block structures
    const anyGrandparent = grandparent as unknown as Record<string, unknown>;
    if (
      anyGrandparent.numerator instanceof MathBlock &&
      anyGrandparent.numerator !== currentBlock
    ) {
      siblings.push(anyGrandparent.numerator);
    }
    if (
      anyGrandparent.denominator instanceof MathBlock &&
      anyGrandparent.denominator !== currentBlock
    ) {
      siblings.push(anyGrandparent.denominator);
    }
    if (
      anyGrandparent.upper instanceof MathBlock &&
      anyGrandparent.upper !== currentBlock
    ) {
      siblings.push(anyGrandparent.upper);
    }
    if (
      anyGrandparent.lower instanceof MathBlock &&
      anyGrandparent.lower !== currentBlock
    ) {
      siblings.push(anyGrandparent.lower);
    }
    if (
      anyGrandparent.radicand instanceof MathBlock &&
      anyGrandparent.radicand !== currentBlock
    ) {
      siblings.push(anyGrandparent.radicand);
    }
    if (
      anyGrandparent.index instanceof MathBlock &&
      anyGrandparent.index !== currentBlock
    ) {
      siblings.push(anyGrandparent.index);
    }
    if (
      anyGrandparent.sub instanceof MathBlock &&
      anyGrandparent.sub !== currentBlock
    ) {
      siblings.push(anyGrandparent.sub);
    }
    if (
      anyGrandparent.sup instanceof MathBlock &&
      anyGrandparent.sup !== currentBlock
    ) {
      siblings.push(anyGrandparent.sup);
    }
    if (
      anyGrandparent.content instanceof MathBlock &&
      anyGrandparent.content !== currentBlock
    ) {
      siblings.push(anyGrandparent.content);
    }

    return siblings;
  }

  /**
   * Delete the selection and return the deleted fragment.
   */
  deleteSelection(): NodeBase | undefined {
    if (!this.selection) return undefined;

    const leftEnd = this.selection.leftEnd;
    const rightEnd = this.selection.rightEnd;

    // Update cursor position before removing
    this[L] = leftEnd[L];
    this[R] = rightEnd[R];

    // Remove the selection
    this.selection.remove();
    this.clearSelection();

    this.show();
    return leftEnd; // Return the fragment's left end
  }

  /**
   * Delete to the left (backspace).
   */
  backspace(): NodeBase | undefined {
    return this.delete(L);
  }

  /**
   * Delete to the right (delete key).
   */
  deleteForward(): NodeBase | undefined {
    return this.delete(R);
  }

  /**
   * Replace the selection (or insert at cursor) with nodes.
   */
  replaceWith(nodes: NodeBase[]): this {
    this.deleteSelection();

    for (const node of nodes) {
      this.insert(node);
    }

    return this;
  }

  /**
   * Get the current position as a snapshot.
   */
  getPosition(): { parent: MathBlock; left?: NodeBase; right?: NodeBase } {
    return {
      parent: this.parent,
      left: this[L],
      right: this[R],
    };
  }

  /**
   * Restore cursor to a saved position.
   */
  restorePosition(pos: {
    parent: MathBlock;
    left?: NodeBase;
    right?: NodeBase;
  }): this {
    this.parent = pos.parent;
    this[L] = pos.left;
    this[R] = pos.right;
    this.show();
    return this;
  }
}
