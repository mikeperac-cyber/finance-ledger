import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useLedgerStore } from '../store/useLedgerStore';
import {
  computeLifeHours,
  convertCurrency,
  formatCountdownHMS,
  formatCurrency,
  formatLifeHours,
} from '../utils/currency';
import { CurrencyCode, FirewallType } from '../types/ledger';

export const CooldownChamber: React.FC = () => {
  const {
    profile,
    currencies,
    cooldownItems,
    addCooldownItem,
    approveCooldownItem,
    dismissCooldownItem,
    fastForwardCooldownItem,
  } = useLedgerStore();

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(profile.baseCurrency);
  const [firewall, setFirewall] = useState<FirewallType>('personal');

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const base = profile.baseCurrency;

  const activeItems = cooldownItems.filter((item) => item.status === 'cooling');
  const dismissedItems = cooldownItems.filter(
    (item) => item.status === 'dismissed'
  );
  const approvedItems = cooldownItems.filter(
    (item) => item.status === 'approved'
  );

  const totalSavedBase = dismissedItems.reduce(
    (sum, item) =>
      sum + convertCurrency(item.amount, item.currency, base, currencies),
    0
  );
  const totalSavedLifeHours = dismissedItems.reduce(
    (sum, item) =>
      sum + computeLifeHours(item.amount, item.currency, profile, currencies),
    0
  );

  const previewAmount = parseFloat(amountStr) || 0;
  const previewLifeHours =
    previewAmount > 0
      ? computeLifeHours(previewAmount, currency, profile, currencies)
      : 0;
  const previewCooldownHours = previewLifeHours * profile.cooldownMultiplier;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || previewAmount <= 0) return;

    addCooldownItem({
      title: title.trim(),
      amount: previewAmount,
      currency,
      firewall,
      category: firewall === 'business' ? 'Hardware & Gear' : 'Lifestyle',
    });

    setTitle('');
    setAmountStr('');
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col rounded-xl border border-white/[0.08] bg-[#121417] p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-medium text-white">
            Cooling-Off List
          </h2>
          <p className="mt-0.5 text-[12px] text-[#71717a]">
            {profile.cooldownMultiplier}h wait per work hour ·{' '}
            <span className="text-[#78b090]">
              {formatCurrency(totalSavedBase, base, currencies, { decimals: 0 })}{' '}
              ({formatLifeHours(totalSavedLifeHours)}) saved
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#181a1f] px-2.5 py-1 text-[12px] font-medium text-[#d4d4d8] transition hover:border-white/20 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add item</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="mt-4 space-y-2.5 rounded-lg border border-white/[0.08] bg-[#0c0d0f] p-3.5 text-[12px]"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#d4d4d8]">
              Hold a purchase for review
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[#71717a] hover:text-white"
            >
              Cancel
            </button>
          </div>

          <input
            id="cooldown-title-input"
            name="cooldownTitle"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Item name (e.g. Studio Display, Leica Q3)..."
            className="w-full rounded-md border border-white/[0.08] bg-[#14161a] px-3 py-1.5 text-[12px] text-white placeholder-[#63666e] focus:border-white/25 focus:outline-none"
          />

          <div className="grid grid-cols-3 gap-2">
            <input
              id="cooldown-amount-input"
              name="cooldownAmount"
              type="number"
              step="0.01"
              min="1"
              required
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="Price"
              className="rounded-md border border-white/[0.08] bg-[#14161a] px-2.5 py-1.5 font-mono text-[12px] text-white placeholder-[#63666e] focus:border-white/25 focus:outline-none"
            />

            <select
              id="cooldown-currency-select"
              name="cooldownCurrency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="rounded-md border border-white/[0.08] bg-[#14161a] px-2 py-1.5 font-mono text-[12px] text-[#d4d4d8] focus:outline-none"
            >
              {Object.keys(currencies).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              id="cooldown-firewall-select"
              name="cooldownFirewall"
              value={firewall}
              onChange={(e) => setFirewall(e.target.value as FirewallType)}
              className="rounded-md border border-white/[0.08] bg-[#14161a] px-2 py-1.5 text-[12px] text-[#d4d4d8] focus:outline-none"
            >
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </div>

          {previewAmount > 0 && (
            <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-[#a1a1aa]">
              <span>Requires {previewLifeHours.toFixed(1)} hrs of work</span>
              <span>Cooldown: {previewCooldownHours.toFixed(1)} hrs</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-[#ededef] py-1.5 text-[12px] font-medium text-[#0c0d0f] transition hover:bg-white"
          >
            Start cooling period
          </button>
        </form>
      )}

      {/* Active Items */}
      <div className="mt-4 divide-y divide-white/[0.06]">
        {activeItems.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[#71717a]">
            Nothing cooling off right now.
          </div>
        ) : (
          activeItems.map((item) => {
            const elapsedMs = Math.max(0, nowMs - item.createdAt);
            const remainingMs = Math.max(0, item.durationMs - elapsedMs);
            const isUnlocked = remainingMs <= 0;
            const progressPct = Math.min(
              100,
              Math.max(2, (elapsedMs / Math.max(1, item.durationMs)) * 100)
            );

            const currentLifeHours = computeLifeHours(
              item.amount,
              item.currency,
              profile,
              currencies
            );
            const inBase = convertCurrency(
              item.amount,
              item.currency,
              base,
              currencies
            );

            return (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-medium text-[#ededef]">
                      {item.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[12px] text-[#8a8f98]">
                      <span className="text-[#d4d4d8]">
                        {formatCurrency(item.amount, item.currency, currencies)}
                      </span>
                      {item.currency !== base && (
                        <span>
                          ({formatCurrency(inBase, base, currencies, { decimals: 0 })})
                        </span>
                      )}
                      <span>·</span>
                      <span className="text-[#c4a468]">
                        {currentLifeHours.toFixed(1)} hrs of work
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right font-mono text-[11px] tabular-nums">
                    {isUnlocked ? (
                      <span className="text-[#78b090]">Ready</span>
                    ) : (
                      <span className="text-[#8a8f98]">
                        {formatCountdownHMS(remainingMs)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Hairline */}
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isUnlocked ? 'bg-[#78b090]' : 'bg-[#c4a468]'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Actions */}
                <div className="mt-2.5 flex items-center justify-between gap-2 text-[12px]">
                  <button
                    type="button"
                    onClick={() => dismissCooldownItem(item.id)}
                    className="font-medium text-[#78b090] hover:underline"
                  >
                    Skip &amp; save {formatCurrency(item.amount, item.currency, currencies, { decimals: 0 })}
                  </button>

                  {!isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => fastForwardCooldownItem(item.id)}
                      className="text-[11px] text-[#71717a] hover:text-[#d4d4d8]"
                    >
                      Unlock timer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => approveCooldownItem(item.id)}
                      className="rounded-md border border-white/[0.1] bg-[#181a1f] px-2.5 py-1 text-[11px] font-medium text-[#e4e4e7] hover:bg-white/[0.08]"
                    >
                      Approve &amp; record purchase
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Past Decisions */}
      {(dismissedItems.length > 0 || approvedItems.length > 0) && (
        <div className="mt-4 border-t border-white/[0.06] pt-3">
          <div className="mb-1.5 text-[11px] text-[#71717a]">
            Recent decisions
          </div>
          <div className="space-y-1">
            {[...dismissedItems, ...approvedItems].slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-[12px]"
              >
                <span className="truncate text-[#8a8f98] max-w-[190px]">
                  {item.title}
                </span>
                <span
                  className={`font-mono text-[11px] ${
                    item.status === 'dismissed'
                      ? 'text-[#78b090]'
                      : 'text-[#71717a]'
                  }`}
                >
                  {item.status === 'dismissed'
                    ? `Skipped · Saved ${formatCurrency(item.amount, item.currency, currencies, { decimals: 0 })}`
                    : `Bought · ${formatCurrency(item.amount, item.currency, currencies, { decimals: 0 })}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
