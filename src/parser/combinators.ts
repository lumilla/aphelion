/**
 * Aphelion - LaTeX Parser
 *
 * A parser combinator library for parsing LaTeX math expressions.
 * Inspired by parser combinators but modernized.
 */

/**
 * Result of a parse attempt.
 */
export type ParseResult<T> =
  | { success: true; value: T; remaining: string }
  | { success: false; expected: string; position: number };

/**
 * A parser is a function that takes a string and returns a result.
 */
export type Parser<T> = (input: string, position?: number) => ParseResult<T>;

/**
 * Create a parser that always succeeds with the given value.
 */
export function succeed<T>(value: T): Parser<T> {
  return (input, position = 0) => ({
    success: true,
    value,
    remaining: input,
  });
}

/**
 * Create a parser that always fails with the given message.
 */
export function fail<T>(expected: string): Parser<T> {
  return (input, position = 0) => ({
    success: false,
    expected,
    position,
  });
}

/**
 * Parse a specific string.
 */
export function string(str: string): Parser<string> {
  return (input, position = 0) => {
    if (input.startsWith(str)) {
      return {
        success: true,
        value: str,
        remaining: input.slice(str.length),
      };
    }
    return {
      success: false,
      expected: `'${str}'`,
      position,
    };
  };
}

/**
 * Parse a single character matching a predicate.
 */
export function satisfy(
  predicate: (char: string) => boolean,
  description: string,
): Parser<string> {
  return (input, position = 0) => {
    if (input.length > 0 && predicate(input[0]!)) {
      return {
        success: true,
        value: input[0]!,
        remaining: input.slice(1),
      };
    }
    return {
      success: false,
      expected: description,
      position,
    };
  };
}

/**
 * Parse a character matching a regex.
 */
export function regex(pattern: RegExp, description?: string): Parser<string> {
  return (input, position = 0) => {
    const match = input.match(pattern);
    if (match && match.index === 0) {
      return {
        success: true,
        value: match[0],
        remaining: input.slice(match[0].length),
      };
    }
    return {
      success: false,
      expected: description || pattern.toString(),
      position,
    };
  };
}

/**
 * Parse any single character.
 */
export const anyChar: Parser<string> = satisfy(() => true, "any character");

/**
 * Parse a digit.
 */
export const digit: Parser<string> = satisfy(
  (c) => c >= "0" && c <= "9",
  "digit",
);

/**
 * Parse a letter.
 */
export const letter: Parser<string> = satisfy(
  (c) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z"),
  "letter",
);

/**
 * Parse whitespace (one or more).
 */
export const whitespace: Parser<string> = regex(/\s+/, "whitespace");

/**
 * Parse optional whitespace.
 */
export const optionalWhitespace: Parser<string> = regex(/\s*/, "whitespace");

/**
 * Map the result of a parser.
 */
export function map<T, U>(parser: Parser<T>, fn: (value: T) => U): Parser<U> {
  return (input, position = 0) => {
    const result = parser(input, position);
    if (result.success) {
      return {
        success: true,
        value: fn(result.value),
        remaining: result.remaining,
      };
    }
    return result;
  };
}

/**
 * Sequence two parsers, keeping both results.
 */
export function seq<T, U>(p1: Parser<T>, p2: Parser<U>): Parser<[T, U]> {
  return (input, position = 0) => {
    const r1 = p1(input, position);
    if (!r1.success) return r1;

    const r2 = p2(
      r1.remaining,
      position + (input.length - r1.remaining.length),
    );
    if (!r2.success) return r2;

    return {
      success: true,
      value: [r1.value, r2.value],
      remaining: r2.remaining,
    };
  };
}

/**
 * Sequence parsers, keeping only the first result.
 */
export function seqLeft<T, U>(p1: Parser<T>, p2: Parser<U>): Parser<T> {
  return map(seq(p1, p2), ([a]) => a);
}

/**
 * Sequence parsers, keeping only the second result.
 */
export function seqRight<T, U>(p1: Parser<T>, p2: Parser<U>): Parser<U> {
  return map(seq(p1, p2), ([, b]) => b);
}

/**
 * Try the first parser, then the second if it fails.
 */
export function or<T>(p1: Parser<T>, p2: Parser<T>): Parser<T> {
  return (input, position = 0) => {
    const r1 = p1(input, position);
    if (r1.success) return r1;
    return p2(input, position);
  };
}

/**
 * Try multiple parsers in order.
 */
