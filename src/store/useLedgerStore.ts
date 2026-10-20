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

export const INITIAL_PROFILE: FinancialProfile = {
  monthlyGrossIncome: 0,
  monthlyNetIncome: 0,
  weeklyWorkHours: 40,
  taxBufferPercent: 25,
  baseCurrency: 'USD',
  locationBurnRateMonthly: 0,
  locationName: 'Current Location',
  cooldownMultiplier: 1.0,
  displayMode: 'dual',
};

export const INITIAL_ACCOUNTS: Account[] = [];

export const INITIAL_COMMITMENTS: FixedCommitment[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_COOLDOWN_ITEMS: CooldownItem[] = [];

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
  clearAllData: () => void;
  importBackupData: (data: Partial<LedgerState>) => void;
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

        let targetAccount =
          state.accounts.find((a) => a.id === input.accountId) ||
          state.accounts.find(
            (a) =>
              a.currency === input.currency &&
              (input.firewall === 'business' ? a.isBusiness : !a.isBusiness)
          ) ||
          state.accounts.find((a) => a.currency === input.currency) ||
          state.accounts[0];

        // If user has no accounts yet, automatically create a default account for this currency
        let autoCreatedAccount: Account | null = null;
        if (!targetAccount) {
          autoCreatedAccount = {
            id: `acc-${Date.now()}`,
            name: `${input.currency} ${input.firewall === 'business' ? 'Business' : 'Primary'} Account`,
            institution: 'Primary Custodian',
            currency: input.currency,
            balance: 0,
            type: 'checking',
            isBusiness: input.firewall === 'business',
          };
          targetAccount = autoCreatedAccount;
        }

        const accountId = targetAccount.id;

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
          const baseAccounts = autoCreatedAccount
            ? [...prev.accounts, autoCreatedAccount]
            : prev.accounts;

          const updatedAccounts = baseAccounts.map((acc) => {
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
        // If user hasn't set net income yet (lifeHours === 0), default to a 24h cooling period
        const coolingHours =
          lifeHours > 0 ? Math.max(0.25, lifeHours * multiplier) : 24;
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

        state.addTransaction({
          title: `${item.title} (Approved Cooldown)`,
          amount: item.amount,
          currency: item.currency,
          direction: 'expense',
          firewall: item.firewall,
          isTaxDeductible: item.firewall === 'business',
          category: item.category,
          method: 'card',
          notes: `Approved after cooldown review`,
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

      clearAllData: () =>
        set({
          profile: INITIAL_PROFILE,
          currencies: DEFAULT_CURRENCIES,
          accounts: [],
          commitments: [],
          transactions: [],
          cooldownItems: [],
        }),

      importBackupData: (data) =>
        set((state) => ({
          profile: data.profile ? { ...state.profile, ...data.profile } : state.profile,
          currencies: data.currencies ? { ...state.currencies, ...data.currencies } : state.currencies,
          accounts: Array.isArray(data.accounts) ? data.accounts : state.accounts,
          commitments: Array.isArray(data.commitments) ? data.commitments : state.commitments,
          transactions: Array.isArray(data.transactions) ? data.transactions : state.transactions,
          cooldownItems: Array.isArray(data.cooldownItems) ? data.cooldownItems : state.cooldownItems,
        })),
    }),
    {
      name: 'equinox-ledger-clean-v1',
    }
  )
);
