/**
 * Aphelion - Main Entry Point
 *
 * A beautiful, interactive math editor for the modern web.
 */

// Core exports
export * from './core/types';
export * from './core/node';
export * from './core/blocks';
export * from './core/cursor';

// Command exports
export * from './commands/symbol';
export * from './commands/fraction';
export * from './commands/sqrt';
export * from './commands/supsub';
export * from './commands/brackets';
export * from './commands/text';
export * from './commands/largeops';

// Parser exports
export * from './parser/combinators';
export * from './parser/ast';
export * from './parser/latex';

// Controller export
export * from './controller/controller';

// React components
export * from './components/hooks';
export * from './components/MathField';

// Public API
export { Aphelion, getInterface } from './api';
export type {
  AphelionAPI,
  AphelionConfig,
  MathFieldInstance,
  StaticMathInstance,
} from './api';

// Default export
import { Aphelion } from './api';
export default Aphelion;