export function choice<T>(...parsers: Parser<T>[]): Parser<T> {
  return (input, position = 0) => {
    for (const parser of parsers) {
      const result = parser(input, position);
      if (result.success) return result;
    }
    return {
      success: false,
      expected: "one of multiple options",
      position,
    };
  };
}

/**
 * Parse zero or more occurrences.
 */
export function many<T>(parser: Parser<T>): Parser<T[]> {
  return (input, position = 0) => {
    const results: T[] = [];
    let remaining = input;
    let currentPosition = position;

    while (true) {
      const result = parser(remaining, currentPosition);
      if (!result.success) break;
      results.push(result.value);
      currentPosition += remaining.length - result.remaining.length;
      remaining = result.remaining;
    }

    return {
      success: true,
      value: results,
      remaining,
    };
  };
}

/**
 * Parse one or more occurrences.
 */
export function many1<T>(parser: Parser<T>): Parser<T[]> {
  return (input, position = 0) => {
    const result = many(parser)(input, position);
    if (result.success && result.value.length === 0) {
      return {
        success: false,
        expected: "at least one",
        position,
      };
    }
    return result;
  };
}

/**
 * Make a parser optional.
 */
export function optional<T>(parser: Parser<T>): Parser<T | undefined> {
  return (input, position = 0) => {
    const result = parser(input, position);
    if (result.success) return result;
    return {
      success: true,
      value: undefined,
      remaining: input,
    };
  };
}

/**
 * Parse content between two delimiters.
 */
export function between<T, L, R>(
  left: Parser<L>,
  content: Parser<T>,
  right: Parser<R>,
): Parser<T> {
  return seqRight(left, seqLeft(content, right));
}

/**
 * Parse content separated by a separator.
 */
export function sepBy<T, S>(
  parser: Parser<T>,
  separator: Parser<S>,
): Parser<T[]> {
  return (input, position = 0) => {
    const results: T[] = [];
    let remaining = input;
    let currentPosition = position;

    // Try to parse first item
    const first = parser(remaining, currentPosition);
    if (!first.success) {
      return { success: true, value: [], remaining };
    }

    results.push(first.value);
    currentPosition += remaining.length - first.remaining.length;
    remaining = first.remaining;

    // Parse separator + item pairs
    while (true) {
      const sep = separator(remaining, currentPosition);
      if (!sep.success) break;

      const nextPos =
        currentPosition + (remaining.length - sep.remaining.length);
      const item = parser(sep.remaining, nextPos);
      if (!item.success) break;

      results.push(item.value);
      currentPosition =
        nextPos + (sep.remaining.length - item.remaining.length);
      remaining = item.remaining;
    }

    return { success: true, value: results, remaining };
  };
}

/**
 * Lazy parser for recursive definitions.
 */
export function lazy<T>(getParser: () => Parser<T>): Parser<T> {
  return (input, position = 0) => getParser()(input, position);
}

/**
 * Parse a LaTeX command (backslash followed by letters).
 */
export const latexCommand: Parser<string> = (input, position = 0) => {
  if (!input.startsWith("\\")) {
    return { success: false, expected: "LaTeX command", position };
  }

  // Check for single-character commands like \{ \} \\ etc.
  if (input.length > 1 && !/[a-zA-Z]/.test(input[1]!)) {
    return {
      success: true,
      value: input.slice(0, 2),
      remaining: input.slice(2),
    };
  }

  // Parse command name (letters only)
  const match = input.match(/^\\([a-zA-Z]+)/);
  if (!match) {
    return { success: false, expected: "LaTeX command name", position };
  }

  return {
    success: true,
    value: match[0],
    remaining: input.slice(match[0].length),
  };
};

/**
 * Parse a braced group {content}.
 */
export function bracedGroup<T>(contentParser: Parser<T>): Parser<T> {
  return between(string("{"), contentParser, string("}"));
}

/**
 * Parse a bracketed group [content].
 */
export function bracketGroup<T>(contentParser: Parser<T>): Parser<T> {
  return between(string("["), contentParser, string("]"));
}

/**
 * Run a parser and return the result or throw.
 */
export function parse<T>(parser: Parser<T>, input: string): T {
  const result = parser(input);
  if (result.success) {
    return result.value;
  }
  throw new Error(
    `Parse error at position ${result.position}: expected ${result.expected}`,
  );
}

/**
 * Run a parser and return the result or undefined.
 */
export function tryParse<T>(parser: Parser<T>, input: string): T | undefined {
  const result = parser(input);
  if (result.success) {
    return result.value;
  }
  return undefined;
}
