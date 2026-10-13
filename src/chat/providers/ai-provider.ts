// The chat module talks to a model only through this interface, so the
// provider (Gemini today) can be swapped without touching the chat logic.

export interface ToolDeclaration {
  name: string;
  description: string;
  // JSON-schema style object, in the subset the providers accept.
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  name: string;
  result: unknown;
}

export type ChatTurn =
  | { role: 'user' | 'assistant'; text: string }
  // `raw` is the provider's own representation of the turn, handed back
  // unchanged on the next call (some models require it to keep reasoning
  // state across tool calls).
  | { role: 'assistant-tools'; calls: ToolCall[]; raw?: unknown }
  | { role: 'tool'; results: ToolResult[] };

export interface GenerateInput {
  system: string;
  turns: ChatTurn[];
  tools: ToolDeclaration[];
}

export type GenerateOutput =
  | { kind: 'text'; text: string }
  | { kind: 'tools'; calls: ToolCall[]; raw?: unknown };

export interface AiProvider {
  generate(input: GenerateInput): Promise<GenerateOutput>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');

// The provider is out of quota or temporarily overloaded. Shown to the
// visitor as a friendly "try again later" and never as a server error.
export class AiBusyError extends Error {}
