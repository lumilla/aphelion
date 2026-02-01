/**
 * Aphelion - React Components
 *
 * React components for embedding Aphelion editors.
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useCallback,
  CSSProperties,
} from 'react';
import { useAphelion, useControlledAphelion } from './hooks';
import { EditorConfig } from '../core/types';
import { Controller } from '../controller/controller';

/** Props shared by all Aphelion components */
export interface AphelionBaseProps {
  /** Additional CSS class names */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Configuration options */
  config?: EditorConfig;
  /** Callback when the editor content changes */
  onChange?: (latex: string) => void;
  /** Callback when the editor is focused */
  onFocus?: () => void;
  /** Callback when the editor is blurred */
  onBlur?: () => void;
  /** Accessible label */
  ariaLabel?: string;
}

/** Props for uncontrolled MathField */
export interface MathFieldProps extends AphelionBaseProps {
  /** Initial LaTeX content */
  defaultValue?: string;
}

/** Props for controlled MathField */
export interface ControlledMathFieldProps extends AphelionBaseProps {
  /** Controlled LaTeX value */
  value: string;
  /** Required onChange for controlled component */
  onChange: (latex: string) => void;
}

/** Props for StaticMath */
export interface StaticMathProps {
  /** LaTeX content to display */
  children: string;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Accessible label */
  ariaLabel?: string;
}

/** Ref type for MathField components */
export interface MathFieldRef {
  /** Get the current LaTeX content */
  latex: () => string;
  /** Set the LaTeX content */
  setLatex: (value: string) => void;
  /** Get plain text representation */
  text: () => string;
  /** Focus the editor */
  focus: () => void;
  /** Blur the editor */
  blur: () => void;
  /** Insert a command */
  insertCommand: (cmd: string) => void;
  /** Get the controller instance */
  getController: () => Controller | null;
}

/**
 * Uncontrolled MathField component.
 *
 * @example
 * ```tsx
 * const ref = useRef<MathFieldRef>(null);
 *
 * <MathField
 *   ref={ref}
 *   defaultValue="x^2 + y^2 = z^2"
 *   onChange={(latex) => console.log(latex)}
 * />
 *
 * // Later: ref.current?.latex()
 * ```
 */
export const MathField = forwardRef<MathFieldRef, MathFieldProps>(
  function MathField(
    {
      defaultValue,
      className,
      style,
      config,
      onChange,
      onFocus,
      onBlur,
      ariaLabel,
    },
    ref
  ) {
    const {
      containerRef,
      controller,
      focus,
      blur,
      getLatex,
      setLatex,
      getText,
      insertCommand,
    } = useAphelion({
      ...config,
      handlers: {
        ...config?.handlers,
        edit: (ctrl) => {
          const c = ctrl as Controller;
          onChange?.(c.latex());
          config?.handlers?.edit?.(ctrl);
        },
        enter: (ctrl) => {
          onFocus?.();
          config?.handlers?.enter?.(ctrl);
        },
      },
    });

    // Set initial value
    useEffect(() => {
      if (defaultValue && controller.current) {
        controller.current.setLatex(defaultValue);
      }
    }, []);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      latex: getLatex,
      setLatex,
      text: getText,
      focus,
      blur,
      insertCommand,
      getController: () => controller.current,
    }));

    // Handle blur callback
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleBlur = () => onBlur?.();
      container.addEventListener('focusout', handleBlur);
      return () => container.removeEventListener('focusout', handleBlur);
    }, [onBlur]);

    return (
      <div
        ref={containerRef}
        className={`mq-math-field ${className ?? ''}`}
        style={style}
        role="textbox"
        aria-label={ariaLabel ?? 'Math input field'}
        aria-multiline="false"
      />
    );
  }
);

/**
 * Controlled MathField component.
 *
 * @example
 * ```tsx
 * const [latex, setLatex] = useState('x^2');
 *
 * <ControlledMathField
 *   value={latex}
 *   onChange={setLatex}
 * />
 * ```
 */
