/**
 * Aphelion - Node Base Class
 *
 * The foundation for all nodes in the math tree. Inspired by the original
 * Aphelion's node implementation based on tree structure but modernized for ES2020+.
 */

import {
  Direction,
  DirectionType,
  Ends,
  L,
  R,
  generateNodeId,
  otherDir,
} from "./types";

/**
 * Base class for all nodes in the math tree.
 *
 * The tree structure uses a doubly-linked list of siblings with parent pointers.
 * Each node can also have children, stored in `ends[L]` and `ends[R]`.
 */
export abstract class NodeBase {
  /** Unique identifier for this node */
  readonly id: number;

  /** Parent node (undefined for root) */
  parent?: NodeBase;

  /** Left and right ends (first/last children) */
  ends: Ends<NodeBase> = {};

  /** Left sibling */
  [L]?: NodeBase;

  /** Right sibling */
  [R]?: NodeBase;

  /** Associated DOM element for rendering */
  protected _domElement?: HTMLElement;

  constructor() {
    this.id = generateNodeId();
  }

  /**
   * Get the DOM element for this node.
   * Creates it if it doesn't exist.
   */
  get domElement(): HTMLElement {
    if (!this._domElement) {
      this._domElement = this.createDomElement();
    }
    return this._domElement;
  }

  /**
   * Create the DOM element for this node.
   * Override in subclasses to create specific elements.
   */
  protected abstract createDomElement(): HTMLElement;

  /**
   * Get the LaTeX representation of this node and its children.
   */
  abstract latex(): string;

  /**
   * Get the text representation (for accessibility).
   */
  abstract text(): string;

  /**
   * Get mathspeak representation for screen readers.
   */
  mathspeak(): string {
    return this.text();
  }

  /**
   * Whether this node is at the left end of its parent.
   */
  isLeftEnd(): boolean {
    return !this[L];
  }

  /**
   * Whether this node is at the right end of its parent.
   */
  isRightEnd(): boolean {
    return !this[R];
  }

  /**
   * Get the sibling in the given direction.
   */
  sibling(dir: DirectionType): NodeBase | undefined {
    return this[dir];
  }

  /**
   * Insert a node as a sibling in the given direction.
   */
  insertSibling(node: NodeBase, dir: DirectionType): this {
    const other = otherDir(dir);

    // Update sibling links
    node[other] = this;
    node[dir] = this[dir];

    if (this[dir]) {
      this[dir]![other] = node;
    } else if (this.parent) {
      // We were at the end, now the new node is
      this.parent.ends[dir] = node;
    }

    this[dir] = node;
    node.parent = this.parent;

    return this;
  }

  /**
   * Insert a node as the first or last child.
   */
  insertChild(node: NodeBase, dir: DirectionType): this {
    const other = otherDir(dir);

    node.parent = this;
    node[dir] = undefined;
    node[other] = this.ends[dir];

    if (this.ends[dir]) {
      this.ends[dir]![dir] = node;
    } else {
      // This is the first child, so it's both ends
      this.ends[other] = node;
    }

    this.ends[dir] = node;

    return this;
  }

  /**
   * Prepend a node as the first child.
   */
  prependChild(node: NodeBase): this {
    return this.insertChild(node, L);
  }

  /**
   * Append a node as the last child.
   */
  appendChild(node: NodeBase): this {
    return this.insertChild(node, R);
  }

  /**
   * Remove this node from its parent.
   */
  remove(): this {
    if (this[L]) {
      this[L]![R] = this[R];
    } else if (this.parent) {
      this.parent.ends[L] = this[R];
    }

    if (this[R]) {
      this[R]![L] = this[L];
    } else if (this.parent) {
      this.parent.ends[R] = this[L];
    }

    this.parent = undefined;
    this[L] = undefined;
    this[R] = undefined;

    return this;
  }

  /**
   * Iterate over children from left to right.
   */
  *children(): Generator<NodeBase> {
    let child = this.ends[L];
    while (child) {
      yield child;
      child = child[R];
    }
  }

  /**
   * Iterate over children from right to left.
   */
  *childrenReverse(): Generator<NodeBase> {
    let child = this.ends[R];
    while (child) {
      yield child;
      child = child[L];
    }
  }

  /**
   * Get the number of children.
   */
  childCount(): number {
    let count = 0;
    for (const _ of this.children()) {
      count++;
    }
    return count;
  }

  /**
   * Whether this node has any children.
   */
  hasChildren(): boolean {
    return this.ends[L] !== undefined;
  }

  /**
   * Post-order traversal (children first, then self).
   */
  postOrder(callback: (node: NodeBase) => void): void {
    for (const child of this.children()) {
      child.postOrder(callback);
    }
    callback(this);
  }

  /**
   * Pre-order traversal (self first, then children).
   */
  preOrder(callback: (node: NodeBase) => void): void {
    callback(this);
    for (const child of this.children()) {
      child.preOrder(callback);
    }
  }

