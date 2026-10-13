import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiBusyError,
  AiProvider,
  ChatTurn,
  GenerateInput,
  GenerateOutput,
  ToolCall,
} from './ai-provider';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
// An alias that follows Google's current lite model, so a retired version
// number cannot break the chat. Lite models also have the biggest free quota.
const DEFAULT_MODEL = 'gemini-flash-lite-latest';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_OUTPUT_TOKENS = 500;

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toContent = (turn: ChatTurn): Json => {
  switch (turn.role) {
    case 'user':
      return { role: 'user', parts: [{ text: turn.text }] };
    case 'assistant':
      return { role: 'model', parts: [{ text: turn.text }] };
    case 'assistant-tools':
      return {
        role: 'model',
        parts: Array.isArray(turn.raw)
          ? turn.raw
          : turn.calls.map((c) => ({
              functionCall: { name: c.name, args: c.args },
            })),
      };
    case 'tool':
      return {
        role: 'user',
        parts: turn.results.map((r) => ({
          functionResponse: { name: r.name, response: { result: r.result } },
        })),
      };
  }
};

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly config: ConfigService) {}

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not set');
      throw new Error('Chat is not configured');
    }
    const model = this.config.get<string>('GEMINI_MODEL') || DEFAULT_MODEL;

    const body: Json = {
      systemInstruction: { parts: [{ text: input.system }] },
      contents: input.turns.map(toContent),
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.4,
      },
    };
    if (input.tools.length) {
      body.tools = [{ functionDeclarations: input.tools }];
    }

    let res: Response;
    try {
      res = await fetch(
        `${ENDPOINT}/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            // Header, not query string, so the key never lands in access logs.
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
    } catch (e) {
      this.logger.warn(`Gemini request failed: ${String(e)}`);
      throw new AiBusyError('Gemini unreachable');
    }

    if (res.status === 429 || res.status === 503) {
      throw new AiBusyError(`Gemini busy (${res.status})`);
    }
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      this.logger.error(`Gemini error ${res.status}: ${detail}`);
      throw new Error(`Gemini error ${res.status}`);
    }

    return this.parse(await res.json());
  }

  private parse(payload: unknown): GenerateOutput {
    const candidates = isRecord(payload) ? payload.candidates : undefined;
    const first = Array.isArray(candidates) ? candidates[0] : undefined;
    const content = isRecord(first) ? first.content : undefined;
    const parts =
      isRecord(content) && Array.isArray(content.parts) ? content.parts : [];

    const calls: ToolCall[] = [];
    let text = '';
    for (const part of parts) {
      if (!isRecord(part)) continue;
      const fn = part.functionCall;
      if (isRecord(fn) && typeof fn.name === 'string') {
        calls.push({ name: fn.name, args: isRecord(fn.args) ? fn.args : {} });
      } else if (typeof part.text === 'string' && part.thought !== true) {
        text += part.text;
      }
    }

    if (calls.length) return { kind: 'tools', calls, raw: parts };
    return { kind: 'text', text: text.trim() };
  }
}
