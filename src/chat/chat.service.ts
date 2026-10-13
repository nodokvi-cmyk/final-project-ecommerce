import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from '../products/products.service';
import {
  AI_PROVIDER,
  AiBusyError,
  type AiProvider,
  type ChatTurn,
  type ToolCall,
  type ToolDeclaration,
  type ToolResult,
} from './providers/ai-provider';
import { ChatMessageDto } from './dto/chat.dto';

export interface ChatProductCard {
  _id: string;
  productName: string;
  price: number;
  category: string;
  stock: number;
  photo: string | null;
}

export interface ChatReply {
  reply: string;
  products: ChatProductCard[];
}

// Quota friendliness: every limit below exists to keep a free-tier key alive.
const MAX_HISTORY = 8; // messages sent to the model
const MAX_TOOL_ROUNDS = 3; // model calls that may ask for tools per message
const MAX_RESULTS = 6; // products per search
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const DEFAULT_DAILY_LIMIT = 300; // provider calls per UTC day

const FALLBACK_REPLY =
  'I could not come up with a good answer. Could you tell me a bit more about what you are looking for?';

const SYSTEM_PROMPT = `You are the shopping assistant of SHOPLY, an online store.
Your only job is to help visitors find products in the store catalog.

Rules:
- Recommend only products returned by your tools. Never invent products, prices or stock.
- Use search_products with a single short keyword in "query" (for example "headphones", not a sentence). Use list_categories when you need to know what the store sells.
- If the request is vague, ask one short clarifying question (budget, use, preference) before searching. Do not ask more than two questions in a row.
- If nothing matches, say so and suggest the closest alternative from the tools.
- Prices are in US dollars. Mention stock only when it is low.
- Do not discuss orders, payments, accounts or anything unrelated to shopping. Politely steer back to finding a product.
- Reply in the visitor's language. Keep replies under 80 words, friendly and plain, no markdown.
- When you recommend products, end your reply with a final line exactly like "IDS: id1,id2" listing the ids of the recommended products (at most 4, only ids returned by tools). Never mention this line.`;

const TOOLS: ToolDeclaration[] = [
  {
    name: 'search_products',
    description:
      'Search the store catalog. All fields are optional filters. Returns up to 6 matching products, newest first unless sorted.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'One short keyword matched against the product name.',
        },
        category: {
          type: 'string',
          description: 'Exact category name from list_categories.',
        },
        minPrice: { type: 'number', description: 'Minimum price in dollars.' },
        maxPrice: { type: 'number', description: 'Maximum price in dollars.' },
        inStockOnly: {
          type: 'boolean',
          description: 'Only return products that are in stock.',
        },
        sort: {
          type: 'string',
          enum: ['price', '-price', '-date'],
          description: 'price = cheapest first, -price = priciest first.',
        },
      },
    },
  },
  {
    name: 'list_categories',
    description: 'List every category the store sells.',
    parameters: { type: 'object', properties: {} },
  },
];

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : undefined;

interface CacheEntry {
  expires: number;
  value: ChatReply;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private budget = { day: '', used: 0 };

  constructor(
    private readonly products: ProductsService,
    private readonly config: ConfigService,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
  ) {}

  async reply(messages: ChatMessageDto[]): Promise<ChatReply> {
    const history = messages.slice(-MAX_HISTORY).map((m) => ({
      role: m.role,
      text: m.content.trim(),
    }));
    // The model must answer a visitor message, not its own last turn.
    while (history.length && history[0].role !== 'user') history.shift();
    if (!history.length || history[history.length - 1].role !== 'user') {
      return { reply: FALLBACK_REPLY, products: [] };
    }

    const key = history
      .map((m) => `${m.role}:${m.text.toLowerCase().replace(/\s+/g, ' ')}`)
      .join('\n');
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;

    const result = await this.run(history);
    this.remember(key, result);
    return result;
  }

  private async run(
    history: { role: 'user' | 'assistant'; text: string }[],
  ): Promise<ChatReply> {
    const turns: ChatTurn[] = history.map((m) => ({
      role: m.role,
      text: m.text,
    }));
    const seen = new Map<string, ChatProductCard>();

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      this.spendBudget();
      // On the last round tools are withheld so the model has to answer.
      const tools = round < MAX_TOOL_ROUNDS ? TOOLS : [];
      const out = await this.provider.generate({
        system: SYSTEM_PROMPT,
        turns,
        tools,
      });

      if (out.kind === 'text') return this.finish(out.text, seen);

      turns.push({ role: 'assistant-tools', calls: out.calls, raw: out.raw });
      const results: ToolResult[] = [];
      for (const call of out.calls) {
        results.push({
          name: call.name,
          result: await this.runTool(call, seen),
        });
      }
      turns.push({ role: 'tool', results });
    }

    return { reply: FALLBACK_REPLY, products: [] };
  }

  private async runTool(
    call: ToolCall,
    seen: Map<string, ChatProductCard>,
  ): Promise<unknown> {
    if (call.name === 'list_categories') {
      return await this.products.findCategories();
    }
    if (call.name !== 'search_products') {
      return { error: `Unknown tool ${call.name}` };
    }

    const sort = asString(call.args.sort);
    const found = await this.products.findAll({
      page: 1,
      take: MAX_RESULTS,
      name: asString(call.args.query),
      category: asString(call.args.category),
      priceFrom: asNumber(call.args.minPrice),
      priceTo: asNumber(call.args.maxPrice),
      isInStock: call.args.inStockOnly === true ? true : undefined,
      sort: sort === 'price' || sort === '-price' ? sort : undefined,
    });

    return found.map((p) => {
      const id = String(p._id);
      seen.set(id, {
        _id: id,
        productName: p.productName,
        price: p.price,
        category: p.category,
        stock: p.stock,
        photo: p.photos?.[0] ?? null,
      });
      return {
        id,
        name: p.productName,
        price: p.price,
        category: p.category,
        stock: p.stock,
        description: p.description.slice(0, 140),
      };
    });
  }

  // Splits the model's trailing "IDS:" line off and keeps only products that
  // a tool really returned, so a made-up id can never become a card.
  private finish(text: string, seen: Map<string, ChatProductCard>): ChatReply {
    const match = /\n?\s*IDS:\s*([\w,\s-]*)$/i.exec(text);
    const body = (match ? text.slice(0, match.index) : text).trim();
    const ids = match
      ? match[1]
          .split(',')
          .map((id) => id.trim())
          .filter((id) => seen.has(id))
      : [];
    const unique = [...new Set(ids)].slice(0, 4);
    const cards = unique.flatMap((id) => {
      const card = seen.get(id);
      return card ? [card] : [];
    });
    return { reply: body || FALLBACK_REPLY, products: cards };
  }

  private spendBudget(): void {
    const limit =
      Number(this.config.get<string>('CHAT_DAILY_LIMIT')) ||
      DEFAULT_DAILY_LIMIT;
    const day = new Date().toISOString().slice(0, 10);
    if (this.budget.day !== day) this.budget = { day, used: 0 };
    if (this.budget.used >= limit) {
      this.logger.warn(`Daily chat budget of ${limit} calls reached`);
      throw new AiBusyError('Daily chat budget reached');
    }
    this.budget.used++;
  }

  private remember(key: string, value: ChatReply): void {
    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      const oldest = this.cache.keys().next();
      if (!oldest.done) this.cache.delete(oldest.value);
    }
    this.cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
  }
}
