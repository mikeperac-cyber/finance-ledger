import {
  CurrencyCode,
  CurrencyConfig,
  FinancialProfile,
  Transaction,
} from '../types/ledger';

export const DEFAULT_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    ratePerUSD: 1.0,
    flag: '🇺🇸',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    ratePerUSD: 0.92,
    flag: '🇪🇺',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    ratePerUSD: 0.785,
    flag: '🇬🇧',
  },
  TRY: {
    code: 'TRY',
    symbol: '₺',
    name: 'Turkish Lira',
    ratePerUSD: 34.45,
    flag: '🇹🇷',
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF ',
    name: 'Swiss Franc',
    ratePerUSD: 0.865,
    flag: '🇨🇭',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    ratePerUSD: 152.4,
    flag: '🇯🇵',
  },
};

/**
 * Convert an amount from `fromCurrency` to `toCurrency` using the provided currency map.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  currencies: Record<CurrencyCode, CurrencyConfig> = DEFAULT_CURRENCIES
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = currencies[fromCurrency]?.ratePerUSD ?? 1;
  const toRate = currencies[toCurrency]?.ratePerUSD ?? 1;
  if (fromRate <= 0) return amount;
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

/**
 * Computes Hourly Rate = (Monthly Net Income) / (Weekly Hours * 4.33)
 * Returned in `profile.baseCurrency`.
 */
export function computeNetHourlyRate(profile: FinancialProfile): number {
  const monthlyHours = profile.weeklyWorkHours * 4.33;
  if (monthlyHours <= 0) return 0;
  return profile.monthlyNetIncome / monthlyHours;
}

/**
 * Converts a monetary amount (in `amountCurrency`) into Life Hours based on the user's Net Hourly Rate.
 */
export function computeLifeHours(
  amount: number,
  amountCurrency: CurrencyCode,
  profile: FinancialProfile,
  currencies: Record<CurrencyCode, CurrencyConfig> = DEFAULT_CURRENCIES
): number {
  const hourlyRateInBase = computeNetHourlyRate(profile);
  if (hourlyRateInBase <= 0) return 0;
  const amountInBase = convertCurrency(
    Math.abs(amount),
    amountCurrency,
    profile.baseCurrency,
    currencies
  );
  return amountInBase / hourlyRateInBase;
}

/**
 * Format currency value cleanly with symbol and appropriate decimal places.
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode,
  currencies: Record<CurrencyCode, CurrencyConfig> = DEFAULT_CURRENCIES,
  options?: { compact?: boolean; showSign?: boolean; decimals?: number }
): string {
  const cfg = currencies[currencyCode] ?? DEFAULT_CURRENCIES.USD;
  const absVal = Math.abs(amount);
  const sign =
    options?.showSign
      ? amount > 0
        ? '+'
        : amount < 0
          ? '-'
          : ''
      : amount < 0
        ? '-'
        : '';

  const defaultDecimals = currencyCode === 'JPY' ? 0 : 2;
  const decimals = options?.decimals ?? defaultDecimals;

  if (options?.compact && absVal >= 1_000_000) {
    return `${sign}${cfg.symbol}${(absVal / 1_000_000).toFixed(2)}M`;
  }
  if (options?.compact && absVal >= 10_000) {
    return `${sign}${cfg.symbol}${(absVal / 1_000).toFixed(1)}k`;
  }

  const formattedNum = absVal.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${sign}${cfg.symbol}${formattedNum}`;
}

/**
 * Format Life Hours (e.g. `4.2 hrs` or `25 min` for very small amounts, or `4.2 hrs`).
 */
export function formatLifeHours(
  hours: number,
  options?: { showSign?: 'expense' | 'income' | 'none'; suffix?: string }
): string {
  const absHrs = Math.abs(hours);
  const signPrefix =
    options?.showSign === 'expense'
      ? '-'
      : options?.showSign === 'income'
        ? '+'
        : '';
  const suffix = options?.suffix ?? 'hrs';

  if (absHrs > 0 && absHrs < 0.1) {
    return `${signPrefix}${absHrs.toFixed(2)} ${suffix}`;
  }
  return `${signPrefix}${absHrs.toFixed(1)} ${suffix}`;
}

