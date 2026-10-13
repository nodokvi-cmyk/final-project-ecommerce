import { useEffect, useState } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
  // Call onChange on every valid keystroke instead of only on blur/Enter.
  live?: boolean;
}

export default function QuantityInput({
  value,
  onChange,
  max,
  disabled,
  live,
}: Props) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clamp = (n: number) => {
    const upper = max !== undefined && max >= 1 ? max : Infinity;
    return Math.min(upper, Math.max(1, n));
  };

  const commit = (text: string) => {
    const parsed = parseInt(text, 10);
    const next = Number.isNaN(parsed) ? value : clamp(parsed);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const step = (delta: number) => {
    const next = clamp(value + delta);
    if (next !== value) onChange(next);
  };

  return (
    <div className="quantity">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= 1}
        onClick={() => step(-1)}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Quantity"
        value={draft}
        disabled={disabled}
        onChange={(e) => {
          const text = e.target.value.replace(/\D/g, '');
          setDraft(text);
          if (live) {
            const parsed = parseInt(text, 10);
            if (!Number.isNaN(parsed) && parsed >= 1) onChange(clamp(parsed));
          }
        }}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(draft);
        }}
        onFocus={(e) => e.target.select()}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || (max !== undefined && value >= max)}
        onClick={() => step(1)}
      >
        +
      </button>
    </div>
  );
}
