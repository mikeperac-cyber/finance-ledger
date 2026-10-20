import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Account,
  CooldownItem,
  CurrencyCode,
  CurrencyConfig,
  FinancialProfile,
  FirewallType,
  FixedCommitment,
  PaymentMethod,
  Transaction,
  TransactionDirection,
} from '../types/ledger';
import {
  computeLifeHours,
  convertCurrency,
  DEFAULT_CURRENCIES,
} from '../utils/currency';

const now = Date.now();
const todayISO = new Date(now).toISOString();
const yesterdayISO = new Date(now - 86400 * 1000).toISOString();
const twoDaysAgoISO = new Date(now - 2 * 86400 * 1000).toISOString();
const threeDaysAgoISO = new Date(now - 3 * 86400 * 1000).toISOString();
const fiveDaysAgoISO = new Date(now - 5 * 86400 * 1000).toISOString();
const sevenDaysAgoISO = new Date(now - 7 * 86400 * 1000).toISOString();

export const INITIAL_PROFILE: FinancialProfile = {
  monthlyGrossIncome: 14500,
  monthlyNetIncome: 10500,
  weeklyWorkHours: 35,
  taxBufferPercent: 28,
  baseCurrency: 'USD',
  locationBurnRateMonthly: 4650,
  locationName: 'Lisbon / EU Hub',
  cooldownMultiplier: 1.0, // 1 hour cooldown per 1 work hour required
  displayMode: 'dual',
};

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-mercury-usd',
    name: 'Mercury Operating Checking',
    institution: 'Mercury Bank (US)',
    currency: 'USD',
    balance: 48250.0,
    type: 'checking',
    isBusiness: true,
  },
  {
    id: 'acc-wise-eur',
    name: 'Wise Borderless EUR',
    institution: 'Wise Europe SA',
    currency: 'EUR',
    balance: 19400.0,
    type: 'fx-wallet',
    isBusiness: false,
  },
  {
    id: 'acc-revolut-gbp',
    name: 'Revolut Metal Vault',
    institution: 'Revolut UK',
    currency: 'GBP',
    balance: 11200.0,
    type: 'fx-wallet',
    isBusiness: false,
  },
  {
    id: 'acc-garanti-try',
    name: 'Garanti BBVA Local Settlement',
    institution: 'Garanti BBVA',
    currency: 'TRY',
    balance: 185400.0,
    type: 'checking',
    isBusiness: false,
  },
];

