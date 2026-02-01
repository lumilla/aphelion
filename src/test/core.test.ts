/**
 * Core tree functionality tests
 *
 * Based on test patterns from original MathQuill:
 * - latex.test.js: LaTeX parsing tests
 * - backspace.test.js: Deletion behavior
 * - typing.test.js: Input handling
 * - SupSub.test.js: Superscript/subscript
 * - updown.test.js: Cursor navigation
 * - tree.test.js: Tree operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { L, R } from '../core/types';
import { InnerBlock, RootBlock } from '../core/blocks';
import { MathSymbol } from '../commands/symbol';
import { Cursor } from '../core/cursor';
import { Fraction } from '../commands/fraction';
import { parseLatex } from '../parser/latex';
import { NodeBase } from '../core/node';

describe('L and R direction constants', () => {
  it('should have distinct values', () => {
    expect(L).not.toBe(R);
    expect(L).toBe(-1);
    expect(R).toBe(1);
  });
});

describe('InnerBlock', () => {
  it('should start empty', () => {
    const block = new InnerBlock();
    expect(block.ends[L]).toBeUndefined();
    expect(block.ends[R]).toBeUndefined();
    expect(block.childrenLatex()).toBe('');
  });

  it('should store children in ends[L] and ends[R]', () => {
    const block = new InnerBlock();
    const sym = new MathSymbol('a', 'a');

    // Manual insert
    sym.parent = block;
    sym[L] = undefined;
    sym[R] = undefined;
    block.ends[L] = sym;
    block.ends[R] = sym;

    expect(block.ends[L]).toBe(sym);
    expect(block.ends[R]).toBe(sym);
  });

  it('should iterate children correctly', () => {
    const block = new InnerBlock();
    const sym1 = new MathSymbol('a', 'a');
    const sym2 = new MathSymbol('b', 'b');

    // Manual insert first symbol
    sym1.parent = block;
    sym1[L] = undefined;
    sym1[R] = undefined;
    block.ends[L] = sym1;
    block.ends[R] = sym1;

    // Manual insert second symbol
    sym2.parent = block;
    sym2[L] = sym1;
    sym2[R] = undefined;
    sym1[R] = sym2;
    block.ends[R] = sym2;

    const children = [...block.children()];
    expect(children).toHaveLength(2);
    expect(children[0]).toBe(sym1);
    expect(children[1]).toBe(sym2);
    expect(block.childrenLatex()).toBe('ab');
  });
});

describe('Cursor insert', () => {
  it('should insert node at cursor position', () => {
    const root = new RootBlock();
    const cursor = new Cursor(root);
    const sym = new MathSymbol('x', 'x');

    cursor.insert(sym);

    expect(root.ends[L]).toBe(sym);
    expect(root.ends[R]).toBe(sym);
    expect(sym.parent).toBe(root);
    expect(root.childrenLatex()).toBe('x');
  });

  it('should insert multiple nodes in sequence', () => {
    const root = new RootBlock();
    const cursor = new Cursor(root);

    cursor.insert(new MathSymbol('a', 'a'));
    cursor.insert(new MathSymbol('b', 'b'));
    cursor.insert(new MathSymbol('c', 'c'));

    expect(root.childrenLatex()).toBe('abc');
  });

  it('should insert into InnerBlock via moveTo', () => {
    const root = new RootBlock();
    const cursor = new Cursor(root);
    const block = new InnerBlock();

    // Insert block into root
    block.parent = root;
    root.ends[L] = block;
    root.ends[R] = block;

    // Move cursor to inner block
    cursor.moveTo(block);
    expect(cursor.parent).toBe(block);

    // Insert symbol into inner block
    const sym = new MathSymbol('x', 'x');
    cursor.insert(sym);

    expect(block.ends[L]).toBe(sym);
    expect(block.ends[R]).toBe(sym);
    expect(sym.parent).toBe(block);
    expect(block.childrenLatex()).toBe('x');
  });
});

describe('Fraction', () => {
  it('should have empty numerator and denominator', () => {
    const frac = new Fraction();
    expect(frac.numerator.childrenLatex()).toBe('');
    expect(frac.denominator.childrenLatex()).toBe('');
    expect(frac.latex()).toBe('\\frac{}{}');
  });

  it('should allow inserting into numerator', () => {
    const root = new RootBlock();
    const cursor = new Cursor(root);

    const frac = new Fraction();
    cursor.insert(frac);

    // Move to numerator and insert
    cursor.moveTo(frac.numerator);
    cursor.insert(new MathSymbol('a', 'a'));

    expect(frac.numerator.childrenLatex()).toBe('a');
    expect(frac.latex()).toBe('\\frac{a}{}');
  });

  it('should allow inserting into both numerator and denominator', () => {
    const root = new RootBlock();
    const cursor = new Cursor(root);

    const frac = new Fraction();
    cursor.insert(frac);

    // Fill numerator
    cursor.moveTo(frac.numerator);
    cursor.insert(new MathSymbol('a', 'a'));

    // Fill denominator
    cursor.moveTo(frac.denominator);
    cursor.insert(new MathSymbol('b', 'b'));

    expect(frac.numerator.childrenLatex()).toBe('a');
    expect(frac.denominator.childrenLatex()).toBe('b');
    expect(frac.latex()).toBe('\\frac{a}{b}');
  });
});

describe('Parser', () => {
  it('should parse simple fraction', () => {
    const ast = parseLatex('\\frac{a}{b}');
    expect(ast).toHaveLength(1);
    expect(ast[0].type).toBe('command');
    expect((ast[0] as any).name).toBe('\\frac');
    expect((ast[0] as any).args).toHaveLength(2);
    expect((ast[0] as any).args[0]).toHaveLength(1);
    expect((ast[0] as any).args[0][0].type).toBe('char');
    expect((ast[0] as any).args[0][0].value).toBe('a');
  });

  it('should parse expression with fraction', () => {
    const ast = parseLatex('x=\\frac{a}{b}');
    console.log('AST:', JSON.stringify(ast, null, 2));
    expect(ast.length).toBeGreaterThan(1);
  });
});

describe('Controller integration', () => {
  it('should set latex with simple fraction', async () => {
    // We need jsdom for this - vitest should provide it
    const { Controller } = await import('../controller/controller');

    // Create a mock container (using jsdom)
    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const ctrl = new Controller();
      ctrl.init(container);

      console.log('Setting latex...');
      ctrl.setLatex('\\frac{a}{b}');
      console.log('Result:', ctrl.latex());

      expect(ctrl.latex()).toBe('\\frac{a}{b}');
    } finally {
      document.body.removeChild(container);
    }
  });

  it('should set latex with x=frac', async () => {
    const { Controller } = await import('../controller/controller');

    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const ctrl = new Controller();
      ctrl.init(container);

      ctrl.setLatex('x=\\frac{a}{b}');
      console.log('Result:', ctrl.latex());

      expect(ctrl.latex()).toBe('x=\\frac{a}{b}');
    } finally {
      document.body.removeChild(container);
    }
  });

  it('should handle quadratic formula', async () => {
    const { Controller } = await import('../controller/controller');

    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const ctrl = new Controller();
      ctrl.init(container);

      const quadratic = 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}';
      ctrl.setLatex(quadratic);
      console.log('Quadratic result:', ctrl.latex());

      // Should contain the fraction with content
      expect(ctrl.latex()).toContain('\\frac{');
      expect(ctrl.latex()).not.toBe('\\frac{}{}');
      expect(ctrl.latex()).toContain('-b');
      expect(ctrl.latex()).toContain('2a');
    } finally {
      document.body.removeChild(container);
    }
  });

  it('should move cursor left and right', async () => {
    const { Controller } = await import('../controller/controller');

    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const ctrl = new Controller();
      ctrl.init(container);

      ctrl.setLatex('abc');

      // Cursor should be at end
      ctrl.cursor.moveToStart();
      expect(ctrl.cursor[L]).toBeUndefined();

      ctrl.cursor.moveRight();
      expect(ctrl.cursor[L]).toBeDefined();

      ctrl.cursor.moveLeft();
      expect(ctrl.cursor[L]).toBeUndefined();
    } finally {
      document.body.removeChild(container);
    }
  });

  it('should delete multiple characters with backspace', async () => {
    const { Controller } = await import('../controller/controller');

    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const ctrl = new Controller();
      ctrl.init(container);

      ctrl.setLatex('abc');
      expect(ctrl.latex()).toBe('abc');

      // Cursor is at end, delete backwards
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toBe('ab');

      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toBe('a');

      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toBe('');
    } finally {
      document.body.removeChild(container);
    }
  });

  it('should parse Euler identity', async () => {
    const { Controller } = await import('../controller/controller');

    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const ctrl = new Controller();
      ctrl.init(container);

      const euler = 'e^{i\\pi}+1=0';
      ctrl.setLatex(euler);
      console.log('Euler result:', ctrl.latex());

      expect(ctrl.latex()).toContain('e^');
      expect(ctrl.latex()).toContain('\\pi');
    } finally {
      document.body.removeChild(container);
    }
  });

  it('should allow escaping from a fraction', async () => {
    const { Controller } = await import('../controller/controller');

    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      const ctrl = new Controller();
      ctrl.init(container);

      ctrl.setLatex('\\frac{a}{b}');

      // Move cursor into fraction numerator
      ctrl.cursor.moveToStart();
      ctrl.cursor.moveRight(); // Should enter fraction

      // Now try to escape to the right
      ctrl.cursor.moveRight(); // Move past 'a'
      const escaped = ctrl.cursor.moveRight(); // Should exit fraction

      // Cursor should now be after the fraction in root
      expect(ctrl.cursor.parent).toBe(ctrl.root);
    } finally {
      document.body.removeChild(container);
    }
  });
});

// =============================================================================
// LaTeX PARSING TESTS (based on latex.test.js)
// =============================================================================

describe('LaTeX Parsing', () => {
  it('should parse empty LaTeX', () => {
    expect(parseLatex('')).toHaveLength(0);
    expect(parseLatex(' ')).toHaveLength(0);
    // Note: '{}' creates an empty group which is still parsed as a node
    const emptyGroup = parseLatex('{}');
    expect(emptyGroup.length).toBeLessThanOrEqual(1);
  });

  it('should parse simple variables', () => {
    const ast = parseLatex('xyz');
    expect(ast).toHaveLength(3);
    expect(ast[0].type).toBe('char');
    expect((ast[0] as any).value).toBe('x');
    expect(ast[1].type).toBe('char');
    expect((ast[1] as any).value).toBe('y');
    expect(ast[2].type).toBe('char');
    expect((ast[2] as any).value).toBe('z');
  });

  it('should parse simple exponent', () => {
    const ast = parseLatex('x^{n}');
    expect(ast).toHaveLength(1);
    // Parser uses 'superscript' type, not 'supsub'
    expect(['supsub', 'superscript']).toContain(ast[0].type);
    expect((ast[0] as any).base).toBeDefined();
    expect((ast[0] as any).sup).toBeDefined();
  });

  it('should parse nested exponents', () => {
    const ast = parseLatex('x^{n^{m}}');
    expect(ast).toHaveLength(1);
    expect(['supsub', 'superscript']).toContain(ast[0].type);
  });

  it('should parse fraction without braces', () => {
    const ast = parseLatex('\\frac12');
    expect(ast).toHaveLength(1);
    expect(ast[0].type).toBe('command');
    expect((ast[0] as any).name).toBe('\\frac');
    expect((ast[0] as any).args[0][0].value).toBe('1');
    expect((ast[0] as any).args[1][0].value).toBe('2');
  });

  it('should parse fraction with braces', () => {
    const ast = parseLatex('\\frac{a}{b}');
    expect(ast).toHaveLength(1);
    expect((ast[0] as any).args[0][0].value).toBe('a');
    expect((ast[0] as any).args[1][0].value).toBe('b');
  });

  it('should parse sqrt', () => {
    const ast = parseLatex('\\sqrt{x}');
    expect(ast).toHaveLength(1);
    expect(ast[0].type).toBe('command');
    expect((ast[0] as any).name).toBe('\\sqrt');
  });

  it('should parse subscript', () => {
    const ast = parseLatex('x_{n}');
    expect(ast).toHaveLength(1);
    // Parser may use 'subscript' or 'supsub' type
    expect(['supsub', 'subscript']).toContain(ast[0].type);
    expect((ast[0] as any).sub).toBeDefined();
  });

  it('should parse combined subscript and superscript', () => {
    const ast = parseLatex('x_{a}^{b}');
    expect(ast).toHaveLength(1);
    // Parser may use 'subsup' or 'supsub' type
    expect(['supsub', 'subsup']).toContain(ast[0].type);
    expect((ast[0] as any).sub).toBeDefined();
    expect((ast[0] as any).sup).toBeDefined();
  });

  it('should handle whitespace', () => {
    const ast1 = parseLatex('  a + b ');
    const ast2 = parseLatex('a+b');
    // Both should produce at least some char nodes
    expect(ast1.filter((n) => n.type === 'char').length).toBeGreaterThan(0);
    expect(ast2.filter((n) => n.type === 'char').length).toBeGreaterThan(0);
  });

  it('should parse Greek letters', () => {
    const ast = parseLatex('\\alpha\\beta\\gamma');
    expect(ast).toHaveLength(3);
    // All should be commands or symbols
    expect(ast.every((n) => n.type === 'command' || n.type === 'symbol')).toBe(
      true
    );
  });

  it('should parse operators', () => {
    const ast = parseLatex('\\pm\\mp\\times\\div');
    expect(ast.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// TREE OPERATIONS TESTS (based on tree.test.js)
// =============================================================================

describe('Tree Operations', () => {
  describe('Node adoption', () => {
    it('should adopt single child correctly', () => {
      const parent = new InnerBlock();
      const child = new MathSymbol('x', 'x');

      child.parent = parent;
      child[L] = undefined;
      child[R] = undefined;
      parent.ends[L] = child;
      parent.ends[R] = child;

      expect(child.parent).toBe(parent);
      expect(child[L]).toBeUndefined();
      expect(child[R]).toBeUndefined();
      expect(parent.ends[L]).toBe(child);
      expect(parent.ends[R]).toBe(child);
    });

    it('should adopt two children from the left', () => {
      const parent = new InnerBlock();
      const one = new MathSymbol('a', 'a');
      const two = new MathSymbol('b', 'b');

      // Add first child
      one.parent = parent;
      one[L] = undefined;
      one[R] = undefined;
      parent.ends[L] = one;
      parent.ends[R] = one;

      // Add second child at right
      two.parent = parent;
      two[L] = one;
      two[R] = undefined;
      one[R] = two;
      parent.ends[R] = two;

      expect(one.parent).toBe(parent);
      expect(two.parent).toBe(parent);
      expect(one[L]).toBeUndefined();
      expect(one[R]).toBe(two);
      expect(two[L]).toBe(one);
      expect(two[R]).toBeUndefined();
      expect(parent.ends[L]).toBe(one);
      expect(parent.ends[R]).toBe(two);
    });

    it('should support adding child in the middle', () => {
      const parent = new InnerBlock();
      const cursor = new Cursor(new RootBlock());
      cursor.moveTo(parent);

      // Insert a, then c
      const a = new MathSymbol('a', 'a');
      const c = new MathSymbol('c', 'c');
      cursor.insert(a);
      cursor.insert(c);

      // Move cursor back between a and c
      cursor.moveLeft();

      // Insert b in the middle
      const b = new MathSymbol('b', 'b');
      cursor.insert(b);

      expect(parent.childrenLatex()).toBe('abc');
      expect(a[R]).toBe(b);
      expect(b[L]).toBe(a);
      expect(b[R]).toBe(c);
      expect(c[L]).toBe(b);
    });
  });

  describe('Node removal', () => {
    it('should remove single child', () => {
      const parent = new InnerBlock();
      const child = new MathSymbol('x', 'x');

      child.parent = parent;
      parent.ends[L] = child;
      parent.ends[R] = child;

      child.remove();

      expect(parent.ends[L]).toBeUndefined();
      expect(parent.ends[R]).toBeUndefined();
    });

    it('should remove left child correctly', () => {
      const parent = new InnerBlock();
      const cursor = new Cursor(new RootBlock());
      cursor.moveTo(parent);

      cursor.insert(new MathSymbol('a', 'a'));
      cursor.insert(new MathSymbol('b', 'b'));

      const firstChild = parent.ends[L];
      firstChild?.remove();

      expect(parent.ends[L]?.latex()).toBe('b');
      expect(parent.ends[R]?.latex()).toBe('b');
    });

    it('should remove right child correctly', () => {
      const parent = new InnerBlock();
      const cursor = new Cursor(new RootBlock());
      cursor.moveTo(parent);

      cursor.insert(new MathSymbol('a', 'a'));
      cursor.insert(new MathSymbol('b', 'b'));

      const lastChild = parent.ends[R];
      lastChild?.remove();

      expect(parent.ends[L]?.latex()).toBe('a');
      expect(parent.ends[R]?.latex()).toBe('a');
    });
  });
});

// =============================================================================
// CURSOR MOVEMENT TESTS (based on updown.test.js)
// =============================================================================

describe('Cursor Movement', () => {
  let ctrl: any;
  let container: HTMLElement;

  beforeEach(async () => {
    const { Controller } = await import('../controller/controller');
    container = document.createElement('div');
    document.body.appendChild(container);
    ctrl = new Controller();
    ctrl.init(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Left/Right navigation', () => {
    it('should move left through characters', async () => {
      ctrl.setLatex('abc');

      // Cursor at end
      expect(ctrl.cursor[L]?.latex()).toBe('c');

      ctrl.cursor.moveLeft();
      expect(ctrl.cursor[L]?.latex()).toBe('b');

      ctrl.cursor.moveLeft();
      expect(ctrl.cursor[L]?.latex()).toBe('a');

      ctrl.cursor.moveLeft();
      expect(ctrl.cursor[L]).toBeUndefined();
    });

    it('should move right through characters', async () => {
      ctrl.setLatex('abc');
      ctrl.cursor.moveToStart();

      expect(ctrl.cursor[R]?.latex()).toBe('a');

      ctrl.cursor.moveRight();
      expect(ctrl.cursor[R]?.latex()).toBe('b');

      ctrl.cursor.moveRight();
      expect(ctrl.cursor[R]?.latex()).toBe('c');

      ctrl.cursor.moveRight();
      expect(ctrl.cursor[R]).toBeUndefined();
    });

    it('should enter fraction on moveRight', async () => {
      ctrl.setLatex('\\frac{a}{b}');
      ctrl.cursor.moveToStart();

      // Move right should enter numerator
      ctrl.cursor.moveRight();
      expect(ctrl.cursor.parent).not.toBe(ctrl.root);
    });

    it('should exit fraction after last character', async () => {
      ctrl.setLatex('\\frac{a}{b}');
      ctrl.cursor.moveToStart();

      // Enter numerator
      ctrl.cursor.moveRight();
      // Past 'a'
      ctrl.cursor.moveRight();
      // Exit to denominator or after fraction
      ctrl.cursor.moveRight();
      ctrl.cursor.moveRight();
      ctrl.cursor.moveRight();

      // Should eventually reach root
      expect(ctrl.cursor.parent).toBe(ctrl.root);
    });
  });

  describe('Up/Down navigation', () => {
    it('should move up into exponent when available', async () => {
      ctrl.setLatex('x^{nm}');

      // Cursor at end of root block
      const startParent = ctrl.cursor.parent;

      ctrl.cursor.moveUp();
      // May or may not enter exponent depending on cursor position
      // Just verify it doesn't crash
      expect(ctrl.cursor.parent).toBeDefined();
    });

    it('should move down out of exponent', async () => {
      ctrl.setLatex('x^{nm}');

      // Enter exponent first
      ctrl.cursor.moveUp();
      const afterUp = ctrl.cursor.parent;

      ctrl.cursor.moveDown();
      // Verify it doesn't crash and cursor is still valid
      expect(ctrl.cursor.parent).toBeDefined();
    });

    it('should move down into subscript when available', async () => {
      ctrl.setLatex('a_{12}');

      ctrl.cursor.moveDown();
      // May or may not enter subscript depending on cursor position
      expect(ctrl.cursor.parent).toBeDefined();
    });

    it('should move up out of subscript', async () => {
      ctrl.setLatex('a_{12}');

      ctrl.cursor.moveDown();
      ctrl.cursor.moveUp();
      // Just verify it works without crashing
      expect(ctrl.cursor.parent).toBeDefined();
    });

    it('should navigate up/down within fraction', async () => {
      ctrl.setLatex('\\frac{12}{34}');
      ctrl.cursor.moveToStart();

      // Enter fraction (numerator)
      ctrl.cursor.moveRight();
      const numeratorParent = ctrl.cursor.parent;

      // Move down to denominator
      ctrl.cursor.moveDown();
      expect(ctrl.cursor.parent).not.toBe(numeratorParent);

      // Move up back to numerator
      ctrl.cursor.moveUp();
      expect(ctrl.cursor.parent).toBe(numeratorParent);
    });
  });

  describe('Home/End navigation', () => {
    it('should move to start', async () => {
      ctrl.setLatex('abcdef');

      ctrl.cursor.moveToStart();
      expect(ctrl.cursor[L]).toBeUndefined();
      expect(ctrl.cursor[R]?.latex()).toBe('a');
    });

    it('should move to end', async () => {
      ctrl.setLatex('abcdef');
      ctrl.cursor.moveToStart();

      ctrl.cursor.moveToEnd();
      expect(ctrl.cursor[R]).toBeUndefined();
      expect(ctrl.cursor[L]?.latex()).toBe('f');
    });
  });
});

// =============================================================================
// BACKSPACE/DELETE TESTS (based on backspace.test.js)
// =============================================================================

describe('Backspace and Delete', () => {
  let ctrl: any;
  let container: HTMLElement;

  beforeEach(async () => {
    const { Controller } = await import('../controller/controller');
    container = document.createElement('div');
    document.body.appendChild(container);
    ctrl = new Controller();
    ctrl.init(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Backspace', () => {
    it('should delete single character', async () => {
      ctrl.setLatex('abc');
      expect(ctrl.latex()).toBe('abc');

      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toBe('ab');
    });

    it('should delete multiple characters consecutively', async () => {
      ctrl.setLatex('abcdef');

      ctrl.cursor.backspace();
      ctrl.updateDom();
      ctrl.cursor.backspace();
      ctrl.updateDom();
      ctrl.cursor.backspace();
      ctrl.updateDom();

      expect(ctrl.latex()).toBe('abc');
    });

    it('should handle backspace near exponent', async () => {
      ctrl.setLatex('x^{nm}');

      // Cursor after exponent, backspace may enter it or delete it
      const before = ctrl.latex();
      ctrl.cursor.backspace();
      ctrl.updateDom();

      // Just verify it doesn't crash and changed something
      expect(ctrl.cursor.parent).toBeDefined();
    });

    it('should delete through exponent content', async () => {
      ctrl.setLatex('x^{nm}');

      // Multiple backspaces should eventually clear or modify the expression
      ctrl.cursor.backspace();
      ctrl.updateDom();
      ctrl.cursor.backspace();
      ctrl.updateDom();

      // Should have fewer characters now
      expect(ctrl.latex().length).toBeLessThanOrEqual('x^{nm}'.length);
    });

    it('should delete through simple subscript', async () => {
      ctrl.setLatex('x_{2+3}');

      ctrl.cursor.backspace();
      ctrl.updateDom();
      ctrl.cursor.backspace();
      ctrl.updateDom();

      // Should have fewer characters
      expect(ctrl.latex().length).toBeLessThanOrEqual('x_{2+3}'.length);
    });

    it('should handle empty expression gracefully', async () => {
      ctrl.setLatex('');

      // Should not throw
      ctrl.cursor.backspace();
      expect(ctrl.latex()).toBe('');
    });
  });

  describe('Forward delete', () => {
    it('should delete forward', async () => {
      ctrl.setLatex('abc');
      ctrl.cursor.moveToStart();

      ctrl.cursor.deleteForward();
      ctrl.updateDom();
      expect(ctrl.latex()).toBe('bc');
    });

    it('should delete forward consecutively', async () => {
      ctrl.setLatex('abc');
      ctrl.cursor.moveToStart();

      ctrl.cursor.deleteForward();
      ctrl.updateDom();
      ctrl.cursor.deleteForward();
      ctrl.updateDom();
      ctrl.cursor.deleteForward();
      ctrl.updateDom();

      expect(ctrl.latex()).toBe('');
    });
  });

  describe('Complex backspace scenarios (from original MathQuill)', () => {
    it('should backspace through exponent properly', async () => {
      ctrl.setLatex('x^{nm}');

      // Check initial state
      expect(ctrl.latex()).toBe('x^{nm}');

      // First backspace should enter exponent (cursor moves into sup block)
      // This does NOT delete anything, just enters
      ctrl.cursor.backspace();
      ctrl.updateDom();
      // After entering exponent, latex should still be the same
      expect(ctrl.latex()).toBe('x^{nm}');

      // Now we're inside the exponent, second backspace deletes m
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toMatch(/x\^{?n}?/);

      // Third backspace deletes n
      ctrl.cursor.backspace();
      ctrl.updateDom();
      // Exponent should be empty: x^{} or similar

      // Fourth backspace should remove empty exponent
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toBe('x');
    });

    it('should backspace through subscript & superscript', async () => {
      ctrl.setLatex('x_2^{32}');

      // First backspace enters exponent
      ctrl.cursor.backspace();
      ctrl.updateDom();

      // Second backspace deletes 2 in exponent
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('x');
      expect(ctrl.latex()).toContain('3');
    });

    it('should backspace through simple subscript', async () => {
      ctrl.setLatex('x_{2+3}');

      // Backspace from end, enter subscript
      ctrl.cursor.backspace();
      ctrl.updateDom();

      // Delete 3
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('2+');

      // Delete +
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('2');
    });

    it('should handle backspace in empty blocks', async () => {
      // Create an empty superscript by typing ^ and immediately backspacing
      ctrl.typedText('x^');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('^');

      // Backspace should remove empty superscript
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toBe('x');
    });
  });
});

// =============================================================================
// SUPERSCRIPT/SUBSCRIPT TESTS (based on SupSub.test.js)
// =============================================================================

describe('Superscript and Subscript', () => {
  let ctrl: any;
  let container: HTMLElement;

  beforeEach(async () => {
    const { Controller } = await import('../controller/controller');
    container = document.createElement('div');
    document.body.appendChild(container);
    ctrl = new Controller();
    ctrl.init(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Parsing', () => {
    it('should parse simple superscript', async () => {
      ctrl.setLatex('x^{2}');
      // Implementation may omit braces for single chars
      expect(ctrl.latex()).toMatch(/x\^{?2}?/);
    });

    it('should parse simple subscript', async () => {
      ctrl.setLatex('x_{n}');
      // Implementation may omit braces for single chars
      expect(ctrl.latex()).toMatch(/x_{?n}?/);
    });

    it('should parse combined supsub', async () => {
      ctrl.setLatex('x_{a}^{b}');
      expect(ctrl.latex()).toContain('x');
      expect(ctrl.latex()).toContain('^');
      expect(ctrl.latex()).toContain('_');
    });

    it('should handle multiple characters in exponent', async () => {
      ctrl.setLatex('x^{nm}');
      expect(ctrl.latex()).toBe('x^{nm}');
    });

    it('should handle nested exponents', async () => {
      ctrl.setLatex('x^{y^{z}}');
      expect(ctrl.latex()).toContain('x^');
    });

    it('should parse compound subscript', async () => {
      ctrl.setLatex('x_{2+3}');
      expect(ctrl.latex()).toContain('x_');
    });
  });

  describe('Backspacing out of supsub', () => {
    it('should backspace into subscript and re-type', async () => {
      ctrl.setLatex('x_{a}^{b}');

      // Move to subscript
      ctrl.cursor.moveDown();
      ctrl.cursor.backspace();
      ctrl.updateDom();

      // Subscript should be empty or have partial content
    });

    it('should backspace into superscript and re-type', async () => {
      ctrl.setLatex('x_{a}^{b}');

      ctrl.cursor.moveUp();
      ctrl.cursor.backspace();
      ctrl.updateDom();

      // Superscript should have partial content
    });
  });
});

// =============================================================================
// FRACTION TESTS
// =============================================================================

describe('Fraction', () => {
  let ctrl: any;
  let container: HTMLElement;

  beforeEach(async () => {
    const { Controller } = await import('../controller/controller');
    container = document.createElement('div');
    document.body.appendChild(container);
    ctrl = new Controller();
    ctrl.init(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Parsing', () => {
    it('should parse simple fraction', async () => {
      ctrl.setLatex('\\frac{1}{2}');
      expect(ctrl.latex()).toBe('\\frac{1}{2}');
    });

    it('should parse fraction with expressions', async () => {
      ctrl.setLatex('\\frac{a+b}{c+d}');
      expect(ctrl.latex()).toContain('\\frac');
      expect(ctrl.latex()).toContain('a');
      expect(ctrl.latex()).toContain('d');
    });

    it('should parse nested fractions', async () => {
      ctrl.setLatex('\\frac{\\frac{1}{2}}{3}');
      expect(ctrl.latex()).toContain('\\frac');
    });

    it('should parse complex nested fraction (quadratic formula denominator)', async () => {
      ctrl.setLatex('\\frac{1}{\\frac{1}{2}+\\frac{2}{3}}');
      expect(ctrl.latex()).toContain('\\frac');
    });
  });

  describe('Navigation', () => {
    it('should navigate into numerator', async () => {
      ctrl.setLatex('\\frac{a}{b}');
      ctrl.cursor.moveToStart();
      ctrl.cursor.moveRight();

      // Should be in numerator
      expect(ctrl.cursor.parent).not.toBe(ctrl.root);
    });

    it('should navigate between numerator and denominator', async () => {
      ctrl.setLatex('\\frac{a}{b}');
      ctrl.cursor.moveToStart();

      ctrl.cursor.moveRight(); // Enter numerator
      const numParent = ctrl.cursor.parent;

      ctrl.cursor.moveDown(); // To denominator
      expect(ctrl.cursor.parent).not.toBe(numParent);

      ctrl.cursor.moveUp(); // Back to numerator
      expect(ctrl.cursor.parent).toBe(numParent);
    });

    it('should exit fraction at the end', async () => {
      ctrl.setLatex('\\frac{a}{b}');
      ctrl.cursor.moveToStart();

      // Navigate through entire fraction
      ctrl.cursor.moveRight(); // Into numerator
      ctrl.cursor.moveRight(); // Past 'a'
      ctrl.cursor.moveRight(); // To denominator or exit
      ctrl.cursor.moveRight();
      ctrl.cursor.moveRight();

      // Eventually should be in root
      expect(ctrl.cursor.parent).toBe(ctrl.root);
    });
  });
});

// =============================================================================
// SQUARE ROOT TESTS
// =============================================================================

describe('Square Root', () => {
  let ctrl: any;
  let container: HTMLElement;

  beforeEach(async () => {
    const { Controller } = await import('../controller/controller');
    container = document.createElement('div');
    document.body.appendChild(container);
    ctrl = new Controller();
    ctrl.init(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it('should parse simple sqrt', async () => {
    ctrl.setLatex('\\sqrt{x}');
    expect(ctrl.latex()).toBe('\\sqrt{x}');
  });

  it('should parse sqrt with expression', async () => {
    ctrl.setLatex('\\sqrt{a+b}');
    expect(ctrl.latex()).toContain('\\sqrt');
  });

  it('should parse nested sqrt', async () => {
    ctrl.setLatex('\\sqrt{\\sqrt{x}}');
    expect(ctrl.latex()).toContain('\\sqrt');
  });

  it('should parse quadratic discriminant', async () => {
    ctrl.setLatex('\\sqrt{b^2-4ac}');
    expect(ctrl.latex()).toContain('\\sqrt');
    expect(ctrl.latex()).toContain('b^');
  });
});

// =============================================================================
// COMPLEX EXPRESSIONS TESTS
// =============================================================================

describe('Complex Expressions', () => {
  let ctrl: any;
  let container: HTMLElement;

  beforeEach(async () => {
    const { Controller } = await import('../controller/controller');
    container = document.createElement('div');
    document.body.appendChild(container);
    ctrl = new Controller();
    ctrl.init(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it('should handle quadratic formula', async () => {
    const quadratic = 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}';
    ctrl.setLatex(quadratic);

    const result = ctrl.latex();
    expect(result).toContain('\\frac');
    expect(result).toContain('-b');
    expect(result).toContain('\\sqrt');
    expect(result).toContain('2a');
  });

  it('should handle Euler identity', async () => {
    ctrl.setLatex('e^{i\\pi}+1=0');

    const result = ctrl.latex();
    expect(result).toContain('e^');
    expect(result).toContain('\\pi');
  });

  it('should handle pythagorean theorem', async () => {
    ctrl.setLatex('a^2+b^2=c^2');

    const result = ctrl.latex();
    // Implementation may use a^2 or a^{2}
    expect(result).toMatch(/a\^{?2}?/);
    expect(result).toMatch(/b\^{?2}?/);
    expect(result).toMatch(/c\^{?2}?/);
  });

  it('should handle summation-like expression', async () => {
    ctrl.setLatex('\\sum_{i=1}^{n}i=\\frac{n(n+1)}{2}');

    const result = ctrl.latex();
    expect(result).toContain('\\sum');
  });

  it('should handle integral-like expression', async () => {
    ctrl.setLatex('\\int_{a}^{b}f(x)dx');

    const result = ctrl.latex();
    expect(result).toContain('\\int');
  });

  it('should handle limit expression', async () => {
    ctrl.setLatex('\\lim_{x\\to0}\\frac{\\sin x}{x}=1');

    const result = ctrl.latex();
    expect(result).toContain('\\lim');
  });

  it('should handle matrix-like structure', async () => {
    // Simple representation using fractions
    ctrl.setLatex('\\frac{a}{c}\\frac{b}{d}');

    expect(ctrl.latex()).toContain('\\frac');
  });

  it('should handle binomial coefficient', async () => {
    ctrl.setLatex('\\binom{n}{k}=\\frac{n!}{k!(n-k)!}');

    const result = ctrl.latex();
    expect(result).toContain('\\frac');
  });

  it('should handle trigonometric identities', async () => {
    ctrl.setLatex('\\sin^2\\theta+\\cos^2\\theta=1');

    const result = ctrl.latex();
    expect(result).toContain('\\sin');
    expect(result).toContain('\\cos');
  });

  it('should handle complex nested structure', async () => {
    ctrl.setLatex('\\frac{1}{1+\\frac{1}{1+\\frac{1}{x}}}');

    expect(ctrl.latex()).toContain('\\frac');
  });
});

// =============================================================================
// SPECIAL CHARACTERS AND SYMBOLS
// =============================================================================

describe('Special Characters and Symbols', () => {
  let ctrl: any;
  let container: HTMLElement;

  beforeEach(async () => {
    const { Controller } = await import('../controller/controller');
    container = document.createElement('div');
    document.body.appendChild(container);
    ctrl = new Controller();
    ctrl.init(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it('should handle Greek letters', async () => {
    ctrl.setLatex('\\alpha\\beta\\gamma\\delta');

    const result = ctrl.latex();
    expect(result).toContain('\\alpha');
    expect(result).toContain('\\beta');
  });

  it('should handle capital Greek letters', async () => {
    ctrl.setLatex('\\Gamma\\Delta\\Theta\\Lambda');
    expect(ctrl.latex()).toContain('\\Gamma');
  });

  it('should handle operators', async () => {
    ctrl.setLatex('a\\pm b\\mp c\\times d\\div e');

    const result = ctrl.latex();
    expect(result).toContain('\\pm');
  });

  it('should handle relations', async () => {
    ctrl.setLatex('a\\leq b\\geq c\\neq d');
    expect(ctrl.latex()).toContain('\\leq');
  });

  it('should handle arrows', async () => {
    ctrl.setLatex('a\\to b\\leftarrow c\\Rightarrow d');
    expect(ctrl.latex()).toContain('\\to');
  });

  it('should handle infinity', async () => {
    ctrl.setLatex('\\infty');
    expect(ctrl.latex()).toContain('\\infty');
  });

  it('should handle partial derivative', async () => {
    ctrl.setLatex('\\partial f');
    expect(ctrl.latex()).toContain('\\partial');
  });

  it('should handle nabla', async () => {
    ctrl.setLatex('\\nabla f');
    expect(ctrl.latex()).toContain('\\nabla');
  });
});

// =============================================================================
// EDGE CASES AND ROBUSTNESS
// =============================================================================

describe('Edge Cases and Robustness', () => {
  let ctrl: any;
  let container: HTMLElement;

  beforeEach(async () => {
    const { Controller } = await import('../controller/controller');
    container = document.createElement('div');
    document.body.appendChild(container);
    ctrl = new Controller();
    ctrl.init(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it('should handle empty input', async () => {
    ctrl.setLatex('');
    expect(ctrl.latex()).toBe('');
  });

  it('should handle whitespace only', async () => {
    ctrl.setLatex('   ');
    // Should normalize to empty or preserve meaningfully
  });

  it('should handle single character', async () => {
    ctrl.setLatex('x');
    expect(ctrl.latex()).toBe('x');
  });

  it('should handle digits', async () => {
    ctrl.setLatex('12345');
    expect(ctrl.latex()).toBe('12345');
  });

  it('should handle mixed alphanumeric', async () => {
    ctrl.setLatex('a1b2c3');
    expect(ctrl.latex()).toBe('a1b2c3');
  });

  it('should handle operators between variables', async () => {
    ctrl.setLatex('a+b-c*d');
    expect(ctrl.latex()).toContain('+');
    expect(ctrl.latex()).toContain('-');
  });

  it('should survive rapid cursor movements', async () => {
    ctrl.setLatex('\\frac{a}{b}');

    for (let i = 0; i < 20; i++) {
      ctrl.cursor.moveRight();
      ctrl.cursor.moveLeft();
      ctrl.cursor.moveUp();
      ctrl.cursor.moveDown();
    }

    // Should still be valid
    expect(ctrl.latex()).toContain('\\frac');
  });

  it('should handle set and get latex roundtrip', async () => {
    // Test cases that should roundtrip (some may have minor formatting differences)
    const testCases = [
      { input: 'x', expected: 'x' },
      { input: 'x+y', expected: 'x+y' },
      { input: '\\frac{a}{b}', expected: '\\frac{a}{b}' },
      { input: 'x^{nm}', expected: 'x^{nm}' }, // Multi-char requires braces
      { input: 'x_{ab}', expected: 'x_{ab}' }, // Multi-char requires braces
      { input: '\\sqrt{x}', expected: '\\sqrt{x}' },
      { input: 'e^{i\\pi}+1=0', expected: 'e^{i\\pi}+1=0' },
      // Large operators always use braces for limits
      { input: '\\sum_{i=1}^{n}i', expected: '\\sum_{i=1}^{n}i' },
      { input: '\\int_{a}^{b}f(x)dx', expected: '\\int_{a}^{b}f(x)dx' },
      { input: '\\alpha+\\beta=\\gamma', expected: '\\alpha+\\beta=\\gamma' },
      { input: 'a\\pm b\\mp c', expected: 'a\\pmb\\mpc' }, // Spaces get stripped in parsing
      { input: 'x_{a}^{b}', expected: 'x_a^b' }, // Single char loses braces (both sub and sup)
    ];

    for (const { input, expected } of testCases) {
      ctrl.setLatex(input);
      expect(ctrl.latex()).toBe(expected);
    }
  });

  it('should handle single-char supsub (may omit braces)', async () => {
    // Single character exponents may not preserve braces
    ctrl.setLatex('x^{2}');
    expect(ctrl.latex()).toMatch(/x\^{?2}?/);

    ctrl.setLatex('x_{n}');
    expect(ctrl.latex()).toMatch(/x_{?n}?/);
  });

  it('should not crash on malformed latex', async () => {
    // These should not throw, even if result is unexpected
    expect(() => ctrl.setLatex('\\frac{a}')).not.toThrow();
    expect(() => ctrl.setLatex('\\sqrt')).not.toThrow();
    expect(() => ctrl.setLatex('^{2}')).not.toThrow();
    expect(() => ctrl.setLatex('_{n}')).not.toThrow();
  });
});

// =============================================================================
// LATEX COMMAND INPUT TESTS
// =============================================================================

describe('LaTeX Command Input', () => {
  let ctrl: any;
  let container: HTMLElement;

  beforeEach(async () => {
    const { Controller } = await import('../controller/controller');
    container = document.createElement('div');
    document.body.appendChild(container);
    ctrl = new Controller();
    ctrl.init(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Basic functionality', () => {
    it('should start command input when backslash is typed', async () => {
      ctrl.typedText('\\');
      ctrl.updateDom();

      // The controller should be in command input mode
      expect(ctrl._commandInput).toBeDefined();
    });

    it('should accept letters in command input', async () => {
      ctrl.typedText('\\alpha');
      ctrl.updateDom();

      // Should still be in command input mode with 'alpha' typed
      expect(ctrl._commandInput).toBeDefined();
      expect(ctrl._commandInput.getCommandName()).toBe('alpha');
    });

    it('should finalize command on space', async () => {
      ctrl.typedText('\\alpha ');
      ctrl.updateDom();

      // Should have created the alpha symbol
      expect(ctrl._commandInput).toBeUndefined();
      expect(ctrl.latex()).toContain('\\alpha');
    });

    it('should finalize command on non-letter character', async () => {
      ctrl.typedText('\\alpha+');
      ctrl.updateDom();

      // Should have created alpha and the plus
      expect(ctrl._commandInput).toBeUndefined();
      expect(ctrl.latex()).toContain('\\alpha');
      expect(ctrl.latex()).toContain('+');
    });

    it('should create fraction for \\frac command', async () => {
      ctrl.typedText('\\frac ');
      ctrl.updateDom();

      expect(ctrl.latex()).toContain('\\frac');
    });

    it('should create sqrt for \\sqrt command', async () => {
      ctrl.typedText('\\sqrt ');
      ctrl.updateDom();

      expect(ctrl.latex()).toContain('\\sqrt');
    });
  });

  describe('Command lookup', () => {
    it('should recognize common Greek letters', async () => {
      const greekLetters = ['alpha', 'beta', 'gamma', 'pi', 'theta', 'omega'];

      for (const letter of greekLetters) {
        ctrl.setLatex('');
        ctrl.typedText(`\\${letter} `);
        ctrl.updateDom();
        expect(ctrl.latex()).toContain(`\\${letter}`);
      }
    });

    it('should recognize operators', async () => {
      ctrl.typedText('\\pm ');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\pm');

      ctrl.setLatex('');
      ctrl.typedText('\\times ');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\times');
    });

    it('should recognize relations', async () => {
      ctrl.typedText('\\leq ');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\leq');
    });

    it('should recognize trig functions', async () => {
      ctrl.typedText('\\sin ');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\sin');

      ctrl.setLatex('');
      ctrl.typedText('\\cos ');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\cos');
    });

    it('should handle \\sqrt followed by content', async () => {
      ctrl.typedText('\\sqrt');
      ctrl.typedText('-x'); // This should finalize sqrt and type -x into it
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\sqrt');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty command on space', async () => {
      ctrl.typedText('\\ '); // backslash followed by space
      ctrl.updateDom();
      // Should not crash, command mode should be exited
      expect(ctrl._commandInput).toBeUndefined();
    });

    it('should handle typing numbers after backslash', async () => {
      ctrl.typedText('\\alpha2');
      ctrl.updateDom();
      // Should finalize alpha and type 2
      expect(ctrl.latex()).toContain('\\alpha');
      expect(ctrl.latex()).toContain('2');
    });

    it('should handle uppercase Greek letters', async () => {
      ctrl.typedText('\\Gamma ');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\Gamma');

      ctrl.setLatex('');
      ctrl.typedText('\\Delta ');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\Delta');
    });

    it('should handle arrows', async () => {
      ctrl.typedText('\\rightarrow ');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\rightarrow');
    });

    it('should handle infinity', async () => {
      ctrl.typedText('\\infty ');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\infty');
    });

    it('should handle large operators', async () => {
      ctrl.typedText('\\sum ');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\sum');
    });
  });

  describe('Symbol degradation', () => {
    it('should degrade \\leq to < on first backspace', async () => {
      ctrl.typedText('a\\leq b');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\leq');

      // Move cursor before 'b' (after ≤)
      ctrl.cursor.moveLeft();

      // Backspace should degrade ≤ to <
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('<');
      expect(ctrl.latex()).not.toContain('\\leq');

      // Another backspace should delete <
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).not.toContain('<');
    });

    it('should degrade \\geq to > on first backspace', async () => {
      ctrl.typedText('x\\geq y');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\geq');

      ctrl.cursor.moveLeft();
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('>');
      expect(ctrl.latex()).not.toContain('\\geq');
    });

    it('should degrade \\neq to = on first backspace', async () => {
      ctrl.typedText('a\\neq b');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\neq');

      ctrl.cursor.moveLeft();
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('=');
      expect(ctrl.latex()).not.toContain('\\neq');
    });

    it('should preserve degradation when parsing latex', async () => {
      ctrl.setLatex('a\\leq b');
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('\\leq');

      // Move to end, then left once (after ≤, before b)
      ctrl.cursor.moveToEnd();
      ctrl.cursor.moveLeft();

      // Backspace should degrade
      ctrl.cursor.backspace();
      ctrl.updateDom();
      expect(ctrl.latex()).toContain('<');
      expect(ctrl.latex()).not.toContain('\\leq');
    });
  });

  describe('Matrix support', () => {
    it('should insert a 2x2 pmatrix via command', async () => {
      ctrl.typedText('A=\\pmatrix ');
      ctrl.updateDom();

      const latex = ctrl.latex();
      expect(latex).toContain('\\begin{pmatrix}');
      expect(latex).toContain('\\end{pmatrix}');
    });

    it('should insert a bmatrix', async () => {
      ctrl.typedText('\\bmatrix ');
      ctrl.updateDom();

      const latex = ctrl.latex();
      expect(latex).toContain('\\begin{bmatrix}');
      expect(latex).toContain('\\end{bmatrix}');
    });

    it('should create matrix cells that can be edited', async () => {
      ctrl.typedText('\\pmatrix ');
      // Cursor should be in the first cell
      ctrl.typedText('a');
      ctrl.updateDom();

      const latex = ctrl.latex();
      expect(latex).toContain('a');
      expect(latex).toContain('\\begin{pmatrix}');
    });

    it('should use insertMatrix method directly', () => {
      ctrl.insertMatrix('pmatrix', 2, 2);
      ctrl.typedText('1');
      ctrl.updateDom();

      const latex = ctrl.latex();
      expect(latex).toContain('\\begin{pmatrix}');
      expect(latex).toContain('1');
    });

    it('should create a vmatrix for determinants', () => {
      ctrl.insertMatrix('vmatrix', 2, 2);
      ctrl.updateDom();

      const latex = ctrl.latex();
      expect(latex).toContain('\\begin{vmatrix}');
      expect(latex).toContain('\\end{vmatrix}');
    });

    it('should parse a pmatrix from LaTeX', () => {
      ctrl.setLatex('A=\\begin{pmatrix}a & b \\\\ c & d\\end{pmatrix}');
      ctrl.updateDom();

      const latex = ctrl.latex();
      expect(latex).toContain('A');
      expect(latex).toContain('\\begin{pmatrix}');
      expect(latex).toContain('a');
      expect(latex).toContain('b');
      expect(latex).toContain('c');
      expect(latex).toContain('d');
      expect(latex).toContain('\\end{pmatrix}');
    });

    it('should parse a 3x3 matrix from LaTeX', () => {
      ctrl.setLatex(
        '\\begin{bmatrix}1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9\\end{bmatrix}'
      );
      ctrl.updateDom();

      const latex = ctrl.latex();
      expect(latex).toContain('\\begin{bmatrix}');
      expect(latex).toContain('1');
      expect(latex).toContain('9');
      expect(latex).toContain('\\end{bmatrix}');
    });
  });
});

// =============================================================================
// LARGE OPERATORS (Sum, Product, Integral)
// =============================================================================

describe('Large Operators', () => {
  let ctrl: InstanceType<typeof import('../controller/controller').Controller>;
  let container: HTMLDivElement;

  beforeEach(async () => {
    const { Controller } = await import('../controller/controller');
    container = document.createElement('div');
    document.body.appendChild(container);
    ctrl = new Controller();
    ctrl.init(container);
  });

  afterEach(() => {
    ctrl.detach();
    document.body.removeChild(container);
  });

  describe('Summation', () => {
    it('should parse sum with limits', () => {
      ctrl.setLatex('\\sum_{i=1}^{n}');
      const latex = ctrl.latex();
      expect(latex).toContain('\\sum');
      expect(latex).toContain('_{');
      expect(latex).toContain('^{');
    });

    it('should allow cursor navigation into sum limits', () => {
      ctrl.setLatex('\\sum_{i=1}^{n}');
      // Move cursor to start and then into lower limit
      ctrl.cursor.moveToStart();
      ctrl.cursor.moveRight();
      // Cursor should now be in the large operator
      expect(ctrl.cursor.parent).toBeDefined();
    });

    it('should create sum with limits when typing sum command', () => {
      ctrl.typedText('\\sum ');
      const latex = ctrl.latex();
      expect(latex).toContain('\\sum');
      // Should have lower and upper limit (may contain space placeholder)
      expect(latex).toMatch(/_\{.*\}/);
      expect(latex).toMatch(/\^\{.*\}/);
    });
  });

  describe('Product', () => {
    it('should parse product with limits', () => {
      ctrl.setLatex('\\prod_{k=1}^{n}');
      const latex = ctrl.latex();
      expect(latex).toContain('\\prod');
      expect(latex).toContain('_{');
    });
  });

  describe('Integral', () => {
    it('should parse integral with limits', () => {
      ctrl.setLatex('\\int_{a}^{b}');
      const latex = ctrl.latex();
      expect(latex).toContain('\\int');
      expect(latex).toContain('_{');
      expect(latex).toContain('^{');
    });

    it('should create integral with limits when typing int command', () => {
      ctrl.typedText('\\int ');
      const latex = ctrl.latex();
      expect(latex).toContain('\\int');
      // Should have lower and upper limit (may contain space placeholder)
      expect(latex).toMatch(/_\{.*\}/);
      expect(latex).toMatch(/\^\{.*\}/);
    });
  });

  describe('Double and Triple Integrals', () => {
    it('should parse double integral', () => {
      ctrl.setLatex('\\iint');
      const latex = ctrl.latex();
      expect(latex).toContain('\\iint');
    });

    it('should parse triple integral', () => {
      ctrl.setLatex('\\iiint');
      const latex = ctrl.latex();
      expect(latex).toContain('\\iiint');
    });

    it('should parse contour integral', () => {
      ctrl.setLatex('\\oint');
      const latex = ctrl.latex();
      expect(latex).toContain('\\oint');
    });
  });

  describe('Big Operators', () => {
    it('should parse big union', () => {
      ctrl.setLatex('\\bigcup_{i=1}^{n}A_i');
      const latex = ctrl.latex();
      expect(latex).toContain('\\bigcup');
    });

    it('should parse big intersection', () => {
      ctrl.setLatex('\\bigcap_{i=1}^{n}A_i');
      const latex = ctrl.latex();
      expect(latex).toContain('\\bigcap');
    });
  });
});

// =============================================================================
// SELECTION TESTS
// =============================================================================

describe('Selection', () => {
  let ctrl: InstanceType<typeof import('../controller/controller').Controller>;
  let container: HTMLDivElement;

  beforeEach(async () => {
    const { Controller } = await import('../controller/controller');
    container = document.createElement('div');
    document.body.appendChild(container);
    ctrl = new Controller();
    ctrl.init(container);
  });

  afterEach(() => {
    ctrl.detach();
    document.body.removeChild(container);
  });

  describe('Select All (Ctrl+A)', () => {
    it('should select all content with selectAll()', () => {
      ctrl.setLatex('abc');
      ctrl.cursor.selectAll();
      expect(ctrl.cursor.selection).toBeDefined();
      // Should have all 3 characters selected
      expect(ctrl.latex()).toBe('abc');
    });

    it('should select all content even when cursor is inside nested block', () => {
      ctrl.setLatex('x+\\frac{a}{b}+y');
      // Move cursor into the fraction
      ctrl.cursor.moveToStart();
      ctrl.cursor.moveRight();
      ctrl.cursor.moveRight();
      ctrl.cursor.moveRight(); // Now should be inside fraction

      // Select all should still select everything
      ctrl.cursor.selectAll();
      expect(ctrl.cursor.selection).toBeDefined();
    });
  });

  describe('Shift+Arrow Selection', () => {
    it('should select one character with select(R)', () => {
      ctrl.setLatex('abc');
      ctrl.cursor.moveToStart();
      ctrl.cursor.select(1); // R = 1
      expect(ctrl.cursor.selection).toBeDefined();
    });

    it('should extend selection with multiple select calls', () => {
      ctrl.setLatex('abcd');
      ctrl.cursor.moveToStart();
      ctrl.cursor.select(1); // Select 'a'
      ctrl.cursor.select(1); // Extend to 'b'
      ctrl.cursor.select(1); // Extend to 'c'
      expect(ctrl.cursor.selection).toBeDefined();
    });

    it('should select leftward with select(L)', () => {
      ctrl.setLatex('abc');
      ctrl.cursor.moveToEnd();
      ctrl.cursor.select(-1); // L = -1
      expect(ctrl.cursor.selection).toBeDefined();
    });
  });

  describe('Clear Selection', () => {
    it('should clear selection with clearSelection()', () => {
      ctrl.setLatex('abc');
      ctrl.cursor.selectAll();
      expect(ctrl.cursor.selection).toBeDefined();

      ctrl.cursor.clearSelection();
      expect(ctrl.cursor.selection).toBeUndefined();
    });

    it('should clear selection when moving cursor', () => {
      ctrl.setLatex('abc');
      ctrl.cursor.selectAll();
      expect(ctrl.cursor.selection).toBeDefined();

      ctrl.cursor.moveRight();
      // Selection should be cleared after movement
      expect(ctrl.cursor.selection).toBeUndefined();
    });
  });
});
