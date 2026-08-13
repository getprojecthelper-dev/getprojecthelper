/**
 * Tiny, dependency-free syntax highlighter.
 *
 * It is intentionally simple: one pass over the source with a single combined
 * regular expression, producing plain tokens the UI renders as coloured spans.
 * Good enough for the beginner-friendly snippets the AI produces, and it costs
 * nothing at runtime compared to shipping a full highlighter.
 */

export type TokenKind =
  | "keyword"
  | "string"
  | "number"
  | "comment"
  | "function"
  | "builtin"
  | "punct"
  | "plain";

export interface Token {
  text: string;
  kind: TokenKind;
}

const KEYWORDS = new Set([
  // shared / js / ts
  "const", "let", "var", "function", "return", "if", "else", "for", "while", "do",
  "switch", "case", "break", "continue", "new", "class", "extends", "super", "this",
  "import", "from", "export", "default", "async", "await", "try", "catch", "finally",
  "throw", "typeof", "instanceof", "interface", "type", "enum", "implements", "public",
  "private", "protected", "readonly", "static", "yield", "of", "in", "delete", "void",
  // python
  "def", "elif", "lambda", "pass", "raise", "with", "as", "global", "nonlocal",
  "assert", "del", "not", "and", "or", "is", "None", "True", "False", "self",
  // sql-ish / shell-ish
  "select", "insert", "update", "delete", "where", "echo", "cd", "mkdir", "pip",
  "npm", "python", "node", "run", "install",
]);

const BUILTINS = new Set([
  "print", "len", "range", "int", "str", "float", "bool", "list", "dict", "set",
  "tuple", "open", "sum", "min", "max", "sorted", "enumerate", "zip", "map", "filter",
  "console", "document", "window", "Math", "JSON", "Object", "Array", "String",
  "Number", "Boolean", "Promise", "Error", "React", "np", "pd", "plt",
]);

const PATTERN = new RegExp(
  [
    "(#[^\\n]*|//[^\\n]*|/\\*[\\s\\S]*?\\*/)", // comments
    "(\"\"\"[\\s\\S]*?\"\"\"|'''[\\s\\S]*?'''|`(?:\\\\.|[^`\\\\])*`|\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*')", // strings
    "(\\b\\d[\\d_]*(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b)", // numbers
    "([A-Za-z_$][\\w$]*)(?=\\s*\\()", // call sites
    "([A-Za-z_$][\\w$]*)", // words
    "([{}()\\[\\].,;:+\\-*/%=<>!&|?@]+)", // punctuation
  ].join("|"),
  "g",
);

export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;

  for (const match of code.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ text: code.slice(last, index), kind: "plain" });
    last = index + match[0].length;

    const [, comment, string, number, call, word, punct] = match;
    if (comment) tokens.push({ text: comment, kind: "comment" });
    else if (string) tokens.push({ text: string, kind: "string" });
    else if (number) tokens.push({ text: number, kind: "number" });
    else if (call)
      tokens.push({ text: call, kind: BUILTINS.has(call) ? "builtin" : "function" });
    else if (word)
      tokens.push({
        text: word,
        kind: KEYWORDS.has(word) ? "keyword" : BUILTINS.has(word) ? "builtin" : "plain",
      });
    else if (punct) tokens.push({ text: punct, kind: "punct" });
  }

  if (last < code.length) tokens.push({ text: code.slice(last), kind: "plain" });
  return tokens;
}

/** Splits a line into coloured tokens. Plain-text languages stay uncoloured. */
export function highlightLine(line: string, plainText: boolean): Token[] {
  if (plainText || !line.trim()) return [{ text: line, kind: "plain" }];
  return tokenize(line);
}

const PLAIN_LANGUAGES = new Set(["text", "txt", "markdown", "md", "structure", "plain", ""]);

export function isPlainLanguage(language?: string, filename?: string) {
  const value = (language ?? "").toLowerCase();
  if (PLAIN_LANGUAGES.has(value)) return true;
  if (!language && filename && /structure|tree/i.test(filename)) return true;
  return false;
}