  /**
   * Collect all descendants in post-order.
   */
  collectDescendants(): NodeBase[] {
    const nodes: NodeBase[] = [];
    this.postOrder((node) => nodes.push(node));
    return nodes;
  }

  /**
   * Find the leftmost leaf in this subtree.
   */
  leftmostLeaf(): NodeBase {
    let node: NodeBase = this;
    while (node.ends[L]) {
      node = node.ends[L];
    }
    return node;
  }

  /**
   * Find the rightmost leaf in this subtree.
   */
  rightmostLeaf(): NodeBase {
    let node: NodeBase = this;
    while (node.ends[R]) {
      node = node.ends[R];
    }
    return node;
  }

  /**
   * Get the depth of this node (distance from root).
   */
  depth(): number {
    let depth = 0;
    let node: NodeBase | undefined = this.parent;
    while (node) {
      depth++;
      node = node.parent;
    }
    return depth;
  }

  /**
   * Get the root of the tree.
   */
  root(): NodeBase {
    let node: NodeBase = this;
    while (node.parent) {
      node = node.parent;
    }
    return node;
  }

  /**
   * Check if this node is an ancestor of another node.
   */
  isAncestorOf(node: NodeBase): boolean {
    let current: NodeBase | undefined = node.parent;
    while (current) {
      if (current === this) return true;
      current = current.parent;
    }
    return false;
  }

  /**
   * Get the LaTeX of all children joined together.
   */
  childrenLatex(): string {
    const parts: string[] = [];
    for (const child of this.children()) {
      parts.push(child.latex());
    }
    return parts.join("");
  }

  /**
   * Update the DOM to reflect the current state.
   */
  abstract updateDom(): void;

  /**
   * Called after the node is inserted into the tree.
   */
  onInsert(): void {
    // Override in subclasses
  }

  /**
   * Called before the node is removed from the tree.
   */
  onRemove(): void {
    // Override in subclasses
  }

  /**
   * Handle reflow/recalculation of layout.
   */
  reflow(): void {
    // Override in subclasses that need layout recalculation
  }
}

/**
 * A fragment of the tree - a contiguous range of siblings.
 * Used for selections and bulk operations.
 */
export class NodeFragment {
  constructor(
    public readonly leftEnd: NodeBase,
    public readonly rightEnd: NodeBase = leftEnd,
  ) {}

  /**
   * Iterate over nodes in the fragment from left to right.
   */
  *[Symbol.iterator](): Generator<NodeBase> {
    let node: NodeBase | undefined = this.leftEnd;
    while (node) {
      yield node;
      if (node === this.rightEnd) break;
      node = node[R];
    }
  }

  /**
   * Get all nodes in the fragment as an array.
   */
  toArray(): NodeBase[] {
    return [...this];
  }

  /**
   * Get the combined LaTeX of all nodes in the fragment.
   */
  latex(): string {
    let result = "";
    for (const node of this) {
      result += node.latex();
    }
    return result;
  }

  /**
   * Get the combined text of all nodes in the fragment.
   */
  text(): string {
    let result = "";
    for (const node of this) {
      result += node.text();
    }
    return result;
  }

  /**
   * Remove all nodes in the fragment from the tree.
   */
  remove(): this {
    const parent = this.leftEnd.parent;
    if (!parent) return this;

    // Update parent's ends
    if (this.leftEnd[L]) {
      this.leftEnd[L]![R] = this.rightEnd[R];
    } else {
      parent.ends[L] = this.rightEnd[R];
    }

    if (this.rightEnd[R]) {
      this.rightEnd[R]![L] = this.leftEnd[L];
    } else {
      parent.ends[R] = this.leftEnd[L];
    }

    // Clear external links (but keep internal structure)
    this.leftEnd[L] = undefined;
    this.rightEnd[R] = undefined;

    return this;
  }

  /**
   * Insert this fragment after a given node.
   */
  insertAfter(node: NodeBase): this {
    const parent = node.parent;
    if (!parent) return this;

    // Set parent for all nodes
    for (const n of this) {
      n.parent = parent;
    }

    // Link into the tree
    this.leftEnd[L] = node;
    this.rightEnd[R] = node[R];

    if (node[R]) {
      node[R]![L] = this.rightEnd;
    } else {
      parent.ends[R] = this.rightEnd;
    }

    node[R] = this.leftEnd;

    return this;
  }

  /**
   * Insert this fragment before a given node.
   */
  insertBefore(node: NodeBase): this {
    const parent = node.parent;
    if (!parent) return this;

    // Set parent for all nodes
    for (const n of this) {
      n.parent = parent;
    }

    // Link into the tree
    this.rightEnd[R] = node;
    this.leftEnd[L] = node[L];

    if (node[L]) {
      node[L]![R] = this.leftEnd;
    } else {
      parent.ends[L] = this.leftEnd;
    }

    node[L] = this.rightEnd;

    return this;
  }
}