export const INITIAL_COMMITMENTS: FixedCommitment[] = [
  {
    id: 'fix-rent',
    name: 'Loft Lease & Utilities (Lisbon)',
    amount: 1750,
    currency: 'EUR',
    category: 'housing',
    active: true,
  },
  {
    id: 'fix-etf',
    name: 'Vanguard VWCE Auto-Invest Vault',
    amount: 2200,
    currency: 'USD',
    category: 'investment',
    active: true,
  },
  {
    id: 'fix-health',
    name: 'Cigna Global Health & Sovereign Cover',
    amount: 340,
    currency: 'USD',
    category: 'insurance',
    active: true,
  },
  {
    id: 'fix-infra',
    name: 'Core Fiber, Security & Cold Backup Vault',
    amount: 195,
    currency: 'EUR',
    category: 'infrastructure',
    active: true,
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    date: todayISO,
    title: 'Specialty Pour-Over & Matcha',
    amount: 18.5,
    currency: 'EUR',
    direction: 'expense',
    firewall: 'personal',
    isTaxDeductible: false,
    category: 'Dining',
    accountId: 'acc-wise-eur',
    method: 'card',
    taxReservedAmount: 0,
    notes: 'Copenhagen Coffee Lab',
  },
  {
    id: 'tx-2',
    date: todayISO,
    title: 'Q4 Systems Architecture Retainer',
    amount: 6500.0,
    currency: 'USD',
    direction: 'income',
    firewall: 'business',
    isTaxDeductible: false,
    category: 'Client Revenue',
    accountId: 'acc-mercury-usd',
    method: 'wire',
    taxReservedAmount: 1820.0, // 28% auto-partitioned into tax reserve
    notes: 'Auto-partitioned 28% ($1,820.00) into Tax Reserve',
  },
  {
    id: 'tx-3',
    date: yesterdayISO,
    title: 'Anthropic Claude API & Cursor Pro Cluster',
    amount: 145.0,
    currency: 'USD',
    direction: 'expense',
    firewall: 'business',
    isTaxDeductible: true,
    category: 'Software & SaaS',
    accountId: 'acc-mercury-usd',
    method: 'card',
    taxReservedAmount: 0,
    notes: '100% R&D Tooling Tax Write-Off',
  },
  {
    id: 'tx-4',
    date: twoDaysAgoISO,
    title: 'Bosphorus Seafood Dinner w/ Friends',
    amount: 2450.0,
    currency: 'TRY',
    direction: 'expense',
    firewall: 'personal',
    isTaxDeductible: false,
    category: 'Dining',
    accountId: 'acc-garanti-try',
    method: 'card',
    taxReservedAmount: 0,
    notes: 'Karaköy Lokantası',
  },
  {
    id: 'tx-5',
    date: threeDaysAgoISO,
    title: 'Fintech Audit & Security Review Milestone',
    amount: 3200.0,
    currency: 'GBP',
    direction: 'income',
    firewall: 'business',
    isTaxDeductible: false,
    category: 'Client Revenue',
    accountId: 'acc-revolut-gbp',
    method: 'wire',
    taxReservedAmount: 896.0, // 28% of 3200 GBP
    notes: 'Canary Wharf Advisory Ltd',
  },
  {
    id: 'tx-6',
    date: fiveDaysAgoISO,
    title: 'Vercel Pro + AWS Route53 Production Infra',
    amount: 84.0,
    currency: 'EUR',
    direction: 'expense',
    firewall: 'business',
    isTaxDeductible: true,
    category: 'Software & SaaS',
    accountId: 'acc-wise-eur',
    method: 'card',
    taxReservedAmount: 0,
    notes: 'Monthly cloud hosting invoice',
  },
  {
    id: 'tx-7',
    date: fiveDaysAgoISO,
    title: 'Organic Farmers Market & Olive Oil',
    amount: 92.4,
    currency: 'EUR',
    direction: 'expense',
    firewall: 'personal',
    isTaxDeductible: false,
    category: 'Groceries',
    accountId: 'acc-wise-eur',
    method: 'card',
    taxReservedAmount: 0,
  },
  {
    id: 'tx-8',
    date: sevenDaysAgoISO,
    title: 'International Tax CPA Quarterly Filing',
    amount: 420.0,
    currency: 'USD',
    direction: 'expense',
    firewall: 'business',
    isTaxDeductible: true,
    category: 'Workspace & Ops',
    accountId: 'acc-mercury-usd',
    method: 'ach',
    taxReservedAmount: 0,
    notes: 'Cross-border compliance advisory',
  },
];

export const INITIAL_COOLDOWN_ITEMS: CooldownItem[] = [
  {
    id: 'cool-1',
    title: 'Apple Studio Display 27" Nano-Texture',
    amount: 1899,
    currency: 'USD',
    category: 'Hardware & Gear',
    firewall: 'business',
    createdAt: now - 12 * 3600 * 1000, // Started 12h ago
    durationMs: 27.4 * 3600 * 1000, // 27.4 hours total cooldown (15.4h left)
    multiplierUsed: 1.0,
    lifeHoursRequired: 27.4,
    status: 'cooling',
    notes: 'Evaluating if current 4K OLED monitor is sufficient for Q4.',
  },
  {
    id: 'cool-2',
    title: 'Teenage Engineering OP-1 Field Synthesizer',
    amount: 1999,
    currency: 'EUR',
    category: 'Lifestyle',
    firewall: 'personal',
    createdAt: now - 32 * 3600 * 1000, // Already completed cooldown! Ready for decision
    durationMs: 31.3 * 3600 * 1000,
    multiplierUsed: 1.0,
    lifeHoursRequired: 31.3,
    status: 'cooling',
    notes: 'Cooldown complete — ready to Approve or Dismiss & Save.',
  },
  {
    id: 'cool-3',
    title: 'Rimowa Original Cabin Titanium Carry-On',
    amount: 1450,
    currency: 'EUR',
    category: 'Travel & Transit',
    firewall: 'personal',
    createdAt: now - 2 * 3600 * 1000, // Started 2h ago
    durationMs: 22.7 * 3600 * 1000,
    multiplierUsed: 1.0,
    lifeHoursRequired: 22.7,
    status: 'cooling',
    notes: 'Impulse after Lisbon flight boarding.',
  },
  {
    id: 'cool-4',
    title: 'Custom Split Mechanical Keyboard Build',
    amount: 640,
    currency: 'USD',
    category: 'Hardware & Gear',
    firewall: 'personal',
    createdAt: now - 96 * 3600 * 1000,
    durationMs: 9.2 * 3600 * 1000,
    multiplierUsed: 1.0,
    lifeHoursRequired: 9.2,
    status: 'dismissed',
    resolvedAt: now - 72 * 3600 * 1000,
    notes: 'Dismissed after cooling period — saved 9.2 life hours.',
  },
];

