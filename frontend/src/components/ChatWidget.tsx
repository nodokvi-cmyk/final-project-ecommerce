import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { sendChat, type ChatMessage, type ChatProduct } from '../services/chat';
import Icon from './Icon';

interface Entry extends ChatMessage {
  products?: ChatProduct[];
}

const MAX_LENGTH = 500;
const GREETING: Entry = {
  role: 'assistant',
  content:
    'Hi! Tell me what you are looking for and I will help you find the right product.',
};
const SUGGESTIONS = [
  'I need a gift idea',
  'Show me laptops',
  'Something under $50',
];

// The backend answers a rate limit with a technical message.
const friendly = (message: string): string =>
  /too many requests/i.test(message)
    ? 'You are sending messages a little too fast. Please wait a moment and try again.'
    : message;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([GREETING]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [entries, loading, error, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (raw: string) => {
    const content = raw.trim().slice(0, MAX_LENGTH);
    if (!content || loading) return;
    const next: Entry[] = [...entries, { role: 'user', content }];
    setEntries(next);
    setText('');
    setError('');
    setLoading(true);
    try {
      // The greeting is UI only, so it is not part of the conversation.
      const history: ChatMessage[] = next
        .filter((e) => e !== GREETING)
        .map(({ role, content: c }) => ({ role, content: c }));
      const res = await sendChat(history);
      setEntries([
        ...next,
        { role: 'assistant', content: res.reply, products: res.products },
      ]);
    } catch (e) {
      setError(
        friendly(
          e instanceof Error
            ? e.message
            : 'Something went wrong. Please try again.',
        ),
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void send(text);
  };

  if (!open) {
    return (
      <button
        type="button"
        className="chat-launcher"
        onClick={() => setOpen(true)}
        aria-label="Open shopping assistant"
      >
        <Icon name="chat" size={22} />
        <span>Need help choosing?</span>
      </button>
    );
  }

  return (
    <section
      className="chat-panel"
      role="dialog"
      aria-label="Shopping assistant"
    >
      <header className="chat-head">
        <div>
          <strong>Shopping assistant</strong>
          <span>Ask me to find a product</span>
        </div>
        <button
          type="button"
          className="chat-close"
          onClick={() => setOpen(false)}
          aria-label="Close assistant"
        >
          <Icon name="close" />
        </button>
      </header>

      <div className="chat-body" aria-live="polite">
        {entries.map((entry, i) => (
          <div key={i} className={`chat-row ${entry.role}`}>
            <p className="chat-bubble">{entry.content}</p>
            {entry.products && entry.products.length > 0 && (
              <ul className="chat-products">
                {entry.products.map((p) => (
                  <li key={p._id}>
                    <Link
                      to={`/products/${p._id}`}
                      onClick={() => setOpen(false)}
                    >
                      {p.photo ? (
                        <img src={p.photo} alt="" loading="lazy" />
                      ) : (
                        <span className="chat-product-empty" />
                      )}
                      <span className="chat-product-text">
                        <strong>{p.productName}</strong>
                        <span>{p.category}</span>
                      </span>
                      <span className="chat-product-price">
                        ${Number(p.price).toFixed(2)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {entries.length === 1 && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => void send(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="chat-row assistant" aria-label="Assistant is typing">
            <p className="chat-bubble chat-typing">
              <span />
              <span />
              <span />
            </p>
          </div>
        )}
        {error && (
          <div className="chat-error" role="alert">
            {error}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="chat-form" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_LENGTH}
          placeholder="What are you looking for?"
          aria-label="Your message"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          aria-label="Send message"
        >
          <Icon name="send" />
        </button>
      </form>
    </section>
  );
}