export const ControlledMathField = forwardRef<
  MathFieldRef,
  ControlledMathFieldProps
>(function ControlledMathField(
  { value, className, style, config, onChange, onFocus, onBlur, ariaLabel },
  ref
) {
  const {
    containerRef,
    controller,
    focus,
    blur,
    getLatex,
    setLatex,
    getText,
    insertCommand,
  } = useControlledAphelion(value, onChange, {
    ...config,
    handlers: {
      ...config?.handlers,
      enter: (ctrl) => {
        onFocus?.();
        config?.handlers?.enter?.(ctrl);
      },
    },
  });

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    latex: getLatex,
    setLatex,
    text: getText,
    focus,
    blur,
    insertCommand,
    getController: () => controller.current,
  }));

  // Handle blur callback
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleBlur = () => onBlur?.();
    container.addEventListener('focusout', handleBlur);
    return () => container.removeEventListener('focusout', handleBlur);
  }, [onBlur]);

  return (
    <div
      ref={containerRef}
      className={`mq-math-field ${className ?? ''}`}
      style={style}
      role="textbox"
      aria-label={ariaLabel ?? 'Math input field'}
      aria-multiline="false"
    />
  );
});

/**
 * Static math display (read-only).
 *
 * @example
 * ```tsx
 * <StaticMath>{"\\frac{1}{2}"}</StaticMath>
 * ```
 */
export function StaticMath({
  children,
  className,
  style,
  ariaLabel,
}: StaticMathProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const controller = new Controller({ editable: false });
    controller.init(containerRef.current);
    controller.setLatex(children);

    // Remove textarea and make non-editable
    const textarea = containerRef.current.querySelector('.aphelion-textarea');
    textarea?.remove();

    return () => {
      controller.detach();
    };
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={`mq-static-math ${className ?? ''}`}
      style={style}
      role="img"
      aria-label={ariaLabel ?? `Math: ${children}`}
    />
  );
}

/**
 * Math button toolbar component.
 */
export interface MathToolbarProps {
  /** Reference to a MathField */
  mathFieldRef: React.RefObject<MathFieldRef>;
  /** Additional CSS class names */
  className?: string;
  /** Which buttons to show */
  buttons?: Array<
    | 'fraction'
    | 'sqrt'
    | 'superscript'
    | 'subscript'
    | 'parens'
    | 'brackets'
    | 'braces'
  >;
}

/**
 * Toolbar with buttons for inserting math commands.
 */
export function MathToolbar({
  mathFieldRef,
  className,
  buttons = [
    'fraction',
    'sqrt',
    'superscript',
    'subscript',
    'parens',
    'brackets',
  ],
}: MathToolbarProps) {
  const handleClick = useCallback(
    (cmd: string) => {
      mathFieldRef.current?.insertCommand(cmd);
      mathFieldRef.current?.focus();
    },
    [mathFieldRef]
  );

  const buttonConfig: Record<string, { label: string; symbol: string }> = {
    fraction: { label: 'Fraction', symbol: '⁄' },
    sqrt: { label: 'Square root', symbol: '√' },
    superscript: { label: 'Superscript', symbol: 'xⁿ' },
    subscript: { label: 'Subscript', symbol: 'x₂' },
    parens: { label: 'Parentheses', symbol: '( )' },
    brackets: { label: 'Brackets', symbol: '[ ]' },
    braces: { label: 'Braces', symbol: '{ }' },
  };

  return (
    <div className={`aphelion-toolbar ${className ?? ''}`} role="toolbar">
      {buttons.map((btn) => (
        <button
          key={btn}
          type="button"
          className="aphelion-toolbar-button"
          onClick={() => handleClick(btn)}
          aria-label={buttonConfig[btn]?.label}
          title={buttonConfig[btn]?.label}
        >
          {buttonConfig[btn]?.symbol}
        </button>
      ))}
    </div>
  );
}