interface AddTransactionInput {
  title: string;
  amount: number;
  currency: CurrencyCode;
  direction: TransactionDirection;
  firewall: FirewallType;
  isTaxDeductible?: boolean;
  category: string;
  accountId?: string;
  method: PaymentMethod;
  date?: string;
  notes?: string;
}

interface AddCooldownInput {
  title: string;
  amount: number;
  currency: CurrencyCode;
  category?: string;
  firewall?: FirewallType;
  notes?: string;
}

interface LedgerState {
  profile: FinancialProfile;
  currencies: Record<CurrencyCode, CurrencyConfig>;
  accounts: Account[];
  commitments: FixedCommitment[];
  transactions: Transaction[];
  cooldownItems: CooldownItem[];

  // Profile & Settings Actions
  updateProfile: (patch: Partial<FinancialProfile>) => void;
  setBaseCurrency: (currency: CurrencyCode) => void;
  updateExchangeRate: (currency: CurrencyCode, ratePerUSD: number) => void;
  simulateFxTick: () => void;

  // Transaction Actions
  addTransaction: (input: AddTransactionInput) => Transaction;
  deleteTransaction: (id: string) => void;
  toggleTransactionFirewall: (id: string) => void;

  // Account Actions
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccountBalance: (id: string, balance: number) => void;
  deleteAccount: (id: string) => void;

  // Fixed Commitment Actions
  addCommitment: (commitment: Omit<FixedCommitment, 'id'>) => void;
  toggleCommitment: (id: string) => void;
  deleteCommitment: (id: string) => void;

  // Cooldown Chamber Actions
  addCooldownItem: (input: AddCooldownInput) => CooldownItem;
  approveCooldownItem: (id: string) => void;
  dismissCooldownItem: (id: string) => void;
  fastForwardCooldownItem: (id: string) => void;
  deleteCooldownItem: (id: string) => void;

