import React, { useState, useMemo } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useLedgerStore } from '../store/useLedgerStore';
import {
  computeLifeHours,
  convertCurrency,
  formatCurrency,
  formatLifeHours,
  generateLedgerCSV,
} from '../utils/currency';
import { CurrencyCode } from '../types/ledger';

type LedgerTab = 'all' | 'business' | 'personal';

interface DualViewLedgerProps {
  onOpenTaxExport: () => void;
}

function formatHumanDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(5, 10);
  }
}

export const DualViewLedger: React.FC<DualViewLedgerProps> = ({
  onOpenTaxExport,
}) => {
  const {
    profile,
    currencies,
    accounts,
    transactions,
    toggleTransactionFirewall,
    deleteTransaction,
  } = useLedgerStore();

  const [activeTab, setActiveTab] = useState<LedgerTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyCode | 'ALL'>(
    'ALL'
  );

  const base = profile.baseCurrency;
  const hoursPrimary = profile.displayMode === 'hours-primary';
  const currencyPrimary = profile.displayMode === 'currency-primary';

  const accountMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach((a) => {
      map[a.id] = a.name
        .replace(
          / Operating Checking| Local Settlement| Metal Vault| Borderless/g,
          ''
        )
        .trim();
    });
    return map;
  }, [accounts]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (activeTab === 'business' && tx.firewall !== 'business') return false;
      if (activeTab === 'personal' && tx.firewall !== 'personal') return false;
      if (currencyFilter !== 'ALL' && tx.currency !== currencyFilter)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tx.title.toLowerCase().includes(q);
        const matchCat = tx.category.toLowerCase().includes(q);
        const matchNotes = (tx.notes || '').toLowerCase().includes(q);
        const matchCur = tx.currency.toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchNotes && !matchCur) return false;
      }
      return true;
    });
  }, [transactions, activeTab, currencyFilter, searchQuery]);

  const summary = useMemo(() => {
    let incomeBase = 0;
    let expenseBase = 0;
    let deductibleBase = 0;
    let taxReservedBase = 0;
    let netLifeHours = 0;

    for (const tx of filteredTransactions) {
      const valBase = convertCurrency(tx.amount, tx.currency, base, currencies);
      const hrs = computeLifeHours(tx.amount, tx.currency, profile, currencies);
      if (tx.direction === 'income') {
        incomeBase += valBase;
        netLifeHours += hrs;
        if (tx.firewall === 'business') {
          taxReservedBase += convertCurrency(
            tx.taxReservedAmount ||
              tx.amount * (profile.taxBufferPercent / 100),
            tx.currency,
            base,
            currencies
          );
        }
      } else {
        expenseBase += valBase;
        netLifeHours -= hrs;
        if (tx.firewall === 'business' && tx.isTaxDeductible) {
          deductibleBase += valBase;
        }
      }
    }

    const writeOffShieldBase =
      deductibleBase * (profile.taxBufferPercent / 100);

    return {
      incomeBase,
      expenseBase,
      deductibleBase,
      taxReservedBase,
      writeOffShieldBase,
      netLifeHours,
    };
  }, [filteredTransactions, base, currencies, profile]);

  const handleQuickExportCSV = () => {
    const csv = generateLedgerCSV(filteredTransactions, profile, currencies);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equinox-ledger-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQuickExportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      filterScope: activeTab,
      baseCurrency: base,
      taxBufferPercent: profile.taxBufferPercent,
      summaryInBaseCurrency: summary,
      transactions: filteredTransactions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equinox-ledger-${activeTab}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const countAll = transactions.length;
  const countBiz = transactions.filter((t) => t.firewall === 'business').length;
  const countPersonal = transactions.filter(
    (t) => t.firewall === 'personal'
  ).length;

  return (
    <div className="flex flex-col rounded-xl border border-white/[0.08] bg-[#121417]">
      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3.5">
        <div
          className="flex items-center gap-1 rounded-lg bg-[#0c0d0f] p-1 border border-white/[0.06]"
          role="tablist"
          aria-label="Ledger View Filter"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-medium transition ${
              activeTab === 'all'
                ? 'bg-[#1f2228] text-white'
                : 'text-[#8a8f98] hover:text-[#d4d4d8]'
            }`}
          >
            All <span className="ml-1 font-mono text-[11px] opacity-60">{countAll}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'business'}
            onClick={() => setActiveTab('business')}
            className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-medium transition ${
              activeTab === 'business'
                ? 'bg-[#1f2228] text-white'
                : 'text-[#8a8f98] hover:text-[#d4d4d8]'
            }`}
          >
            Business &amp; Tax{' '}
            <span className="ml-1 font-mono text-[11px] opacity-60">{countBiz}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'personal'}
            onClick={() => setActiveTab('personal')}
            className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-medium transition ${
              activeTab === 'personal'
                ? 'bg-[#1f2228] text-white'
                : 'text-[#8a8f98] hover:text-[#d4d4d8]'
            }`}
          >
            Personal{' '}
            <span className="ml-1 font-mono text-[11px] opacity-60">{countPersonal}</span>
          </button>
        </div>

        {/* Search, FX Filter & Export */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#71717a]" />
            <input
              id="ledger-search-input"
              name="ledgerSearch"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              aria-label="Search transactions"
              className="w-32 rounded-lg border border-white/[0.08] bg-[#0c0d0f] py-1 pl-8 pr-2.5 text-[12px] text-white placeholder-[#63666e] focus:border-white/25 focus:outline-none sm:w-36"
            />
          </div>

          <select
            id="ledger-currency-filter"
            name="ledgerCurrencyFilter"
            aria-label="Filter by Currency"
            value={currencyFilter}
            onChange={(e) =>
              setCurrencyFilter(e.target.value as CurrencyCode | 'ALL')
            }
            className="rounded-lg border border-white/[0.08] bg-[#0c0d0f] px-2 py-1 font-mono text-[12px] text-[#d4d4d8] focus:outline-none"
          >
            <option value="ALL" className="bg-[#121417]">
              All FX
            </option>
            {Object.keys(currencies).map((c) => (
              <option key={c} value={c} className="bg-[#121417]">
                {c}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#0c0d0f] divide-x divide-white/[0.08] text-[12px]">
            <button
              type="button"
              onClick={handleQuickExportCSV}
              className="px-2 py-1 text-[#a1a1aa] transition hover:text-white"
              title="Download CSV"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={handleQuickExportJSON}
              className="px-2 py-1 text-[#a1a1aa] transition hover:text-white"
              title="Download JSON"
            >
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Contextual Business Summary Strip when viewing Business & Tax */}
      {activeTab === 'business' && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-[#16181d] px-5 py-2.5 text-[12px] text-[#a1a1aa]">
          <span>
            Deductible expenses:{' '}
            <strong className="font-mono font-medium text-white">
              {formatCurrency(summary.deductibleBase, base, currencies)}
            </strong>{' '}
            · Estimated tax write-off savings ({profile.taxBufferPercent}%):{' '}
            <strong className="font-mono font-medium text-[#78b090]">
              {formatCurrency(summary.writeOffShieldBase, base, currencies)}
            </strong>
          </span>
          <button
            type="button"
            onClick={onOpenTaxExport}
            className="text-white underline decoration-white/30 underline-offset-2"
          >
            Full tax summary →
          </button>
        </div>
      )}

      {/* Clean Human-Crafted Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-medium text-[#71717a]">
              <th className="py-2.5 pl-5 pr-2 font-normal w-16">Date</th>
              <th className="px-3 py-2.5 font-normal">Description</th>
              <th className="px-3 py-2.5 font-normal">Classification</th>
              <th className="px-3 py-2.5 text-right font-normal">
                {hoursPrimary ? 'Work hours' : 'Amount'}
              </th>
              {!currencyPrimary && (
                <th className="py-2.5 pl-2 pr-5 text-right font-normal">
                  {hoursPrimary ? 'Nominal' : 'Life hours'}
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.05] text-[13px]">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-[13px] text-[#71717a]"
                >
                  No transactions match this filter.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const lifeHrs = computeLifeHours(
                  tx.amount,
                  tx.currency,
                  profile,
                  currencies
                );
                const convertedBase = convertCurrency(
                  tx.amount,
                  tx.currency,
                  base,
                  currencies
                );
                const isExpense = tx.direction === 'expense';
                const isBiz = tx.firewall === 'business';
                const taxWriteOffSaving =
                  isBiz && isExpense && tx.isTaxDeductible
                    ? convertedBase * (profile.taxBufferPercent / 100)
                    : 0;

                return (
                  <tr
                    key={tx.id}
                    className="group transition hover:bg-white/[0.02]"
                  >
                    {/* Date */}
                    <td className="whitespace-nowrap py-3.5 pl-5 pr-2 font-mono text-[12px] text-[#71717a] tabular-nums align-top">
                      {formatHumanDate(tx.date)}
                    </td>

                    {/* Description & Subtitle */}
                    <td className="px-3 py-3.5 align-top">
                      <div className="font-medium text-[#ededef]">
                        {tx.title}
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#71717a]">
                        <span>{accountMap[tx.accountId] || 'Primary'}</span>
                        <span> · </span>
                        <span>{tx.category}</span>
                        {tx.notes && (
                          <>
                            <span> · </span>
                            <span className="text-[#8a8f98]">{tx.notes}</span>
                          </>
                        )}
                        {taxWriteOffSaving > 0 && (
                          <>
                            <span> · </span>
                            <span className="text-[#78b090]">
                              Saves{' '}
                              {formatCurrency(
                                taxWriteOffSaving,
                                base,
                                currencies
                              )}{' '}
                              tax
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Firewall Classification Toggle */}
                    <td className="whitespace-nowrap px-3 py-3.5 align-top">
                      <button
                        type="button"
                        onClick={() => toggleTransactionFirewall(tx.id)}
                        title="Click to switch between Personal and Business"
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                          isBiz
                            ? 'bg-white/[0.08] text-[#e4e4e7] hover:bg-white/[0.14]'
                            : 'text-[#8a8f98] hover:bg-white/[0.05] hover:text-[#d4d4d8]'
                        }`}
                      >
                        {isBiz
                          ? isExpense
                            ? 'Business · Tax'
                            : 'Business Income'
                          : 'Personal'}
                      </button>
                    </td>

                    {/* Nominal Amount */}
                    <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono tabular-nums align-top">
                      {hoursPrimary ? (
                        <span
                          className={`text-[13px] font-medium ${
                            isExpense ? 'text-[#ededef]' : 'text-[#78b090]'
                          }`}
                        >
                          {formatLifeHours(lifeHrs, {
                            showSign: isExpense ? 'expense' : 'income',
                          })}
                        </span>
                      ) : (
                        <div>
                          <span
                            className={`text-[13px] font-medium ${
                              isExpense ? 'text-[#ededef]' : 'text-[#78b090]'
                            }`}
                          >
                            {isExpense ? '−' : '+'}
                            {formatCurrency(
                              tx.amount,
                              tx.currency,
                              currencies
                            )}
                          </span>
                          {tx.currency !== base && (
                            <div className="text-[11px] text-[#71717a]">
                              {isExpense ? '−' : '+'}
                              {formatCurrency(convertedBase, base, currencies)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Life-Hours Tag + Delete */}
                    {!currencyPrimary && (
                      <td className="whitespace-nowrap py-3.5 pl-2 pr-5 text-right font-mono text-[12px] tabular-nums align-top">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={
                              hoursPrimary
                                ? 'text-[#8a8f98]'
                                : isExpense
                                  ? 'text-[#c4a468]'
                                  : 'text-[#78b090]'
                            }
                          >
                            {hoursPrimary
                              ? `${isExpense ? '−' : '+'}${formatCurrency(tx.amount, tx.currency, currencies)}`
                              : formatLifeHours(lifeHrs, {
                                  showSign: isExpense ? 'expense' : 'income',
                                })}
                          </span>

                          <button
                            type="button"
                            onClick={() => deleteTransaction(tx.id)}
                            title="Delete entry"
                            className="rounded p-1 text-[#52525b] opacity-0 transition hover:text-[#e16d6d] group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Quiet Footer Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3 text-[12px] text-[#8a8f98]">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            Income:{' '}
            <strong className="font-mono font-medium text-[#78b090]">
              +{formatCurrency(summary.incomeBase, base, currencies)}
            </strong>
          </span>
          <span>
            Spent:{' '}
            <strong className="font-mono font-medium text-[#ededef]">
              −{formatCurrency(summary.expenseBase, base, currencies)}
            </strong>
          </span>
          <span>
            Tax deductions:{' '}
            <strong className="font-mono font-medium text-[#d4d4d8]">
              {formatCurrency(summary.deductibleBase, base, currencies)}
            </strong>
          </span>
        </div>

        <div className="font-mono text-[12px] text-[#a1a1aa]">
          Net time impact:{' '}
          <span
            className={
              summary.netLifeHours >= 0 ? 'text-[#78b090]' : 'text-[#c4a468]'
            }
          >
            {summary.netLifeHours >= 0 ? '+' : ''}
            {summary.netLifeHours.toFixed(1)} hrs
          </span>
        </div>
      </div>
    </div>
  );
};
