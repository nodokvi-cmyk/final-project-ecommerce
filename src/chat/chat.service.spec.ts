import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from '../products/products.service';
import { ChatService } from './chat.service';
import {
  AI_PROVIDER,
  AiBusyError,
  type GenerateInput,
  type GenerateOutput,
} from './providers/ai-provider';

const headphones = {
  _id: 'p1',
  productName: 'Aurora Wireless Headphones',
  description: 'Over-ear Bluetooth headphones with noise cancelling.',
  price: 129.9,
  stock: 40,
  category: 'Electronics',
  photos: ['https://cdn.example/p1.jpg'],
};

interface Setup {
  service: ChatService;
  generate: jest.Mock<Promise<GenerateOutput>, [GenerateInput]>;
  findAll: jest.Mock;
}

async function setup(
  script: GenerateOutput[],
  env: Record<string, string> = {},
): Promise<Setup> {
  const generate = jest.fn<Promise<GenerateOutput>, [GenerateInput]>();
  script.forEach((out) => generate.mockResolvedValueOnce(out));
  const findAll = jest.fn().mockResolvedValue([headphones]);

  const moduleRef = await Test.createTestingModule({
    providers: [
      ChatService,
      { provide: AI_PROVIDER, useValue: { generate } },
      {
        provide: ProductsService,
        useValue: { findAll, findCategories: jest.fn().mockResolvedValue([]) },
      },
      { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
    ],
  }).compile();

  return { service: moduleRef.get(ChatService), generate, findAll };
}

const search: GenerateOutput = {
  kind: 'tools',
  calls: [{ name: 'search_products', args: { query: 'headphones' } }],
};

describe('ChatService', () => {
  it('turns recommended ids returned by a tool into product cards', async () => {
    const { service, findAll } = await setup([
      search,
      { kind: 'text', text: 'Try these headphones.\nIDS: p1' },
    ]);

    const result = await service.reply([
      { role: 'user', content: 'I need headphones' },
    ]);

    expect(findAll).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'headphones', take: 6 }),
    );
    expect(result.reply).toBe('Try these headphones.');
    expect(result.products).toEqual([
      {
        _id: 'p1',
        productName: 'Aurora Wireless Headphones',
        price: 129.9,
        category: 'Electronics',
        stock: 40,
        photo: 'https://cdn.example/p1.jpg',
      },
    ]);
  });

  it('drops ids the model made up', async () => {
    const { service } = await setup([
      search,
      { kind: 'text', text: 'Here you go.\nIDS: p1, invented-id' },
    ]);

    const result = await service.reply([
      { role: 'user', content: 'headphones please' },
    ]);

    expect(result.products.map((p) => p._id)).toEqual(['p1']);
  });

  it('serves a repeated conversation from cache without a model call', async () => {
    const { service, generate } = await setup([
      { kind: 'text', text: 'What is your budget?' },
    ]);
    const messages = [{ role: 'user' as const, content: 'Need a gift' }];

    const first = await service.reply(messages);
    const second = await service.reply([
      { role: 'user', content: '  need   a GIFT ' },
    ]);

    expect(second).toEqual(first);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('stops calling the model once the daily budget is spent', async () => {
    const { service, generate } = await setup(
      [
        { kind: 'text', text: 'First answer.' },
        { kind: 'text', text: 'Second answer.' },
      ],
      { CHAT_DAILY_LIMIT: '1' },
    );

    await service.reply([{ role: 'user', content: 'first question' }]);
    await expect(
      service.reply([{ role: 'user', content: 'second question' }]),
    ).rejects.toBeInstanceOf(AiBusyError);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('does not call the model when the last message is not from the visitor', async () => {
    const { service, generate } = await setup([]);

    const result = await service.reply([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'Hello! What are you after?' },
    ]);

    expect(result.products).toEqual([]);
    expect(generate).not.toHaveBeenCalled();
  });

  it('withholds tools on the final round so the model must answer', async () => {
    const { service, generate } = await setup([
      search,
      search,
      search,
      { kind: 'text', text: 'Best I could find.' },
    ]);

    const result = await service.reply([
      { role: 'user', content: 'something unusual' },
    ]);

    expect(result.reply).toBe('Best I could find.');
    expect(generate).toHaveBeenCalledTimes(4);
    expect(generate.mock.calls[3][0].tools).toEqual([]);
  });
});
