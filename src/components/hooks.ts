/**
 * Aphelion - React Hooks
 *
 * Custom hooks for using Aphelion in React applications.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Controller } from '../controller/controller';
import { EditorConfig } from '../core/types';

/**
 * Hook for creating and managing an Aphelion controller.
 */
export function useAphelion(config: EditorConfig = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  const [latex, setLatex] = useState('');
  const [focused, setFocused] = useState(false);

  // Initialize controller
  useEffect(() => {
    if (!containerRef.current) return;

    const controller = new Controller({
      ...config,
      handlers: {
        ...config.handlers,
        edit: (ctrl) => {
          const c = ctrl as Controller;
          setLatex(c.latex());
          config.handlers?.edit?.(ctrl);
        },
        enter: (ctrl) => {
          setFocused(true);
          config.handlers?.enter?.(ctrl);
        },
      },
    });

    controller.init(containerRef.current);
    controllerRef.current = controller;

    // Set initial latex if provided
    if (config.handlers?.edit) {
      setLatex(controller.latex());
    }

    return () => {
      controller.detach();
      controllerRef.current = null;
    };
  }, []);

  // Focus/blur handlers
  const focus = useCallback(() => {
    controllerRef.current?.focus();
  }, []);

  const blur = useCallback(() => {
    controllerRef.current?.blur();
  }, []);

  // LaTeX getter/setter
  const getLatex = useCallback(() => {
    return controllerRef.current?.latex() ?? '';
  }, []);

  const setLatexValue = useCallback((value: string) => {
    controllerRef.current?.setLatex(value);
    setLatex(value);
  }, []);

  // Text getter
  const getText = useCallback(() => {
    return controllerRef.current?.text() ?? '';
  }, []);

  // Command insertion
  const insertCommand = useCallback((cmd: string) => {
    const controller = controllerRef.current;
    if (!controller) return;

    switch (cmd) {
      case 'fraction':
      case 'frac':
        controller.insertFraction();
        break;
      case 'sqrt':
        controller.insertSquareRoot();
        break;
      case 'superscript':
      case 'sup':
        controller.insertSuperscript();
        break;
      case 'subscript':
      case 'sub':
        controller.insertSubscript();
        break;
      case 'parens':
      case 'parentheses':
        controller.insertParentheses();
        break;
      case 'brackets':
        controller.insertSquareBrackets();
        break;
      case 'braces':
        controller.insertCurlyBraces();
        break;
    }
  }, []);

  return {
    containerRef,
    controller: controllerRef,
    latex,
    focused,
    focus,
    blur,
    getLatex,
    setLatex: setLatexValue,
    getText,
    insertCommand,
  };
}

/**
 * Hook for a controlled Aphelion component.
 */
export function useControlledAphelion(
  value: string,
  onChange: (latex: string) => void,
  config: EditorConfig = {}
) {
  const { containerRef, controller, setLatex, ...rest } = useAphelion({
    ...config,
    handlers: {
      ...config.handlers,
      edit: () => {
        const latex = controller.current?.latex() ?? '';
        onChange(latex);
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (controller.current && controller.current.latex() !== value) {
      setLatex(value);
    }
  }, [value, setLatex]);

  return {
    containerRef,
    controller,
    setLatex,
    ...rest,
  };
}
