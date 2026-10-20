import React, { useState } from 'react';
import { Plus, X, CornerDownLeft } from 'lucide-react';
import { useLedgerStore } from '../store/useLedgerStore';
import { parseQuickCommand } from '../utils/nlpParser';
import {
  computeLifeHours,
  formatCurrency,
  formatLifeHours,
} from '../utils/currency';

export const MobileBottomSheetInput: React.FC = () => {
  const { profile, currencies, addTransaction, addCooldownItem } =
    useLedgerStore();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  const parsed = parseQuickCommand(input, profile.baseCurrency);
  const hasValid =
    parsed.title.trim().length > 0 &&
    parsed.amount !== null &&
    parsed.amount > 0;

  const lifeHours =
    parsed.amount && parsed.amount > 0
      ? computeLifeHours(
          parsed.amount,
          parsed.currency,
          profile,
          currencies
        )
      : 0;

  const handleLog = (cooldownMode: boolean) => {
    if (!hasValid || parsed.amount === null) return;
    if (cooldownMode || parsed.isCooldownIntent) {
      addCooldownItem({
        title: parsed.title,
        amount: parsed.amount,
        currency: parsed.currency,
        category: parsed.category,
        firewall: parsed.firewall,
      });
    } else {
      addTransaction({
        title: parsed.title,
        amount: parsed.amount,
        currency: parsed.currency,
        direction: parsed.direction,
        firewall: parsed.firewall,
        isTaxDeductible:
          parsed.firewall === 'business' && parsed.direction === 'expense',
        category: parsed.category,
        method: parsed.method,
      });
    }
    setInput('');
    setIsOpen(false);
  };

  return (
    <div>
      {/* Floating Bottom Bar Trigger */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.08] bg-[#0f1013]/95 p-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-white/[0.1] bg-[#16181d] px-4 py-2.5 text-[13px] text-[#d4d4d8] shadow-lg"
        >
          <span className="text-[#8a8f98]">
            Quick entry (e.g. &ldquo;lunch 18 card&rdquo;)...
          </span>
          <span className="flex items-center gap-1 rounded-md bg-[#ededef] px-2.5 py-1 text-xs font-medium text-[#0c0d0f]">
            <Plus className="h-3.5 w-3.5" />
            Record
          </span>
        </button>
      </div>

      {/* Bottom Sheet Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs">
          <div className="rounded-t-2xl border-t border-white/[0.1] bg-[#121417] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <span className="text-[13px] font-medium text-white">
                Quick Entry
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-white/[0.08] p-1.5 text-[#8a8f98]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              id="mobile-quick-capture-input"
              name="mobileQuickCapture"
              type="text"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='e.g. "lunch 18 card" or "software sub 45 eur tax"'
              className="w-full rounded-xl border border-white/[0.1] bg-[#0c0d0f] px-3.5 py-3 text-[14px] text-white placeholder-[#63666e] focus:border-white/25 focus:outline-none"
            />

            {hasValid && parsed.amount !== null && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.07] bg-[#0c0d0f] p-2.5 text-[12px]">
                <span className="font-medium text-white">{parsed.title}</span>
                <span className="font-mono text-[#ededef]">
                  {formatCurrency(parsed.amount, parsed.currency, currencies)}
                </span>
                <span className="font-mono text-[#c4a468]">
                  · {formatLifeHours(lifeHours)}
                </span>
                <span className="text-[#8a8f98]">
                  · {parsed.firewall === 'business' ? 'Business' : 'Personal'}
                </span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={!hasValid}
                onClick={() => handleLog(true)}
                className="flex items-center justify-center rounded-xl border border-white/[0.1] bg-[#181a1f] py-2.5 text-[12px] font-medium text-[#d4d4d8] disabled:opacity-40"
              >
                Hold in Cooling-Off
              </button>

              <button
                type="button"
                disabled={!hasValid}
                onClick={() => handleLog(false)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ededef] py-2.5 text-[12px] font-medium text-[#0c0d0f] disabled:opacity-40"
              >
                <span>Record</span>
                <CornerDownLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
