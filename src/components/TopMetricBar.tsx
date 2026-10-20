import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLedgerStore } from '../store/useLedgerStore';
import {
  computeLifeHours,
  convertCurrency,
  formatCurrency,
  formatLifeHours,
} from '../utils/currency';

interface TopMetricBarProps {
  onOpenConfig: () => void;
  onOpenTaxExport: () => void;
}

export const TopMetricBar: React.FC<TopMetricBarProps> = ({
  onOpenConfig,
  onOpenTaxExport,
}) => {
  const { profile, currencies, accounts, commitments, transactions } =
    useLedgerStore();

  const [allowancePeriod, setAllowancePeriod] = useState<'daily' | 'weekly'>(
    'daily'
  );
  const [showWaterfall, setShowWaterfall] = useState(false);

  const base = profile.baseCurrency;

  // 1. Reverse Budgeting & Guilt-Free Pool Math
  const grossMonthly = profile.monthlyGrossIncome;
  const baselineTaxDeduction =
    grossMonthly * (profile.taxBufferPercent / 100);

  const activeCommitmentsTotalBase = commitments
    .filter((c) => c.active)
    .reduce(
      (sum, c) =>
        sum + convertCurrency(c.amount, c.currency, base, currencies),
      0
    );

  const monthlyGuiltFreePool =
    grossMonthly - baselineTaxDeduction - activeCommitmentsTotalBase;

  const thirtyDaysAgo = Date.now() - 30 * 86400 * 1000;
  const personalSpentThisMonthBase = transactions
    .filter(
      (tx) =>
        tx.firewall === 'personal' &&
        tx.direction === 'expense' &&
        new Date(tx.date).getTime() >= thirtyDaysAgo
    )
    .reduce(
      (sum, tx) =>
        sum + convertCurrency(tx.amount, tx.currency, base, currencies),
      0
    );

  const todayStr = new Date().toISOString().slice(0, 10);
  const personalSpentTodayBase = transactions
    .filter(
      (tx) =>
        tx.firewall === 'personal' &&
        tx.direction === 'expense' &&
        tx.date.slice(0, 10) === todayStr
    )
    .reduce(
      (sum, tx) =>
        sum + convertCurrency(tx.amount, tx.currency, base, currencies),
      0
    );

  const remainingMonthlyGuiltFree =
    monthlyGuiltFreePool - personalSpentThisMonthBase;

  const dailyBaselineAllowance = monthlyGuiltFreePool / 30.4375;
  const todaySafeToSpend = Math.max(
    0,
    dailyBaselineAllowance - personalSpentTodayBase
  );
  const weeklySafeToSpend = remainingMonthlyGuiltFree / 4.33;

  const displayedAllowanceAmount =
    allowancePeriod === 'daily' ? todaySafeToSpend : weeklySafeToSpend;
  const displayedAllowanceHours = computeLifeHours(
    displayedAllowanceAmount,
    base,
    profile,
    currencies
  );
  const monthlyPoolHours = computeLifeHours(
    remainingMonthlyGuiltFree,
    base,
    profile,
    currencies
  );

  // 2. Total Blended Net Worth & FX Runway Math
  const totalBlendedNetWorthBase = accounts.reduce(
    (sum, acc) =>
      sum + convertCurrency(acc.balance, acc.currency, base, currencies),
    0
  );

  // 3. Segregated Tax Reserve Holding & Business Firewall Math
  const totalBizRevenueBase = transactions
    .filter((tx) => tx.firewall === 'business' && tx.direction === 'income')
    .reduce(
      (sum, tx) =>
        sum + convertCurrency(tx.amount, tx.currency, base, currencies),
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

  const totalBizDeductibleExpensesBase = transactions
    .filter(
      (tx) =>
        tx.firewall === 'business' &&
        tx.direction === 'expense' &&
        tx.isTaxDeductible
    )
    .reduce(
      (sum, tx) =>
        sum + convertCurrency(tx.amount, tx.currency, base, currencies),
      0
    );

  const taxShieldSavingsBase =
    totalBizDeductibleExpensesBase * (profile.taxBufferPercent / 100);

  const liquidNetWorthBase = Math.max(
    0,
    totalBlendedNetWorthBase - totalPartitionedTaxReserveBase
  );

  const monthlyBurnBase = profile.locationBurnRateMonthly;
  const runwayMonths =
    monthlyBurnBase > 0 ? liquidNetWorthBase / monthlyBurnBase : 0;
  const runwayYears = runwayMonths / 12;

  const totalNetWorthLifeHours = computeLifeHours(
    totalBlendedNetWorthBase,
    base,
    profile,
    currencies
  );
  const taxReserveLifeHours = computeLifeHours(
    totalPartitionedTaxReserveBase,
    base,
    profile,
    currencies
  );

  const hoursPrimary = profile.displayMode === 'hours-primary';
  const currencyPrimary = profile.displayMode === 'currency-primary';

  return (
    <section
      aria-label="Financial Overview"
      className="rounded-xl border border-white/[0.08] bg-[#121417]"
    >
      <div className="grid grid-cols-1 divide-y divide-white/[0.07] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* METRIC 1: SAFE TO SPEND (GUILT-FREE ALLOWANCE) */}
        <div className="flex flex-col justify-between p-5 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-[#a1a1aa]">
                {allowancePeriod === 'daily'
                  ? 'Safe to spend today'
                  : 'Safe to spend this week'}
              </span>

              <div className="flex items-center rounded-md bg-[#0c0d0f] p-0.5 border border-white/[0.06] text-[11px]">
                <button
                  type="button"
                  onClick={() => setAllowancePeriod('daily')}
                  className={`rounded px-2 py-0.5 font-medium transition ${
                    allowancePeriod === 'daily'
                      ? 'bg-[#1f2228] text-white'
                      : 'text-[#71717a] hover:text-[#d4d4d8]'
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setAllowancePeriod('weekly')}
                  className={`rounded px-2 py-0.5 font-medium transition ${
                    allowancePeriod === 'weekly'
                      ? 'bg-[#1f2228] text-white'
                      : 'text-[#71717a] hover:text-[#d4d4d8]'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-baseline gap-2.5">
              <span className="font-mono text-3xl font-medium tracking-tight text-white tabular-nums">
                {hoursPrimary
                  ? formatLifeHours(displayedAllowanceHours, {
                      suffix: 'hrs of work',
                    })
                  : formatCurrency(displayedAllowanceAmount, base, currencies)}
              </span>

              {!currencyPrimary && (
                <span className="font-mono text-[13px] text-[#c4a468] tabular-nums">
                  {hoursPrimary
                    ? `(${formatCurrency(displayedAllowanceAmount, base, currencies)})`
                    : `· ${formatLifeHours(displayedAllowanceHours)} of work`}
                </span>
              )}
            </div>

            <p className="mt-1.5 text-[12px] leading-relaxed text-[#71717a]">
              {allowancePeriod === 'daily' ? (
                <>
                  {formatCurrency(dailyBaselineAllowance, base, currencies)}/day
                  baseline minus{' '}
                  {formatCurrency(personalSpentTodayBase, base, currencies)}{' '}
                  spent today
                </>
              ) : (
                <>
                  From {formatCurrency(remainingMonthlyGuiltFree, base, currencies)}{' '}
                  remaining in this month&apos;s guilt-free pool
                </>
              )}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3 text-[12px]">
            <button
              type="button"
              onClick={() => setShowWaterfall((prev) => !prev)}
              className="flex items-center gap-1 text-[#a1a1aa] transition hover:text-white"
            >
              <span>Reverse budget breakdown</span>
              {showWaterfall ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenConfig}
              className="text-[#8a8f98] underline decoration-white/20 underline-offset-2 hover:text-white"
            >
              Adjust commitments
            </button>
          </div>

          {showWaterfall && (
            <div className="mt-3 space-y-1.5 rounded-lg border border-white/[0.06] bg-[#0c0d0f] p-3 text-[12px]">
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Gross monthly income</span>
                <span className="font-mono text-white">
                  {formatCurrency(grossMonthly, base, currencies)}
                </span>
              </div>
              <div className="flex justify-between text-[#8a8f98]">
                <span>Tax buffer ({profile.taxBufferPercent}%)</span>
                <span className="font-mono">
                  −{formatCurrency(baselineTaxDeduction, base, currencies)}
                </span>
              </div>
              <div className="flex justify-between text-[#8a8f98]">
                <span>
                  Fixed commitments ({commitments.filter((c) => c.active).length})
                </span>
                <span className="font-mono">
                  −{formatCurrency(activeCommitmentsTotalBase, base, currencies)}
                </span>
              </div>
              <div className="my-1 border-t border-white/[0.06]" />
              <div className="flex justify-between font-medium text-[#ededef]">
                <span>Monthly guilt-free pool</span>
                <span className="font-mono">
                  {formatCurrency(monthlyGuiltFreePool, base, currencies)}
                </span>
              </div>
              <div className="flex justify-between text-[#71717a]">
                <span>Spent in last 30 days (personal)</span>
                <span className="font-mono">
                  −{formatCurrency(personalSpentThisMonthBase, base, currencies)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/[0.06] pt-1.5 font-medium text-[#5e9e79]">
                <span>Remaining pool ({formatLifeHours(monthlyPoolHours)})</span>
                <span className="font-mono">
                  {formatCurrency(remainingMonthlyGuiltFree, base, currencies)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* METRIC 2: BLENDED NET WORTH & RUNWAY */}
        <div className="flex flex-col justify-between p-5 lg:col-span-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-[#a1a1aa]">
                Net worth &amp; runway
              </span>
              <span className="font-mono text-[12px] text-[#78b090] tabular-nums">
                {monthlyBurnBase > 0
                  ? `${runwayMonths.toFixed(1)} months (${runwayYears.toFixed(1)} yrs)`
                  : 'Set burn rate'}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-2xl font-medium tracking-tight text-white sm:text-3xl tabular-nums">
                {hoursPrimary
                  ? formatLifeHours(totalNetWorthLifeHours, {
                      suffix: 'hrs saved',
                    })
                  : formatCurrency(totalBlendedNetWorthBase, base, currencies, {
                      decimals: 0,
                    })}
              </span>
              {!currencyPrimary && (
                <span className="font-mono text-[12px] text-[#8a8f98] tabular-nums">
                  {hoursPrimary
                    ? `(${formatCurrency(totalBlendedNetWorthBase, base, currencies, { decimals: 0 })})`
                    : `· ${formatLifeHours(totalNetWorthLifeHours, { suffix: 'hrs' })}`}
                </span>
              )}
            </div>

            <p className="mt-1.5 text-[12px] leading-relaxed text-[#71717a]">
              {formatCurrency(liquidNetWorthBase, base, currencies, {
                decimals: 0,
              })}{' '}
              liquid ex-tax across {accounts.length} currencies
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3 text-[12px] text-[#8a8f98]">
            <span>{profile.locationName} burn</span>
            <span className="font-mono text-[#d4d4d8] tabular-nums">
              {formatCurrency(monthlyBurnBase, base, currencies, {
                decimals: 0,
              })}
              /mo
            </span>
          </div>
        </div>

        {/* METRIC 3: SEGREGATED TAX RESERVE */}
        <div className="flex flex-col justify-between p-5 lg:col-span-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-[#a1a1aa]">
                Tax reserve ({profile.taxBufferPercent}%)
              </span>
              <button
                type="button"
                onClick={onOpenTaxExport}
                className="text-[12px] text-[#8a8f98] underline decoration-white/20 underline-offset-2 hover:text-white"
              >
                Export
              </button>
            </div>

            <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-2xl font-medium tracking-tight text-white sm:text-3xl tabular-nums">
                {hoursPrimary
                  ? formatLifeHours(taxReserveLifeHours)
                  : formatCurrency(
                      totalPartitionedTaxReserveBase,
                      base,
                      currencies,
                      { decimals: 0 }
                    )}
              </span>
              {!currencyPrimary && (
                <span className="font-mono text-[12px] text-[#8a8f98] tabular-nums">
                  {hoursPrimary
                    ? `(${formatCurrency(totalPartitionedTaxReserveBase, base, currencies, { decimals: 0 })})`
                    : `· ${formatLifeHours(taxReserveLifeHours)}`}
                </span>
              )}
            </div>

            <p className="mt-1.5 text-[12px] leading-relaxed text-[#71717a]">
              Held aside from{' '}
              {formatCurrency(totalBizRevenueBase, base, currencies, {
                decimals: 0,
              })}{' '}
              business income
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3 text-[12px]">
            <span className="text-[#8a8f98]">Write-off savings</span>
            <span className="font-mono text-[#78b090] tabular-nums">
              +{formatCurrency(taxShieldSavingsBase, base, currencies)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
