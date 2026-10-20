import React from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useLedgerStore } from '../store/useLedgerStore';
import { WorkspaceSection } from './HeaderBar';

interface InstructionsPageProps {
  onOpenConfig: () => void;
  onOpenTaxExport: () => void;
  onNavigateSection: (section: WorkspaceSection) => void;
}

export const InstructionsPage: React.FC<InstructionsPageProps> = ({
  onOpenConfig,
  onOpenTaxExport,
  onNavigateSection,
}) => {
  const { profile, accounts, transactions } = useLedgerStore();

  const hasConfiguredIncome =
    profile.monthlyNetIncome > 0 || profile.monthlyGrossIncome > 0;
  const hasAddedAccount = accounts.length > 0;
  const hasLoggedTransaction = transactions.length > 0;

  return (
    <div className="space-y-6">
      {/* Intro & Live Setup Checklist */}
      <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-6">
        <div className="max-w-2xl">
          <h1 className="text-lg font-medium text-white">
            Getting Started &amp; User Guide
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#a1a1aa]">
            Equinox is a local-first financial ledger designed for solopreneurs
            and cross-border earners. All data is stored privately in your
            browser&apos;s local storage — nothing is sent to external servers.
          </p>
        </div>

        {/* 3-Step Quick Onboarding Checklist */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col justify-between rounded-lg border border-white/[0.07] bg-[#0c0d0f] p-4">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-medium text-white">
                {hasConfiguredIncome ? (
                  <CheckCircle2 className="h-4 w-4 text-[#78b090] shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-[#71717a] shrink-0" />
                )}
                <span>1. Set Income &amp; Hours</span>
              </div>
              <p className="mt-1.5 text-[12px] text-[#71717a]">
                Enter your monthly net/gross income, weekly work hours, and
                fixed monthly commitments.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenConfig}
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[#d4d4d8] hover:text-white"
            >
              <span>Configure rate &amp; budget</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-white/[0.07] bg-[#0c0d0f] p-4">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-medium text-white">
                {hasAddedAccount ? (
                  <CheckCircle2 className="h-4 w-4 text-[#78b090] shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-[#71717a] shrink-0" />
                )}
                <span>2. Add Accounts &amp; Burn</span>
              </div>
              <p className="mt-1.5 text-[12px] text-[#71717a]">
                Add your bank or FX accounts (USD, EUR, GBP, TRY, CHF, JPY) and
                set your monthly living burn rate.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('fx')}
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[#d4d4d8] hover:text-white"
            >
              <span>Manage accounts &amp; FX</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-white/[0.07] bg-[#0c0d0f] p-4">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-medium text-white">
                {hasLoggedTransaction ? (
                  <CheckCircle2 className="h-4 w-4 text-[#78b090] shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-[#71717a] shrink-0" />
                )}
                <span>3. Log via Command Bar</span>
              </div>
              <p className="mt-1.5 text-[12px] text-[#71717a]">
                Press <kbd className="font-mono text-[#d4d4d8]">⌘K</kbd> or{' '}
                <kbd className="font-mono text-[#d4d4d8]">Ctrl+K</kbd> anywhere
                to log transactions in plain shorthand.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('overview')}
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[#d4d4d8] hover:text-white"
            >
              <span>Go to Overview</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Command Bar Shorthand Guide */}
      <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-6">
        <h2 className="text-[15px] font-medium text-white">
          Quick-Entry Command Bar Syntax (<code className="font-mono text-xs">⌘K</code> /{' '}
          <code className="font-mono text-xs">Ctrl+K</code>)
        </h2>
        <p className="mt-1 text-[13px] text-[#8a8f98]">
          Type natural shorthand in any word order. Equinox automatically
          extracts the description, amount, currency, payment method, and
          personal vs. business classification.
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-white/[0.07] bg-[#0c0d0f]">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.07] text-[#71717a]">
                <th className="px-4 py-2.5 font-medium">What you type</th>
                <th className="px-4 py-2.5 font-medium">Parsed Result</th>
                <th className="px-4 py-2.5 font-medium">Automatic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-[#d4d4d8]">
              <tr>
                <td className="px-4 py-3 font-mono text-white whitespace-nowrap">
                  lunch 18 card
                </td>
                <td className="px-4 py-3">
                  Amount: <span className="font-mono">18</span> · Category:{' '}
                  <span className="text-white">Dining</span> · Personal · Card
                </td>
                <td className="px-4 py-3 text-[#8a8f98]">
                  Deducts from today&apos;s safe-to-spend allowance and displays
                  equivalent work hours.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-white whitespace-nowrap">
                  client retainer 1500 usd biz
                </td>
                <td className="px-4 py-3">
                  Amount: <span className="font-mono">$1,500 USD</span> ·{' '}
                  <span className="text-[#78b090]">Business Income</span> · Wire
                </td>
                <td className="px-4 py-3 text-[#8a8f98]">
                  Automatically partitions your tax buffer % into the
                  untouchable <strong>Tax Reserve</strong> before updating
                  liquid runway.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-white whitespace-nowrap">
                  software sub 45 eur tax
                </td>
                <td className="px-4 py-3">
                  Amount: <span className="font-mono">€45 EUR</span> ·{' '}
                  <span className="text-white">Business · Tax Write-Off</span>
                </td>
                <td className="px-4 py-3 text-[#8a8f98]">
                  Logs as a tax-deductible business expense and calculates your
                  marginal tax savings.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-white whitespace-nowrap">
                  studio display 1899 usd cooldown
                </td>
                <td className="px-4 py-3">
                  Amount: <span className="font-mono">$1,899 USD</span> ·{' '}
                  <span className="text-[#c4a468]">Cooling-Off List</span>
                </td>
                <td className="px-4 py-3 text-[#8a8f98]">
                  Sends item to the Cooling-Off List with a countdown timer
                  proportional to the work hours required.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recognized Keywords Reference */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4 text-[12px]">
          <div className="rounded-lg border border-white/[0.06] bg-[#0c0d0f] p-3">
            <div className="font-medium text-white">Currencies</div>
            <p className="mt-1 font-mono text-[11px] text-[#8a8f98]">
              usd ($), eur (€), gbp (£), try / tl (₺), chf, jpy (¥)
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#0c0d0f] p-3">
            <div className="font-medium text-white">Firewall Tags</div>
            <p className="mt-1 font-mono text-[11px] text-[#8a8f98]">
              biz, business, tax, deductible, writeoff, personal
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#0c0d0f] p-3">
            <div className="font-medium text-white">Income Keywords</div>
            <p className="mt-1 font-mono text-[11px] text-[#8a8f98]">
              retainer, invoice, income, revenue, payout, salary, +amount
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#0c0d0f] p-3">
            <div className="font-medium text-white">Payment &amp; Cooldown</div>
            <p className="mt-1 font-mono text-[11px] text-[#8a8f98]">
              card, wire, ach, cash, wise, revolut · cooldown, wait, hold
            </p>
          </div>
        </div>
      </section>

      {/* Core Methodologies Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* 1. Net Hourly Earning Engine */}
        <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
          <h3 className="text-[14px] font-medium text-white">
            1. Net Hourly Earning Engine &amp; Life-Hours
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#8a8f98]">
            Instead of viewing prices purely in nominal currency, Equinox
            calculates your true net hourly rate:
          </p>
          <div className="my-3 rounded-lg border border-white/[0.06] bg-[#0c0d0f] px-3.5 py-2.5 font-mono text-[12px] text-[#ededef]">
            Hourly Rate = Monthly Net Income ÷ (Weekly Work Hours × 4.33)
          </div>
          <p className="text-[12px] leading-relaxed text-[#8a8f98]">
            Every transaction and budget figure displays both its currency
            amount and the <strong>Life Hours</strong> required to earn it. Use
            the display switcher in the sidebar (<code className="font-mono">Both</code>,{' '}
            <code className="font-mono">$ Only</code>,{' '}
            <code className="font-mono">Hours</code>) to flip the primary view.
          </p>
        </section>

        {/* 2. Reverse Budgeting & Guilt-Free Pool */}
        <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
          <h3 className="text-[14px] font-medium text-white">
            2. Reverse Budgeting &amp; The Guilt-Free Number
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#8a8f98]">
            Traditional category budgets fail because they require micro-policing
            every coffee. Reverse budgeting automates your obligations first:
          </p>
          <div className="my-3 rounded-lg border border-white/[0.06] bg-[#0c0d0f] px-3.5 py-2.5 font-mono text-[12px] text-[#ededef]">
            Gross Income − Tax Set-Aside % − Fixed Commitments = Guilt-Free Pool
          </div>
          <p className="text-[12px] leading-relaxed text-[#8a8f98]">
            The remainder is divided into your real-time{' '}
            <strong>Safe to spend today</strong> (or weekly) allowance. As long
            as this pool stays positive, granular category tracking is strictly
            optional.
          </p>
        </section>

        {/* 3. Solo-Biz vs. Personal Firewall */}
        <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
          <h3 className="text-[14px] font-medium text-white">
            3. Solo-Biz vs. Personal Cash Flow Firewall
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#8a8f98]">
            Every transaction is tagged as either <code className="font-mono text-white">Personal</code> or{' '}
            <code className="font-mono text-white">Business · Tax</code>:
          </p>
          <ul className="mt-2.5 space-y-1.5 text-[12px] text-[#8a8f98] list-disc pl-4">
            <li>
              <strong>Incoming Business Revenue:</strong> Automatically locks
              your configured tax percentage (e.g., 25–30%) into the{' '}
              <strong>Tax Reserve</strong> so you never accidentally spend tax
              money.
            </li>
            <li>
              <strong>Business Expenses:</strong> Tracked as tax write-offs with
              live marginal tax shield calculations.
            </li>
            <li>
              <strong>1-Click Reclassification &amp; Export:</strong> Click any
              transaction&apos;s classification tag in the ledger to switch it,
              or click{' '}
              <button
                type="button"
                onClick={onOpenTaxExport}
                className="text-white underline decoration-white/30 underline-offset-2"
              >
                Tax Export
              </button>{' '}
              to download filtered CSV/JSON summaries.
            </li>
          </ul>
        </section>

        {/* 4. Cooling-Off List & Multi-Currency Runway */}
        <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
          <h3 className="text-[14px] font-medium text-white">
            4. Cooling-Off List &amp; Multi-Currency Runway
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#8a8f98]">
            <strong>Cooling-Off List:</strong> Log prospective high-ticket
            purchases into the Cooling-Off List instead of buying immediately.
            Equinox enforces a countdown timer equal to{' '}
            <code className="font-mono text-white">
              Life Hours Required × Multiplier
            </code>
            . Skipping an item records the money and work hours you preserved.
          </p>
          <p className="mt-2.5 text-[12px] leading-relaxed text-[#8a8f98]">
            <strong>Multi-Currency Runway:</strong> Hold balances across{' '}
            <code className="font-mono">USD</code>, <code className="font-mono">EUR</code>,{' '}
            <code className="font-mono">GBP</code>, <code className="font-mono">TRY</code>,{' '}
            <code className="font-mono">CHF</code>, and <code className="font-mono">JPY</code>.
            Your liquid net worth (excluding tax reserves) is compared against
            your monthly burn rate to display your living runway in months.
          </p>
        </section>
      </div>

      {/* Privacy & Data Sovereignty Footer (Microsoft Store Policy 10.5.1) */}
      <section className="rounded-xl border border-white/[0.08] bg-[#121417] p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-[14px] font-medium text-white">
              Privacy Policy &amp; Local Data Sovereignty
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-[#8a8f98]">
              Equinox Ledger stores 100% of your financial data locally on your
              device (<code className="font-mono">localStorage</code> or local{' '}
              <code className="font-mono">.equinox.json</code> files). Zero
              cloud telemetry, zero tracking, and zero third-party data sharing.
            </p>
          </div>
          <a
            href="./privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-white/[0.1] bg-[#181a1f] px-3.5 py-2 text-[12px] font-medium text-white transition hover:bg-white/[0.1]"
          >
            View Privacy Policy
          </a>
        </div>
      </section>
    </div>
  );
};
