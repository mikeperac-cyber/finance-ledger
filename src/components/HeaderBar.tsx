import React from 'react';
import {
  Sliders,
  Download,
  Trash2,
  Plus,
  BookOpen,
  Monitor,
} from 'lucide-react';
import { useLedgerStore } from '../store/useLedgerStore';
import {
  computeNetHourlyRate,
  convertCurrency,
  formatCurrency,
} from '../utils/currency';
import { CurrencyCode, DisplayMode } from '../types/ledger';

export type WorkspaceSection =
  | 'overview'
  | 'ledger'
  | 'cooldown'
  | 'fx'
  | 'instructions';

interface NavigationProps {
  activeSection: WorkspaceSection;
  onSelectSection: (section: WorkspaceSection) => void;
  onOpenConfig: () => void;
  onOpenTaxExport: () => void;
  onOpenDesktopModal: () => void;
}

const CURRENCY_LIST: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'TRY', 'CHF', 'JPY'];

export const AdaptiveSidebar: React.FC<NavigationProps> = ({
  activeSection,
  onSelectSection,
  onOpenConfig,
  onOpenTaxExport,
  onOpenDesktopModal,
}) => {
  const {
    profile,
    currencies,
    accounts,
    cooldownItems,
    setBaseCurrency,
    updateProfile,
    clearAllData,
  } = useLedgerStore();

  const hourlyRate = computeNetHourlyRate(profile);
  const base = profile.baseCurrency;
  const activeCooldownCount = cooldownItems.filter(
    (c) => c.status === 'cooling'
  ).length;

  const totalNetWorthBase = accounts.reduce(
    (sum, a) => sum + convertCurrency(a.balance, a.currency, base, currencies),
    0
  );

  const navItems: Array<{
    id: WorkspaceSection;
    label: string;
    badge?: string | number;
  }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'ledger', label: 'Transactions & Tax' },
    {
      id: 'cooldown',
      label: 'Cooling-Off List',
      badge: activeCooldownCount > 0 ? activeCooldownCount : undefined,
    },
    { id: 'fx', label: 'Accounts & Runway' },
    { id: 'instructions', label: 'Instructions & Guide' },
  ];

  const handleDisplayMode = (mode: DisplayMode) => {
    updateProfile({ displayMode: mode });
  };

  return (
    <aside className="flex w-[256px] shrink-0 flex-col justify-between border-r border-white/[0.07] bg-[#0f1013] px-4 py-5 select-none">
      <div className="space-y-6">
        {/* Brand & Base Currency */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/[0.04]">
              <div className="h-2.5 w-2.5 rounded-full border-[1.5px] border-[#ededef]" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#f3f4f6]">
              Equinox
            </span>
          </div>

          <select
            id="sidebar-base-currency"
            name="baseCurrency"
            aria-label="Primary Base Currency"
            value={profile.baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as CurrencyCode)}
            className="cursor-pointer rounded-md border border-white/[0.08] bg-[#16181d] px-2 py-1 font-mono text-xs font-medium text-[#d4d4d8] transition hover:border-white/20 focus:outline-none"
          >
            {CURRENCY_LIST.map((code) => (
              <option key={code} value={code} className="bg-[#121316] text-white">
                {code} ({currencies[code].symbol.trim()})
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-0.5" aria-label="Workspace Views">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition ${
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-[#8a8f98] hover:bg-white/[0.04] hover:text-[#d4d4d8]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.id === 'instructions' && (
                    <BookOpen className="h-3.5 w-3.5 opacity-75" />
                  )}
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span className="font-mono text-[11px] text-[#a1a1aa]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Accounts Summary List */}
        <div className="pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-medium text-[#71717a]">
              Accounts (
              {formatCurrency(totalNetWorthBase, base, currencies, {
                compact: true,
              })}
              )
            </span>
            <button
              type="button"
              onClick={() => onSelectSection('fx')}
              className="text-[11px] text-[#8a8f98] hover:text-white flex items-center gap-0.5"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          </div>

          {accounts.length === 0 ? (
            <button
              type="button"
              onClick={() => onSelectSection('fx')}
              className="w-full rounded-lg border border-dashed border-white/[0.08] px-3 py-3 text-left text-[11px] text-[#71717a] transition hover:border-white/20 hover:text-[#a1a1aa]"
            >
              No accounts yet — click to add your first balance
            </button>
          ) : (
            <div className="space-y-0.5">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => onSelectSection('fx')}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate text-[12px] text-[#d4d4d8]">
                      {acc.name}
                    </div>
                    <div className="text-[10px] text-[#71717a]">
                      {acc.isBusiness ? 'Business' : 'Personal'} · {acc.currency}
                    </div>
                  </div>
                  <span className="font-mono text-[12px] text-[#e4e4e7] tabular-nums shrink-0">
                    {formatCurrency(acc.balance, acc.currency, currencies, {
                      decimals: 0,
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls: Work Rate, Display Toggle, Export & Settings */}
      <div className="space-y-3 border-t border-white/[0.06] pt-4">
        {/* Work Rate Card */}
        <div className="rounded-lg border border-white/[0.07] bg-[#14161a] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#8a8f98]">
              Effective hourly rate
            </span>
            <button
              type="button"
              onClick={onOpenConfig}
              className="text-[11px] font-medium text-[#d4d4d8] underline decoration-white/25 underline-offset-2 hover:text-white"
            >
              {hourlyRate > 0 ? 'Edit' : 'Set up'}
            </button>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-[16px] font-medium text-white tabular-nums">
              {formatCurrency(hourlyRate, base, currencies)}/hr
            </span>
            <span className="text-[11px] text-[#71717a]">
              ({profile.weeklyWorkHours}h/wk)
            </span>
          </div>

          {/* 3-Way Display Mode Toggle */}
          <div className="mt-2.5 grid grid-cols-3 rounded-md bg-[#0c0d0f] p-0.5 border border-white/[0.06] text-[11px]">
            <button
              type="button"
              onClick={() => handleDisplayMode('dual')}
              className={`rounded py-1 font-medium transition ${
                profile.displayMode === 'dual'
                  ? 'bg-[#1f2228] text-white shadow-2xs'
                  : 'text-[#71717a] hover:text-[#d4d4d8]'
              }`}
            >
              Both
            </button>
            <button
              type="button"
              onClick={() => handleDisplayMode('currency-primary')}
              className={`rounded py-1 font-medium transition ${
                profile.displayMode === 'currency-primary'
                  ? 'bg-[#1f2228] text-white shadow-2xs'
                  : 'text-[#71717a] hover:text-[#d4d4d8]'
              }`}
            >
              {currencies[base]?.symbol.trim()} Only
            </button>
            <button
              type="button"
              onClick={() => handleDisplayMode('hours-primary')}
              className={`rounded py-1 font-medium transition ${
                profile.displayMode === 'hours-primary'
                  ? 'bg-[#1f2228] text-white shadow-2xs'
                  : 'text-[#71717a] hover:text-[#d4d4d8]'
              }`}
            >
              Hours
            </button>
          </div>
        </div>

        {/* Desktop App Download Button */}
        <button
          type="button"
          onClick={onOpenDesktopModal}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#181a1f] px-3 py-2 text-[12px] font-medium text-white transition hover:border-white/25 hover:bg-white/[0.1]"
        >
          <Monitor className="h-3.5 w-3.5 text-[#78b090]" />
          <span>Download Desktop App</span>
        </button>

        {/* Utility Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenTaxExport}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#14161a] px-2.5 py-1.5 text-[12px] font-medium text-[#d4d4d8] transition hover:border-white/20 hover:text-white"
          >
            <Download className="h-3.5 w-3.5 text-[#8a8f98]" />
            <span>Tax Export</span>
          </button>

          <button
            type="button"
            onClick={onOpenConfig}
            title="Configure budget & vaults"
            className="rounded-lg border border-white/[0.08] bg-[#14161a] p-1.5 text-[#8a8f98] transition hover:border-white/20 hover:text-white"
          >
            <Sliders className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={clearAllData}
            title="Clear all stored data"
            className="rounded-lg border border-white/[0.08] bg-[#14161a] p-1.5 text-[#8a8f98] transition hover:border-white/20 hover:text-[#e16d6d]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

/**
 * Compact header for medium & mobile screens (< 980px)
 */
export const CompactHeaderBar: React.FC<NavigationProps> = ({
  activeSection,
  onSelectSection,
  onOpenConfig,
  onOpenTaxExport,
  onOpenDesktopModal,
}) => {
  const { profile, currencies, setBaseCurrency, updateProfile } =
    useLedgerStore();
  const hourlyRate = computeNetHourlyRate(profile);
  const base = profile.baseCurrency;

  return (
    <header className="border-b border-white/[0.07] bg-[#0f1013] px-4 py-3">
      <div className="mx-auto flex max-w-[920px] flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded border border-white/15 bg-white/[0.04]">
              <div className="h-2 w-2 rounded-full border border-[#ededef]" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              Equinox
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenConfig}
            className="rounded-md border border-white/[0.07] bg-[#16181d] px-2 py-0.5 font-mono text-xs text-[#d4d4d8]"
          >
            {formatCurrency(hourlyRate, base, currencies)}/hr
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              updateProfile({
                displayMode:
                  profile.displayMode === 'hours-primary'
                    ? 'dual'
                    : 'hours-primary',
              })
            }
            className="rounded-md border border-white/[0.08] bg-[#16181d] px-2 py-1 text-xs text-[#d4d4d8]"
          >
            {profile.displayMode === 'hours-primary'
              ? 'Showing: Hours'
              : 'Showing: $ + hrs'}
          </button>

          <select
            id="compact-base-currency"
            name="baseCurrencyCompact"
            aria-label="Primary Base Currency"
            value={profile.baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as CurrencyCode)}
            className="rounded-md border border-white/[0.08] bg-[#16181d] px-2 py-1 font-mono text-xs text-white focus:outline-none"
          >
            {CURRENCY_LIST.map((code) => (
              <option key={code} value={code} className="bg-[#121316]">
                {code}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenDesktopModal}
            className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-[#16181d] px-2.5 py-1 text-xs font-medium text-white"
          >
            <Monitor className="h-3 w-3 text-[#78b090]" />
            <span>Desktop</span>
          </button>

          <button
            type="button"
            onClick={onOpenTaxExport}
            className="rounded-md border border-white/[0.08] bg-[#16181d] px-2.5 py-1 text-xs font-medium text-[#d4d4d8]"
          >
            Export
          </button>

          <button
            type="button"
            onClick={onOpenConfig}
            className="rounded-md border border-white/[0.08] bg-[#16181d] p-1.5 text-[#d4d4d8]"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Section Switcher Pills on Medium/Compact */}
      <div className="mx-auto mt-2.5 flex max-w-[920px] items-center gap-1 overflow-x-auto pt-1">
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'ledger', label: 'Transactions' },
            { id: 'cooldown', label: 'Cooling-Off' },
            { id: 'fx', label: 'Accounts & FX' },
            { id: 'instructions', label: 'Instructions' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectSection(tab.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
              activeSection === tab.id
                ? 'bg-white/[0.1] text-white'
                : 'text-[#8a8f98] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
