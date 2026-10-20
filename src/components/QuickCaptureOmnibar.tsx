import React, { useState, useEffect, useRef } from 'react';
import { CornerDownLeft, Check } from 'lucide-react';
import { useLedgerStore } from '../store/useLedgerStore';
import { parseQuickCommand } from '../utils/nlpParser';
import {
  computeLifeHours,
  convertCurrency,
  formatCurrency,
  formatLifeHours,
} from '../utils/currency';
import {
  CurrencyCode,
  FirewallType,
  TransactionDirection,
} from '../types/ledger';

const PRESET_EXAMPLES = [
  'lunch 18 card',
  'client retainer 1500 usd biz',
  'software sub 45 eur tax',
  'sony a7cr 2900 usd cooldown',
];

export const QuickCaptureOmnibar: React.FC = () => {
  const { profile, currencies, addTransaction, addCooldownItem } =
    useLedgerStore();

  const [input, setInput] = useState('');
  const [overrideFirewall, setOverrideFirewall] = useState<FirewallType | null>(
    null
  );
  const [overrideDirection, setOverrideDirection] =
    useState<TransactionDirection | null>(null);
  const [overrideCurrency, setOverrideCurrency] = useState<CurrencyCode | null>(
    null
  );
  const [overrideCooldown, setOverrideCooldown] = useState<boolean | null>(
    null
  );
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const parsed = parseQuickCommand(input, profile.baseCurrency);

  const effectiveFirewall = overrideFirewall ?? parsed.firewall;
  const effectiveDirection = overrideDirection ?? parsed.direction;
  const effectiveCurrency = overrideCurrency ?? parsed.currency;
  const effectiveCooldown = overrideCooldown ?? parsed.isCooldownIntent;
  const effectiveTaxDeductible =
    effectiveFirewall === 'business' && effectiveDirection === 'expense';

  const hasValidEntry =
    parsed.title.trim().length > 0 &&
    parsed.amount !== null &&
    parsed.amount > 0;

  const lifeHours =
    parsed.amount && parsed.amount > 0
      ? computeLifeHours(
          parsed.amount,
          effectiveCurrency,
          profile,
          currencies
        )
      : 0;

  const convertedInBase =
    parsed.amount && parsed.amount > 0
      ? convertCurrency(
          parsed.amount,
          effectiveCurrency,
          profile.baseCurrency,
          currencies
        )
      : 0;

  const resetOverrides = () => {
    setOverrideFirewall(null);
    setOverrideDirection(null);
    setOverrideCurrency(null);
    setOverrideCooldown(null);
  };

  const triggerFlash = (msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => {
      setFlashMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleSubmit = (
    e?: React.FormEvent,
    forceCooldownMode: boolean = false
  ) => {
    if (e) e.preventDefault();
    if (!hasValidEntry || parsed.amount === null) return;

    const sendToCooldown = forceCooldownMode || effectiveCooldown;

    if (sendToCooldown) {
      const item = addCooldownItem({
        title: parsed.title,
        amount: parsed.amount,
        currency: effectiveCurrency,
        category: parsed.category,
        firewall: effectiveFirewall,
      });
      triggerFlash(
        `Added "${item.title}" to Cooling-Off (${(
          item.durationMs / 3600000
        ).toFixed(1)}h wait · ${item.lifeHoursRequired.toFixed(1)} hrs of work)`
      );
    } else {
      const tx = addTransaction({
        title: parsed.title,
        amount: parsed.amount,
        currency: effectiveCurrency,
        direction: effectiveDirection,
        firewall: effectiveFirewall,
        isTaxDeductible: effectiveTaxDeductible,
        category: parsed.category,
        method: parsed.method,
      });
      const hrsStr = formatLifeHours(lifeHours);
      if (tx.firewall === 'business' && tx.direction === 'income') {
        triggerFlash(
          `Logged +${formatCurrency(tx.amount, tx.currency, currencies)} · Set aside ${formatCurrency(tx.taxReservedAmount, tx.currency, currencies)} (${profile.taxBufferPercent}%) for taxes`
        );
      } else {
        triggerFlash(
          `Logged ${tx.title} · ${formatCurrency(tx.amount, tx.currency, currencies)} (${hrsStr})`
        );
      }
    }

    setInput('');
    resetOverrides();
  };

  return (
    <section
      aria-label="Quick Entry Command Bar"
      className="rounded-xl border border-white/[0.08] bg-[#121417] px-4 py-3 transition focus-within:border-white/20"
    >
      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2.5">
            <span className="font-mono text-xs text-[#71717a] select-none">
              +
            </span>

            <input
              ref={inputRef}
              id="quick-capture-input"
              name="quickCapture"
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (!e.target.value.trim()) resetOverrides();
              }}
              placeholder='Quick entry — type "lunch 18 card", "client retainer 1500 usd biz", or "software sub 45 eur tax"...'
              aria-label="Quick entry input"
              className="w-full bg-transparent py-1 text-[14px] text-white placeholder-[#63666e] focus:outline-none"
            />

            {!input && (
              <kbd className="hidden shrink-0 rounded border border-white/[0.08] bg-[#181a1f] px-1.5 py-0.5 font-mono text-[11px] text-[#71717a] sm:inline-block">
                ⌘K
              </kbd>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {hasValidEntry && !effectiveCooldown && (
              <button
                type="button"
                onClick={() => handleSubmit(undefined, true)}
                className="rounded-lg border border-white/[0.09] bg-[#181a1f] px-3 py-1.5 text-[12px] font-medium text-[#d4d4d8] transition hover:border-white/20 hover:text-white"
              >
                Hold in Cooling-Off
              </button>
            )}

            <button
              type="submit"
              disabled={!hasValidEntry}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition ${
                hasValidEntry
                  ? 'bg-[#ededef] text-[#0c0d0f] hover:bg-white'
                  : 'cursor-not-allowed bg-white/[0.04] text-[#52525b]'
              }`}
            >
              <span>{effectiveCooldown ? 'Start Cooldown' : 'Record'}</span>
              <CornerDownLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Contextual Strip */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05] pt-2 text-[12px]">
          {input.trim().length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-[#a1a1aa]">
              <span className="font-medium text-white">
                {parsed.title || 'Untitled'}
              </span>
              <span className="text-white/20">·</span>
              <span className="font-mono text-[#ededef]">
                {parsed.amount
                  ? `${effectiveDirection === 'expense' ? '−' : '+'}${formatCurrency(parsed.amount, effectiveCurrency, currencies)}`
                  : 'Enter an amount'}
                {parsed.amount &&
                  effectiveCurrency !== profile.baseCurrency &&
                  ` (≈ ${formatCurrency(convertedInBase, profile.baseCurrency, currencies)})`}
              </span>

              {parsed.amount && parsed.amount > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="font-mono text-[#c4a468]">
                    {formatLifeHours(lifeHours)} of work
                  </span>
                </>
              )}

              <span className="text-white/20">·</span>
              <button
                type="button"
                onClick={() =>
                  setOverrideFirewall(
                    effectiveFirewall === 'personal' ? 'business' : 'personal'
                  )
                }
                className="rounded bg-white/[0.06] px-2 py-0.5 text-[11px] text-[#e4e4e7] hover:bg-white/[0.12]"
              >
                {effectiveFirewall === 'business'
                  ? effectiveDirection === 'expense'
                    ? 'Business · Tax write-off'
                    : `Business income (${profile.taxBufferPercent}% tax set-aside)`
                  : 'Personal'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setOverrideDirection(
                    effectiveDirection === 'expense' ? 'income' : 'expense'
                  )
                }
                className="rounded bg-white/[0.06] px-2 py-0.5 text-[11px] text-[#a1a1aa] hover:bg-white/[0.12] hover:text-white"
              >
                {effectiveDirection === 'income' ? 'Income' : 'Expense'}
              </button>

              <span className="text-[#71717a]">
                {parsed.category} ({parsed.method})
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#71717a]">
              <span>Examples:</span>
              {PRESET_EXAMPLES.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => {
                    setInput(cmd);
                    resetOverrides();
                    inputRef.current?.focus();
                  }}
                  className="font-mono text-[11px] text-[#8a8f98] transition hover:text-white"
                >
                  &ldquo;{cmd}&rdquo;
                </button>
              ))}
            </div>
          )}

          {flashMessage && (
            <div className="flex items-center gap-1.5 text-[12px] text-[#78b090]">
              <Check className="h-3.5 w-3.5" />
              <span>{flashMessage}</span>
            </div>
          )}
        </div>
      </form>
    </section>
  );
};
