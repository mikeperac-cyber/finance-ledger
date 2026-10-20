export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'TRY' | 'CHF' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  /** Units of this currency per 1 USD (e.g. USD=1, EUR=0.92, GBP=0.79, TRY=34.20) */
  ratePerUSD: number;
  flag: string;
}

export type FirewallType = 'personal' | 'business';
export type TransactionDirection = 'expense' | 'income';
export type PaymentMethod = 'card' | 'wire' | 'cash' | 'ach' | 'fx-wallet';

export interface Account {
  id: string;
  name: string;
  institution: string;
  currency: CurrencyCode;
  balance: number;
  type: 'checking' | 'treasury' | 'fx-wallet' | 'card';
  isBusiness: boolean;
}

export interface FixedCommitment {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  category: 'housing' | 'investment' | 'debt' | 'infrastructure' | 'insurance';
  active: boolean;
}

export interface Transaction {
  id: string;
  date: string; // ISO date string
  title: string;
  amount: number;
  currency: CurrencyCode;
  direction: TransactionDirection;
  firewall: FirewallType;
  isTaxDeductible: boolean;
  category: string;
  accountId: string;
  method: PaymentMethod;
  /** If business income, amount automatically partitioned into untouchable Tax Reserve (in transaction's currency) */
  taxReservedAmount: number;
  notes?: string;
}

export type CooldownStatus = 'cooling' | 'approved' | 'dismissed';

export interface CooldownItem {
  id: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  category: string;
  firewall: FirewallType;
  createdAt: number; // epoch ms
  durationMs: number; // total cooldown duration in ms
  multiplierUsed: number; // e.g. 1 hour cooldown per 1 life hour
  lifeHoursRequired: number;
  status: CooldownStatus;
  resolvedAt?: number;
  notes?: string;
}

export type DisplayMode = 'dual' | 'currency-primary' | 'hours-primary';

export interface FinancialProfile {
  /** Baseline net monthly income (in baseCurrency) used for Hourly Rate = Monthly Net / (Weekly Hours * 4.33) */
  monthlyNetIncome: number;
  /** Gross monthly income (in baseCurrency) used as the top of the Reverse Budget Waterfall */
  monthlyGrossIncome: number;
  /** Typical weekly billable / work hours */
  weeklyWorkHours: number;
  /** Tax buffer % partitioned from gross income and incoming business revenue (e.g. 28%) */
  taxBufferPercent: number;
  /** Primary display & reporting base currency */
  baseCurrency: CurrencyCode;
  /** Monthly living burn rate in baseCurrency for Runway Index calculation */
  locationBurnRateMonthly: number;
  /** Current location label for Runway Index */
  locationName: string;
  /** Cooldown multiplier: hours of cooling wait time per 1 life-hour of work required */
  cooldownMultiplier: number;
  /** Global display preference for Currency vs Life Hours */
  displayMode: DisplayMode;
}

export interface ParsedCommandResult {
  rawInput: string;
  title: string;
  amount: number | null;
  currency: CurrencyCode;
  direction: TransactionDirection;
  firewall: FirewallType;
  isTaxDeductible: boolean;
  category: string;
  method: PaymentMethod;
  isCooldownIntent: boolean;
  tokens: {
    amountToken?: string;
    currencyToken?: string;
    firewallToken?: string;
    methodToken?: string;
    directionToken?: string;
    cooldownToken?: string;
  };
}