/**
 * Format millisecond countdown into HH:MM:SS
 */
export function formatCountdownHMS(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00:00';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');
}

/**
 * Generate CSV export string with tax write-off summaries and transaction rows.
 */
export function generateLedgerCSV(
  transactions: Transaction[],
  profile: FinancialProfile,
  currencies: Record<CurrencyCode, CurrencyConfig>
): string {
  const base = profile.baseCurrency;
  const headers = [
    'Date',
    'Title',
    'Direction',
    'Firewall_Type',
    'Tax_Deductible',
    'Category',
    'Payment_Method',
    'Original_Amount',
    'Original_Currency',
    `Converted_Amount_${base}`,
    `Tax_Reserved_${base}`,
    `Estimated_Tax_WriteOff_Saving_${base}`,
    'Life_Hours_Impact',
  ];

  const rows = transactions.map((tx) => {
    const convertedBase = convertCurrency(
      tx.amount,
      tx.currency,
      base,
      currencies
    );
    const taxResBase = convertCurrency(
      tx.taxReservedAmount || 0,
      tx.currency,
      base,
      currencies
    );
    const writeOffSavingBase =
      tx.firewall === 'business' && tx.direction === 'expense' && tx.isTaxDeductible
        ? convertedBase * (profile.taxBufferPercent / 100)
        : 0;
    const lifeHrs = computeLifeHours(
      tx.amount,
      tx.currency,
      profile,
      currencies
    );
    const signedHrs = tx.direction === 'expense' ? -lifeHrs : lifeHrs;

    const escapeCSV = (val: string | number | boolean) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    return [
      tx.date.slice(0, 10),
      tx.title,
      tx.direction.toUpperCase(),
      tx.firewall.toUpperCase(),
      tx.isTaxDeductible ? 'YES' : 'NO',
      tx.category,
      tx.method.toUpperCase(),
      tx.amount.toFixed(2),
      tx.currency,
      convertedBase.toFixed(2),
      taxResBase.toFixed(2),
      writeOffSavingBase.toFixed(2),
      signedHrs.toFixed(2),
    ]
      .map(escapeCSV)
      .join(',');
  });

  // Calculate summary totals
  let bizRevenueBase = 0;
  let bizTaxReservedBase = 0;
  let bizDeductionsBase = 0;
  let bizTaxWriteOffSavingsBase = 0;
  let personalExpensesBase = 0;

  for (const tx of transactions) {
    const inBase = convertCurrency(tx.amount, tx.currency, base, currencies);
    if (tx.firewall === 'business' && tx.direction === 'income') {
      bizRevenueBase += inBase;
      bizTaxReservedBase += convertCurrency(
        tx.taxReservedAmount || 0,
        tx.currency,
        base,
        currencies
      );
    } else if (tx.firewall === 'business' && tx.direction === 'expense') {
      if (tx.isTaxDeductible) {
        bizDeductionsBase += inBase;
        bizTaxWriteOffSavingsBase += inBase * (profile.taxBufferPercent / 100);
      }
    } else if (tx.firewall === 'personal' && tx.direction === 'expense') {
      personalExpensesBase += inBase;
    }
  }

  const summaryFooter = [
    '',
    `# EQUINOX LEDGER TAX & FIREWALL SUMMARY (${base})`,
    `# Gross Business Revenue (${base}),${bizRevenueBase.toFixed(2)}`,
    `# Segregated Tax Reserve Partitioned (${profile.taxBufferPercent}%),${bizTaxReservedBase.toFixed(2)}`,
    `# Total Tax-Deductible Business Expenses (${base}),${bizDeductionsBase.toFixed(2)}`,
    `# Estimated Tax Write-Off Shield / Savings (${base}),${bizTaxWriteOffSavingsBase.toFixed(2)}`,
    `# Net Taxable Business Profit (${base}),${Math.max(0, bizRevenueBase - bizDeductionsBase).toFixed(2)}`,
    `# Total Personal Expenses (${base}),${personalExpensesBase.toFixed(2)}`,
  ];

  return [headers.join(','), ...rows, ...summaryFooter].join('\n');
}
