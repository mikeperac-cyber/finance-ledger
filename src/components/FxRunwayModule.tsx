import React, { useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useLedgerStore } from '../store/useLedgerStore';
import {
  computeLifeHours,
  convertCurrency,
  formatCurrency,
  formatLifeHours,
} from '../utils/currency';
import { CurrencyCode } from '../types/ledger';

const LOCATION_PRESETS: Array<{
  name: string;
  currency: CurrencyCode;
  monthlyBurnInUSD: number;
}> = [
  {
    name: 'Istanbul / Bosphorus',
    currency: 'TRY',
    monthlyBurnInUSD: 2850,
  },
  {
    name: 'Lisbon / EU Hub',
    currency: 'EUR',
    monthlyBurnInUSD: 4650,
  },
  {
    name: 'London / Zone 1',
    currency: 'GBP',
    monthlyBurnInUSD: 6900,
  },
  {
    name: 'New York / Manhattan',
    currency: 'USD',
    monthlyBurnInUSD: 8400,
  },
];

export const FxRunwayModule: React.FC = () => {
  const {
    profile,
    currencies,
    accounts,
    transactions,
    simulateFxTick,
    updateExchangeRate,
    updateProfile,
    addAccount,
    deleteAccount,
  } = useLedgerStore();

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accName, setAccName] = useState('');
  const [accInst, setAccInst] = useState('');
  const [accCurrency, setAccCurrency] = useState<CurrencyCode>('EUR');
  const [accBalance, setAccBalance] = useState('');
  const [accIsBiz, setAccIsBiz] = useState(false);

  const [editingFxCode, setEditingFxCode] = useState<CurrencyCode | null>(null);
  const [fxInputVal, setFxInputVal] = useState('');

  const base = profile.baseCurrency;
  const hoursPrimary = profile.displayMode === 'hours-primary';

  const totalPortfolioBase = accounts.reduce(
    (sum, acc) =>
      sum + convertCurrency(acc.balance, acc.currency, base, currencies),
    0
  );

  const totalPartitionedTaxReserveBase = transactions
    .filter((tx) => tx.firewall === 'business' && tx.direction === 'income')
    .reduce(
      (sum, tx) =>
        sum +
        convertCurrency(
          tx.taxReservedAmount || tx.amount * (profile.taxBufferPercent / 100),
          tx.currency,
          base,
          currencies
        ),
      0
    );

  const liquidAssetsBase = Math.max(
    0,
    totalPortfolioBase - totalPartitionedTaxReserveBase
  );

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(accBalance);
    if (!accName.trim() || isNaN(bal)) return;

    addAccount({
      name: accName.trim(),
      institution: accInst.trim() || 'Global Custodian',
      currency: accCurrency,
      balance: bal,
      type: 'fx-wallet',
      isBusiness: accIsBiz,
    });

    setAccName('');
    setAccInst('');
    setAccBalance('');
    setShowAddAccount(false);
  };

  const handleSelectLocationPreset = (
    loc: (typeof LOCATION_PRESETS)[number]
  ) => {
    const burnInBase = Math.round(
      convertCurrency(loc.monthlyBurnInUSD, 'USD', base, currencies)
    );
    updateProfile({
      locationName: loc.name,
      locationBurnRateMonthly: burnInBase,
    });
  };

  return (
    <div className="flex flex-col rounded-xl border border-white/[0.08] bg-[#121417] p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-medium text-white">
            Accounts &amp; FX Runway
          </h2>
          <p className="mt-0.5 text-[12px] text-[#71717a]">
            Balances converted to {base}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={simulateFxTick}
            title="Simulate market rate update"
            className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#181a1f] px-2 py-1 text-[12px] text-[#a1a1aa] transition hover:border-white/20 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" />
            <span>FX</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddAccount((prev) => !prev)}
            className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#181a1f] px-2.5 py-1 text-[12px] font-medium text-[#d4d4d8] transition hover:border-white/20 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Account</span>
          </button>
        </div>
      </div>

      {/* Add Account Form */}
      {showAddAccount && (
        <form
          onSubmit={handleCreateAccount}
          className="mt-4 space-y-2.5 rounded-lg border border-white/[0.08] bg-[#0c0d0f] p-3.5 text-[12px]"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#d4d4d8]">
              Add currency account
            </span>
            <button
              type="button"
              onClick={() => setShowAddAccount(false)}
              className="text-[#71717a] hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              id="account-name-input"
              name="accountName"
              type="text"
              required
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              placeholder="Account name"
              className="rounded-md border border-white/[0.08] bg-[#14161a] px-2.5 py-1.5 text-[12px] text-white placeholder-[#63666e] focus:border-white/25 focus:outline-none"
            />
            <input
              id="account-inst-input"
              name="accountInstitution"
              type="text"
              value={accInst}
              onChange={(e) => setAccInst(e.target.value)}
              placeholder="Bank / Institution"
              className="rounded-md border border-white/[0.08] bg-[#14161a] px-2.5 py-1.5 text-[12px] text-white placeholder-[#63666e] focus:border-white/25 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <input
              id="account-balance-input"
              name="accountBalance"
              type="number"
              step="0.01"
              required
              value={accBalance}
              onChange={(e) => setAccBalance(e.target.value)}
              placeholder="Balance"
              className="rounded-md border border-white/[0.08] bg-[#14161a] px-2.5 py-1.5 font-mono text-[12px] text-white placeholder-[#63666e] focus:border-white/25 focus:outline-none"
            />

            <select
              id="account-currency-select"
              name="accountCurrency"
              value={accCurrency}
              onChange={(e) => setAccCurrency(e.target.value as CurrencyCode)}
              className="rounded-md border border-white/[0.08] bg-[#14161a] px-2 py-1.5 font-mono text-[12px] text-[#d4d4d8] focus:outline-none"
            >
              {Object.keys(currencies).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              id="account-type-select"
              name="accountType"
              value={accIsBiz ? 'biz' : 'personal'}
              onChange={(e) => setAccIsBiz(e.target.value === 'biz')}
              className="rounded-md border border-white/[0.08] bg-[#14161a] px-2 py-1.5 text-[12px] text-[#d4d4d8] focus:outline-none"
            >
              <option value="personal">Personal</option>
              <option value="biz">Business</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-[#ededef] py-1.5 text-[12px] font-medium text-[#0c0d0f] transition hover:bg-white"
          >
            Save account
          </button>
        </form>
      )}

      {/* Accounts List */}
      <div className="mt-4 divide-y divide-white/[0.06]">
        {accounts.length === 0 ? (
          <div className="py-6 text-center text-[12px] text-[#71717a]">
            No accounts added yet. Click &ldquo;+ Account&rdquo; above to add a
            balance.
          </div>
        ) : (
          accounts.map((acc) => {
          const valInBase = convertCurrency(
            acc.balance,
            acc.currency,
            base,
            currencies
          );
          const sharePct =
            totalPortfolioBase > 0
              ? Math.min(100, (valInBase / totalPortfolioBase) * 100)
              : 0;
          const lifeHrs = computeLifeHours(
            acc.balance,
            acc.currency,
            profile,
            currencies
          );

          return (
            <div
              key={acc.id}
              className="group flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium text-[#ededef]">
                    {acc.name}
                  </span>
                  <span className="font-mono text-[10px] text-[#71717a]">
                    {acc.isBusiness ? 'BIZ' : 'PERS'}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-[#71717a]">
                  {acc.institution} · {sharePct.toFixed(0)}% of holdings
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right font-mono tabular-nums">
                  <div className="text-[13px] font-medium text-white">
                    {hoursPrimary
                      ? formatLifeHours(lifeHrs)
                      : formatCurrency(acc.balance, acc.currency, currencies, {
                          decimals: 0,
                        })}
                  </div>
                  <div className="text-[11px] text-[#71717a]">
                    {hoursPrimary
                      ? formatCurrency(acc.balance, acc.currency, currencies, {
                          decimals: 0,
                        })
                      : acc.currency !== base
                        ? `≈ ${formatCurrency(valInBase, base, currencies, { decimals: 0 })}`
                        : `${formatLifeHours(lifeHrs)}`}
                  </div>
                </div>

                {accounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteAccount(acc.id)}
                    title="Remove account"
                    className="hidden text-[#52525b] hover:text-[#e16d6d] group-hover:inline-block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* Location Burn & Runway Comparison */}
      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <div className="mb-2.5 flex items-center justify-between text-[12px]">
          <span className="font-medium text-[#a1a1aa]">
            Runway by location burn
          </span>
          <span className="text-[11px] text-[#71717a]">Click to select</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {LOCATION_PRESETS.map((loc) => {
            const locBurnInBase = convertCurrency(
              loc.monthlyBurnInUSD,
              'USD',
              base,
              currencies
            );
            const locRunwayMonths =
              locBurnInBase > 0 ? liquidAssetsBase / locBurnInBase : 0;
            const isSelected = profile.locationName === loc.name;

            return (
              <button
                key={loc.name}
                type="button"
                onClick={() => handleSelectLocationPreset(loc)}
                className={`rounded-lg border p-2.5 text-left transition ${
                  isSelected
                    ? 'border-white/25 bg-white/[0.06]'
                    : 'border-white/[0.06] bg-[#0c0d0f] hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-[#e4e4e7] truncate">
                    {loc.name.split(' / ')[0]}
                  </span>
                  <span className="font-mono text-[12px] text-[#78b090] tabular-nums">
                    {locRunwayMonths.toFixed(1)} mo
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-[#71717a] tabular-nums">
                  {formatCurrency(locBurnInBase, base, currencies, {
                    decimals: 0,
                  })}
                  /mo
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FX Reference Rates */}
      <div className="mt-4 border-t border-white/[0.06] pt-3.5">
        <div className="mb-2 flex items-center justify-between text-[11px] text-[#71717a]">
          <span>Exchange rates (per 1 USD)</span>
          <span>Click rate to override</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
          {(['EUR', 'GBP', 'TRY', 'CHF', 'JPY', 'USD'] as CurrencyCode[]).map(
            (code) => {
              const cfg = currencies[code];
              const isEditing = editingFxCode === code;

              return (
                <div
                  key={code}
                  className="rounded border border-white/[0.06] bg-[#0c0d0f] px-2 py-1"
                >
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const parsed = parseFloat(fxInputVal);
                        if (!isNaN(parsed) && parsed > 0) {
                          updateExchangeRate(code, parsed);
                        }
                        setEditingFxCode(null);
                      }}
                    >
                      <input
                        id={`fx-rate-${code}`}
                        name={`fxRate${code}`}
                        type="number"
                        step="any"
                        autoFocus
                        value={fxInputVal}
                        onChange={(e) => setFxInputVal(e.target.value)}
                        onBlur={() => setEditingFxCode(null)}
                        className="w-full bg-transparent text-[11px] text-white focus:outline-none"
                      />
                    </form>
                  ) : (
                    <button
                      type="button"
                      disabled={code === 'USD'}
                      onClick={() => {
                        setEditingFxCode(code);
                        setFxInputVal(String(cfg.ratePerUSD));
                      }}
                      className="flex w-full items-center justify-between text-left hover:text-white disabled:cursor-default"
                    >
                      <span className="text-[#71717a]">{code}</span>
                      <span className="text-[#d4d4d8] tabular-nums">
                        {cfg.ratePerUSD}
                      </span>
                    </button>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};
