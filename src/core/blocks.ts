/**
 * Aphelion - Math Block (Root Container)
 *
 * The root block that contains all math content. This is the top-level
 * container for a MathField or StaticMath instance.
 */

import { NodeBase } from "./node";
import { L, R } from "./types";

/**
 * A block that can contain math content.
 * Used as the root block and for containers like fraction numerator/denominator.
 */
export class MathBlock extends NodeBase {
  /** CSS class for styling */
  protected cssClass = "aphelion-root-block";

  protected createDomElement(): HTMLElement {
    const el = document.createElement("span");
    el.className = this.cssClass;
    el.setAttribute("data-mq-block-id", String(this.id));
    return el;
  }

  latex(): string {
    return this.childrenLatex();
  }

  text(): string {
    let result = "";
    for (const child of this.children()) {
      result += child.text();
    }
    return result;
  }

  updateDom(): void {
    const el = this.domElement;
    el.innerHTML = "";

    for (const child of this.children()) {
      child.updateDom();
      el.appendChild(child.domElement);
    }

    // Add empty block indicator if no children
    if (!this.hasChildren()) {
      el.classList.add("aphelion-empty");
    } else {
      el.classList.remove("aphelion-empty");
    }
  }

  /**
   * Whether this block is currently empty.
   */
  isEmpty(): boolean {
    return !this.hasChildren();
  }

  /**
   * Join children's mathspeak with spaces.
   */
  override mathspeak(): string {
    const parts: string[] = [];
    for (const child of this.children()) {
      parts.push(child.mathspeak());
    }
    return parts.join(" ");
  }
}

/**
 * The root block of a MathField. Has special behavior for focus/blur
 * and serves as the main container.
 */
export class RootBlock extends MathBlock {
  /** Reference to the controller (set after construction) */
  controller?: unknown;

  /** The cursor in this root block */
  cursor?: unknown;

  protected override cssClass = "aphelion-root-block";

  /**
   * Join all LaTeX content, wrapping in braces if needed for commands.
   */
  wrapLatex(): string {
    const content = this.latex();
    // If content has spaces or operators at boundaries, wrap in braces
    if (content.length > 1 && /^[+\-]|[+\-]$/.test(content)) {
      return `{${content}}`;
    }
    return content;
  }

  /**
   * Clear all content from the root block.
   */
  clear(): void {
    // Remove all children
    while (this.ends[L]) {
      this.ends[L]!.remove();
    }
  }
}

/**
 * A block used inside commands (like numerator/denominator of fractions).
 * Has slightly different behavior than the root block.
 */
export class InnerBlock extends MathBlock {
  protected override cssClass = "aphelion-inner-block";

  /** Whether this block should show a placeholder when empty */
  showPlaceholder = true;

  override updateDom(): void {
    const el = this.domElement;
    el.innerHTML = "";

    for (const child of this.children()) {
      child.updateDom();
      el.appendChild(child.domElement);
    }

    // Add placeholder or empty class (not both - to avoid double box)
    if (!this.hasChildren()) {
      if (this.showPlaceholder) {
        const placeholder = document.createElement("span");
        placeholder.className = "aphelion-placeholder";
        el.appendChild(placeholder);
        el.classList.remove("aphelion-empty");
      } else {
        el.classList.add("aphelion-empty");
      }
    } else {
      el.classList.remove("aphelion-empty");
    }
  }

  /**
   * Wrap content in braces for LaTeX output.
   */
  override latex(): string {
    return `{${this.childrenLatex()}}`;
  }
}
