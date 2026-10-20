import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useLedgerStore } from '../store/useLedgerStore';
import {
  computeNetHourlyRate,
  convertCurrency,
  formatCurrency,
} from '../utils/currency';
import { CurrencyCode, FixedCommitment } from '../types/ledger';

interface ProfileConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileConfigModal: React.FC<ProfileConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    profile,
    currencies,
    commitments,
    updateProfile,
    addCommitment,
    toggleCommitment,
    deleteCommitment,
  } = useLedgerStore();

  const [newVaultName, setNewVaultName] = useState('');
  const [newVaultAmount, setNewVaultAmount] = useState('');
  const [newVaultCurrency, setNewVaultCurrency] = useState<CurrencyCode>(
    profile.baseCurrency
  );
  const [newVaultCategory, setNewVaultCategory] =
    useState<FixedCommitment['category']>('investment');

  if (!isOpen) return null;

  const base = profile.baseCurrency;
  const hourlyRate = computeNetHourlyRate(profile);

  const taxDeduction =
    profile.monthlyGrossIncome * (profile.taxBufferPercent / 100);
  const fixedTotalBase = commitments
    .filter((c) => c.active)
    .reduce(
      (sum, c) =>
        sum + convertCurrency(c.amount, c.currency, base, currencies),
      0
    );
  const guiltFreePool =
    profile.monthlyGrossIncome - taxDeduction - fixedTotalBase;
  const dailySafeAllowance = guiltFreePool / 30.4375;

  const handleAddVault = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newVaultAmount);
    if (!newVaultName.trim() || isNaN(amt) || amt <= 0) return;

    addCommitment({
      name: newVaultName.trim(),
      amount: amt,
      currency: newVaultCurrency,
      category: newVaultCategory,
      active: true,
    });

    setNewVaultName('');
    setNewVaultAmount('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#121417] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.07] pb-4">
          <div>
            <h2
              id="config-modal-title"
              className="text-base font-medium text-white"
            >
              Work Rate, Reverse Budget &amp; Commitments
            </h2>
            <p className="mt-0.5 text-[12px] text-[#8a8f98]">
              Changes automatically recalculate your hourly rate, safe daily
              allowance, and cooling-off durations.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-[#181a1f] p-1.5 text-[#8a8f98] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* SECTION 1: NET HOURLY RATE */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0c0d0f] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-[13px] font-medium text-white">
                  Net Hourly Rate
                </h3>
                <p className="text-[11px] text-[#71717a]">
                  Monthly Net Income ÷ (Weekly Hours × 4.33)
                </p>
              </div>
              <div className="font-mono text-sm font-medium text-[#c4a468]">
                {formatCurrency(hourlyRate, base, currencies)} / hr
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="monthly-net-input"
                  className="block text-[12px] text-[#a1a1aa]"
                >
                  Net monthly income ({base})
                </label>
                <input
                  id="monthly-net-input"
                  name="monthlyNetIncome"
                  type="number"
                  min="100"
                  step="100"
                  value={profile.monthlyNetIncome}
                  onChange={(e) =>
                    updateProfile({
                      monthlyNetIncome: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#14161a] px-3 py-1.5 font-mono text-sm text-white focus:border-white/25 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="weekly-hours-input"
                  className="block text-[12px] text-[#a1a1aa]"
                >
                  Weekly work hours
                </label>
                <input
                  id="weekly-hours-input"
                  name="weeklyWorkHours"
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={profile.weeklyWorkHours}
                  onChange={(e) =>
                    updateProfile({
                      weeklyWorkHours: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#14161a] px-3 py-1.5 font-mono text-sm text-white focus:border-white/25 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: REVERSE BUDGET & FIXED COMMITMENTS */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0c0d0f] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-[13px] font-medium text-white">
                  Reverse Budget &amp; Fixed Commitments
                </h3>
                <p className="text-[11px] text-[#71717a]">
                  Gross − Tax Buffer − Fixed Commitments = Guilt-Free Pool
                </p>
              </div>
              <div className="font-mono text-sm font-medium text-[#78b090]">
                {formatCurrency(dailySafeAllowance, base, currencies)}/day safe
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="monthly-gross-input"
                  className="block text-[12px] text-[#a1a1aa]"
                >
                  Gross monthly ({base})
                </label>
                <input
                  id="monthly-gross-input"
                  name="monthlyGrossIncome"
                  type="number"
                  min="0"
                  step="100"
                  value={profile.monthlyGrossIncome}
                  onChange={(e) =>
                    updateProfile({
                      monthlyGrossIncome: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#14161a] px-3 py-1.5 font-mono text-sm text-white focus:border-white/25 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="tax-buffer-input"
                  className="block text-[12px] text-[#a1a1aa]"
                >
                  Tax set-aside %
                </label>
                <input
                  id="tax-buffer-input"
                  name="taxBufferPercent"
                  type="number"
                  min="0"
                  max="65"
                  step="1"
                  value={profile.taxBufferPercent}
                  onChange={(e) =>
                    updateProfile({
                      taxBufferPercent: Math.min(
                        65,
                        Math.max(0, Number(e.target.value))
                      ),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#14161a] px-3 py-1.5 font-mono text-sm text-white focus:border-white/25 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="location-burn-input"
                  className="block text-[12px] text-[#a1a1aa]"
                >
                  Location burn ({base}/mo)
                </label>
                <input
                  id="location-burn-input"
                  name="locationBurnRateMonthly"
                  type="number"
                  min="100"
                  step="50"
                  value={profile.locationBurnRateMonthly}
                  onChange={(e) =>
                    updateProfile({
                      locationBurnRateMonthly: Math.max(
                        100,
                        Number(e.target.value)
                      ),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#14161a] px-3 py-1.5 font-mono text-sm text-white focus:border-white/25 focus:outline-none"
                />
              </div>
            </div>

            {/* Commitments List */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[12px] text-[#a1a1aa]">
                <span>Monthly commitments (rent, investments, insurance)</span>
                <span className="font-mono text-white">
                  {formatCurrency(fixedTotalBase, base, currencies)}/mo
                </span>
              </div>

              <div className="space-y-1.5">
                {commitments.map((c) => {
                  const inBase = convertCurrency(
                    c.amount,
                    c.currency,
                    base,
                    currencies
                  );
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-[12px] ${
                        c.active
                          ? 'border-white/[0.07] bg-[#14161a] text-[#ededef]'
                          : 'border-white/[0.04] bg-[#14161a]/40 text-[#63666e] line-through'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleCommitment(c.id)}
                        className="flex items-center gap-2 text-left"
                      >
                        {c.active ? (
                          <CheckSquare className="h-3.5 w-3.5 text-[#78b090]" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-[#52525b]" />
                        )}
                        <span>{c.name}</span>
                      </button>

                      <div className="flex items-center gap-3 font-mono">
                        <span>
                          {formatCurrency(c.amount, c.currency, currencies, {
                            decimals: 0,
                          })}
                          {c.currency !== base &&
                            ` (${formatCurrency(inBase, base, currencies, { decimals: 0 })})`}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteCommitment(c.id)}
                          className="text-[#52525b] hover:text-[#e16d6d]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleAddVault}
                className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-12"
              >
                <input
                  id="new-commitment-name"
                  name="commitmentName"
                  type="text"
                  value={newVaultName}
                  onChange={(e) => setNewVaultName(e.target.value)}
                  placeholder="Add commitment..."
                  className="rounded-lg border border-white/[0.08] bg-[#14161a] px-3 py-1.5 text-[12px] text-white sm:col-span-5"
                />
                <input
                  id="new-commitment-amount"
                  name="commitmentAmount"
                  type="number"
                  step="1"
                  min="1"
                  value={newVaultAmount}
                  onChange={(e) => setNewVaultAmount(e.target.value)}
                  placeholder="Amount"
                  className="rounded-lg border border-white/[0.08] bg-[#14161a] px-2.5 py-1.5 font-mono text-[12px] text-white sm:col-span-2"
                />
                <select
                  id="new-commitment-currency"
                  name="commitmentCurrency"
                  value={newVaultCurrency}
                  onChange={(e) =>
                    setNewVaultCurrency(e.target.value as CurrencyCode)
                  }
                  className="rounded-lg border border-white/[0.08] bg-[#14161a] px-2 py-1.5 font-mono text-[12px] text-[#d4d4d8] sm:col-span-2"
                >
                  {Object.keys(currencies).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  id="new-commitment-category"
                  name="commitmentCategory"
                  value={newVaultCategory}
                  onChange={(e) =>
                    setNewVaultCategory(
                      e.target.value as FixedCommitment['category']
                    )
                  }
                  className="rounded-lg border border-white/[0.08] bg-[#14161a] px-2 py-1.5 text-[12px] text-[#d4d4d8] sm:col-span-2"
                >
                  <option value="housing">Housing</option>
                  <option value="investment">Invest</option>
                  <option value="debt">Debt</option>
                  <option value="insurance">Insurance</option>
                  <option value="infrastructure">Infra</option>
                </select>
                <button
                  type="submit"
                  className="flex items-center justify-center rounded-lg bg-[#ededef] px-3 py-1.5 text-xs font-medium text-[#0c0d0f] hover:bg-white sm:col-span-1"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* SECTION 3: COOLDOWN MULTIPLIER */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#0c0d0f] p-4">
            <div>
              <h3 className="text-[13px] font-medium text-white">
                Cooling-Off Multiplier
              </h3>
              <p className="text-[11px] text-[#71717a]">
                Hours of waiting time per 1 hour of work required
              </p>
            </div>

            <div className="flex items-center gap-1 font-mono text-xs">
              {[0.5, 1.0, 2.0, 4.0, 24.0].map((mult) => (
                <button
                  key={mult}
                  type="button"
                  onClick={() => updateProfile({ cooldownMultiplier: mult })}
                  className={`rounded-md border px-2.5 py-1 transition ${
                    profile.cooldownMultiplier === mult
                      ? 'border-white/30 bg-white/[0.1] text-white'
                      : 'border-white/[0.07] bg-[#14161a] text-[#8a8f98] hover:text-white'
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end border-t border-white/[0.07] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#ededef] px-4 py-1.5 text-[12px] font-medium text-[#0c0d0f] transition hover:bg-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