  // System Actions
  resetToDemoData: () => void;
}

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      profile: INITIAL_PROFILE,
      currencies: DEFAULT_CURRENCIES,
      accounts: INITIAL_ACCOUNTS,
      commitments: INITIAL_COMMITMENTS,
      transactions: INITIAL_TRANSACTIONS,
      cooldownItems: INITIAL_COOLDOWN_ITEMS,

      updateProfile: (patch) =>
        set((state) => ({
          profile: { ...state.profile, ...patch },
        })),

      setBaseCurrency: (newBase) =>
        set((state) => {
          const oldBase = state.profile.baseCurrency;
          if (oldBase === newBase) return state;

          const convertedGross = Math.round(
            convertCurrency(
              state.profile.monthlyGrossIncome,
              oldBase,
              newBase,
              state.currencies
            )
          );
          const convertedNet = Math.round(
            convertCurrency(
              state.profile.monthlyNetIncome,
              oldBase,
              newBase,
              state.currencies
            )
          );
          const convertedBurn = Math.round(
            convertCurrency(
              state.profile.locationBurnRateMonthly,
              oldBase,
              newBase,
              state.currencies
            )
          );

          return {
            profile: {
              ...state.profile,
              baseCurrency: newBase,
              monthlyGrossIncome: convertedGross,
              monthlyNetIncome: convertedNet,
              locationBurnRateMonthly: convertedBurn,
            },
          };
        }),

      updateExchangeRate: (currency, ratePerUSD) =>
        set((state) => {
          if (currency === 'USD' || ratePerUSD <= 0) return state;
          return {
            currencies: {
              ...state.currencies,
              [currency]: {
                ...state.currencies[currency],
                ratePerUSD,
              },
            },
          };
        }),

      simulateFxTick: () =>
        set((state) => {
          const nextCurrencies = { ...state.currencies };
          (Object.keys(nextCurrencies) as CurrencyCode[]).forEach((code) => {
            if (code === 'USD') return;
            const current = nextCurrencies[code].ratePerUSD;
            // Subtle +/- 0.6% market tick
            const deltaPercent = (Math.random() - 0.48) * 0.012;
            const updated = Number(
              Math.max(0.01, current * (1 + deltaPercent)).toFixed(
                code === 'TRY' || code === 'JPY' ? 2 : 4
              )
            );
            nextCurrencies[code] = {
              ...nextCurrencies[code],
              ratePerUSD: updated,
            };
          });
          return { currencies: nextCurrencies };
        }),

      addTransaction: (input) => {
        const state = get();
        // Match an account with the same currency, or fallback to first account
        const matchingAccount =
          state.accounts.find((a) => a.id === input.accountId) ||
          state.accounts.find(
            (a) =>
              a.currency === input.currency &&
              (input.firewall === 'business' ? a.isBusiness : !a.isBusiness)
          ) ||
          state.accounts.find((a) => a.currency === input.currency) ||
          state.accounts[0];

        const accountId = matchingAccount ? matchingAccount.id : 'acc-mercury-usd';

        const isBizIncome =
          input.firewall === 'business' && input.direction === 'income';
        const taxReservedAmount = isBizIncome
          ? Number(
              (input.amount * (state.profile.taxBufferPercent / 100)).toFixed(2)
            )
          : 0;

        const isTaxDeductible =
          input.isTaxDeductible !== undefined
            ? input.isTaxDeductible
            : input.firewall === 'business' && input.direction === 'expense';

        const newTx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: input.date || new Date().toISOString(),
          title: input.title,
          amount: input.amount,
          currency: input.currency,
          direction: input.direction,
          firewall: input.firewall,
          isTaxDeductible,
          category: input.category,
          accountId,
          method: input.method,
          taxReservedAmount,
          notes:
            input.notes ||
            (isBizIncome
              ? `Auto-partitioned ${state.profile.taxBufferPercent}% (${input.currency} ${taxReservedAmount.toFixed(2)}) into Tax Reserve`
              : undefined),
        };

        set((prev) => {
          const updatedAccounts = prev.accounts.map((acc) => {
            if (acc.id !== accountId) return acc;
            const amountInAccCurrency = convertCurrency(
              input.amount,
              input.currency,
              acc.currency,
              prev.currencies
            );
            const nextBal =
              input.direction === 'income'
                ? acc.balance + amountInAccCurrency
                : acc.balance - amountInAccCurrency;
            return { ...acc, balance: Number(nextBal.toFixed(2)) };
          });

          return {
            transactions: [newTx, ...prev.transactions],
            accounts: updatedAccounts,
          };
        });

        return newTx;
      },

      deleteTransaction: (id) =>
        set((state) => {
          const target = state.transactions.find((t) => t.id === id);
          if (!target) return state;

          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id !== target.accountId) return acc;
            const amountInAccCurrency = convertCurrency(
              target.amount,
              target.currency,
              acc.currency,
              state.currencies
            );
            const revertedBal =
              target.direction === 'income'
                ? acc.balance - amountInAccCurrency
                : acc.balance + amountInAccCurrency;
            return { ...acc, balance: Number(revertedBal.toFixed(2)) };
          });

          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            accounts: updatedAccounts,
          };
        }),

      toggleTransactionFirewall: (id) =>
        set((state) => ({
          transactions: state.transactions.map((tx) => {
            if (tx.id !== id) return tx;
            const nextFirewall: FirewallType =
              tx.firewall === 'personal' ? 'business' : 'personal';
            const isBizIncome =
              nextFirewall === 'business' && tx.direction === 'income';
            const taxReservedAmount = isBizIncome
              ? Number(
                  (tx.amount * (state.profile.taxBufferPercent / 100)).toFixed(2)
                )
              : 0;
            const isTaxDeductible =
              nextFirewall === 'business' && tx.direction === 'expense';
            return {
              ...tx,
              firewall: nextFirewall,
              isTaxDeductible,
              taxReservedAmount,
            };
          }),
        })),

      addAccount: (account) =>
        set((state) => ({
          accounts: [
            ...state.accounts,
            {
              ...account,
              id: `acc-${Date.now()}`,
            },
          ],
        })),

      updateAccountBalance: (id, balance) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, balance } : a
          ),
        })),

      deleteAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),

      addCommitment: (commitment) =>
        set((state) => ({
          commitments: [
            ...state.commitments,
            {
              ...commitment,
              id: `fix-${Date.now()}`,
            },
          ],
        })),

      toggleCommitment: (id) =>
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === id ? { ...c, active: !c.active } : c
          ),
        })),

      deleteCommitment: (id) =>
        set((state) => ({
          commitments: state.commitments.filter((c) => c.id !== id),
        })),

      addCooldownItem: (input) => {
        const state = get();
        const lifeHours = computeLifeHours(
          input.amount,
          input.currency,
          state.profile,
          state.currencies
        );
        const multiplier = Math.max(0.1, state.profile.cooldownMultiplier || 1);
        const coolingHours = Math.max(0.25, lifeHours * multiplier);
        const durationMs = Math.round(coolingHours * 3600 * 1000);

        const newItem: CooldownItem = {
          id: `cool-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title: input.title,
          amount: input.amount,
          currency: input.currency,
          category: input.category || 'Hardware & Gear',
          firewall: input.firewall || 'personal',
          createdAt: Date.now(),
          durationMs,
          multiplierUsed: multiplier,
          lifeHoursRequired: Number(lifeHours.toFixed(2)),
          status: 'cooling',
          notes: input.notes,
        };

        set((prev) => ({
          cooldownItems: [newItem, ...prev.cooldownItems],
        }));

        return newItem;
      },

      approveCooldownItem: (id) => {
        const state = get();
        const item = state.cooldownItems.find((c) => c.id === id);
        if (!item || item.status !== 'cooling') return;

        // Log it as a real transaction in the ledger!
        state.addTransaction({
          title: `${item.title} (Approved Cooldown)`,
          amount: item.amount,
          currency: item.currency,
          direction: 'expense',
          firewall: item.firewall,
          isTaxDeductible: item.firewall === 'business',
          category: item.category,
          method: 'card',
          notes: `Approved after ${item.lifeHoursRequired.toFixed(1)} life-hr cooldown review`,
        });

        set((prev) => ({
          cooldownItems: prev.cooldownItems.map((c) =>
            c.id === id
              ? { ...c, status: 'approved', resolvedAt: Date.now() }
              : c
          ),
        }));
      },

      dismissCooldownItem: (id) =>
        set((state) => ({
          cooldownItems: state.cooldownItems.map((c) =>
            c.id === id
              ? { ...c, status: 'dismissed', resolvedAt: Date.now() }
              : c
          ),
        })),

      fastForwardCooldownItem: (id) =>
        set((state) => ({
          cooldownItems: state.cooldownItems.map((c) =>
            c.id === id
              ? {
                  ...c,
                  createdAt: Date.now() - c.durationMs - 1000,
                }
              : c
          ),
        })),

      deleteCooldownItem: (id) =>
        set((state) => ({
          cooldownItems: state.cooldownItems.filter((c) => c.id !== id),
        })),

      resetToDemoData: () =>
        set({
          profile: INITIAL_PROFILE,
          currencies: DEFAULT_CURRENCIES,
          accounts: INITIAL_ACCOUNTS,
          commitments: INITIAL_COMMITMENTS,
          transactions: INITIAL_TRANSACTIONS,
          cooldownItems: INITIAL_COOLDOWN_ITEMS,
        }),
    }),
    {
      name: 'equinox-ledger-v1',
    }
  )
);
