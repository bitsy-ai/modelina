export const RESERVED_RUST_KEYWORDS = [
  // strict keywords can only be used in correct context, and are therefore invalid as:
  // Items, variables and function parameters, fields and vairants, type parameters, lifetime parameters, loop labels, macros or attributes, macro placeholders
  // https://doc.rust-lang.org/reference/keywords.html#strict-keywords
  'as',
  'async',
  'await',
  'break',
  'const',
  'continue',
  'crate',
  'dyn',
  'else',
  'enum',
  'extern',
  'false',
  'fn',
  'for',
  'if',
  'impl',
  'in',
  'let',
  'loop',
  'match',
  'mod',
  'move',
  'mut',
  'pub',
  'ref',
  'return',
  'self',
  'Self',
  'static',
  'struct',
  'super',
  'trait',
  'true',
  'try',
  'type',
  'unsafe',
  'use',
  'where',
  'while',
  // weak keywrods
  // these keywords have special meaning only in certain contexts, but are included as reserved keywords here for simplicity
  'union',
  '\'static',
  'macro_rules',
  // keywords reserved for future use
  // https://doc.rust-lang.org/reference/keywords.html#reserved-keywords
  'abstract',
  'become',
  'box',
  'do',
  'final',
  'macro',
  'override',
  'priv',
  'typeof',
  'unsized',
  'yield'
];

export function isReservedRustKeyword(word: string): boolean {
  return RESERVED_RUST_KEYWORDS.includes(word);
}

export function UNSTABLE_POLYMORPHIC_IMPLEMENTATION_WARNING(fieldName: string): string { return `Polymorphic and union types are not fully implemented in Rust generator. ${fieldName} output will be unstable!`; }
export function UNSTABLE_FIELD_IMPLEMENTATION_WARNING(fieldName: string): string { return `Unsure how to handle ${fieldName}, so you must implement serialization (e.g From<serde_json::Value<T>>) - please open an issue with your schema and example data.`; }
