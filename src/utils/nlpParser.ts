import {
  CurrencyCode,
  FirewallType,
  ParsedCommandResult,
  PaymentMethod,
  TransactionDirection,
} from '../types/ledger';

const CURRENCY_ALIASES: Record<string, CurrencyCode> = {
  usd: 'USD',
  $: 'USD',
  dollar: 'USD',
  dollars: 'USD',
  eur: 'EUR',
  '€': 'EUR',
  euro: 'EUR',
  euros: 'EUR',
  gbp: 'GBP',
  '£': 'GBP',
  pound: 'GBP',
  pounds: 'GBP',
  try: 'TRY',
  tl: 'TRY',
  '₺': 'TRY',
  lira: 'TRY',
  chf: 'CHF',
  franc: 'CHF',
  jpy: 'JPY',
  '¥': 'JPY',
  yen: 'JPY',
};

const METHOD_ALIASES: Record<string, PaymentMethod> = {
  card: 'card',
  credit: 'card',
  debit: 'card',
  amex: 'card',
  visa: 'card',
  mastercard: 'card',
  applepay: 'card',
  wire: 'wire',
  swift: 'wire',
  sepa: 'wire',
  ach: 'ach',
  bank: 'ach',
  transfer: 'ach',
  cash: 'cash',
  atm: 'cash',
  fx: 'fx-wallet',
  wise: 'fx-wallet',
  revolut: 'fx-wallet',
  wallet: 'fx-wallet',
};

const FIREWALL_BIZ_KEYWORDS = new Set([
  'biz',
  'business',
  'tax',
  'deductible',
  'writeoff',
  'write-off',
  'corp',
  'company',
  'client',
  'retainer',
  'invoice',
  'consulting',
  'saas',
]);

const EXPLICIT_BIZ_TOKENS = new Set([
  'biz',
  'business',
  'tax',
  'deductible',
  'writeoff',
  'write-off',
  'corp',
]);

const EXPLICIT_PERSONAL_TOKENS = new Set(['personal', 'pers', 'priv', 'self']);

const INCOME_KEYWORDS = new Set([
  'retainer',
  'invoice',
  'income',
  'revenue',
  'payout',
  'salary',
  'dividend',
  'deposit',
  'refund',
  'paid',
  'milestone',
  'royalty',
  'bonus',
]);

const EXPLICIT_DIRECTION_TOKENS = new Set(['income', 'revenue', 'expense', 'spent']);

const COOLDOWN_TOKENS = new Set([
  'cooldown',
  'cool',
  'impulse',
  'wait',
  'vault',
  'hold',
  'later',
]);

const CATEGORY_RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: 'Dining',
    keywords: [
      'lunch',
      'dinner',
      'breakfast',
      'coffee',
      'cafe',
      'espresso',
      'restaurant',
      'bar',
      'drinks',
      'food',
      'bistro',
      'sushi',
      'pizza',
      'meal',
    ],
  },
  {
    category: 'Client Revenue',
    keywords: [
      'client',
      'retainer',
      'invoice',
      'consulting',
      'advisory',
      'project',
      'milestone',
      'contract',
      'payout',
    ],
  },
  {
    category: 'Software & SaaS',
    keywords: [
      'software',
      'sub',
      'subscription',
      'saas',
      'aws',
      'vercel',
      'openai',
      'anthropic',
      'claude',
      'cursor',
      'figma',
      'notion',
      'github',
      'linear',
      'cloudflare',
      'domain',
      'hosting',
      'server',
      'api',
      'app',
    ],
  },
  {
    category: 'Hardware & Gear',
    keywords: [
      'macbook',
      'laptop',
      'monitor',
      'display',
      'keyboard',
      'mouse',
      'camera',
      'lens',
      'iphone',
      'ipad',
      'headphones',
      'airpods',
      'desk',
      'chair',
      'hardware',
      'gear',
      'studio',
    ],
  },
  {
    category: 'Travel & Transit',
    keywords: [
      'flight',
      'hotel',
      'airbnb',
      'uber',
      'lyft',
      'taxi',
      'train',
      'metro',
      'transit',
      'airline',
      'lounge',
      'visa',
      'luggage',
    ],
  },
  {
    category: 'Workspace & Ops',
    keywords: [
      'coworking',
      'wework',
      'office',
      'legal',
      'accountant',
      'cpa',
      'incorporation',
      'filing',
      'postage',
    ],
  },
  {
    category: 'Groceries',
    keywords: ['grocery', 'groceries', 'market', 'supermarket', 'wholefoods', 'produce'],
  },
  {
    category: 'Wellness & Fitness',
    keywords: ['gym', 'fitness', 'yoga', 'pilates', 'pharmacy', 'doctor', 'dental', 'health', 'spa'],
  },
];

function toTitleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 3 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function parseQuickCommand(
  rawInput: string,
  defaultCurrency: CurrencyCode = 'USD'
): ParsedCommandResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      rawInput,
      title: '',
      amount: null,
      currency: defaultCurrency,
      direction: 'expense',
      firewall: 'personal',
      isTaxDeductible: false,
      category: 'General',
      method: 'card',
      isCooldownIntent: false,
      tokens: {},
    };
  }

  const rawTokens = trimmed.split(/\s+/);
  const consumedIndices = new Set<number>();

  let amount: number | null = null;
  let currency: CurrencyCode = defaultCurrency;
  let hasExplicitCurrency = false;
  let firewall: FirewallType = 'personal';
  let hasExplicitFirewall = false;
  let isTaxDeductible = false;
  let direction: TransactionDirection = 'expense';
  let hasExplicitDirection = false;
  let method: PaymentMethod = 'card';
  let isCooldownIntent = false;

  const matchedTokens: ParsedCommandResult['tokens'] = {};

  // Pass 1: Detect amount & attached currency symbols (e.g. "$18", "1500", "45.50", "€45", "18usd", "+1500")
  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    const cleanToken = token.replace(/,/g, '');

    // Pattern like $120, €45.50, +$1500, 185₺, 45eur
    const prefixSuffixMatch = cleanToken.match(
      /^([+-])?([$€£₺¥]|usd|eur|gbp|try|tl|chf|jpy)?(\d+(?:\.\d{1,2})?)([$€£₺¥]|usd|eur|gbp|try|tl|chf|jpy)?$/i
    );

    if (prefixSuffixMatch && amount === null) {
      const sign = prefixSuffixMatch[1];
      const prefixCur = prefixSuffixMatch[2]?.toLowerCase();
      const numStr = prefixSuffixMatch[3];
      const suffixCur = prefixSuffixMatch[4]?.toLowerCase();

      const parsedVal = parseFloat(numStr);
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amount = parsedVal;
        matchedTokens.amountToken = token;
        consumedIndices.add(i);

        if (sign === '+') {
          direction = 'income';
          hasExplicitDirection = true;
          matchedTokens.directionToken = '+';
        }

        const curSymbol = prefixCur || suffixCur;
        if (curSymbol && CURRENCY_ALIASES[curSymbol]) {
          currency = CURRENCY_ALIASES[curSymbol];
          hasExplicitCurrency = true;
          matchedTokens.currencyToken = curSymbol.toUpperCase();
        }
        continue;
      }
    }
  }

  // Pass 2: Detect standalone currency, method, firewall, direction, and cooldown tokens
  for (let i = 0; i < rawTokens.length; i++) {
    if (consumedIndices.has(i)) continue;
    const lower = rawTokens[i].toLowerCase().replace(/[.,!?]/g, '');

    // Standalone currency code
    if (!hasExplicitCurrency && CURRENCY_ALIASES[lower]) {
      currency = CURRENCY_ALIASES[lower];
      hasExplicitCurrency = true;
      matchedTokens.currencyToken = rawTokens[i].toUpperCase();
      consumedIndices.add(i);
      continue;
    }

    // Standalone payment method
    if (METHOD_ALIASES[lower]) {
      method = METHOD_ALIASES[lower];
      matchedTokens.methodToken = rawTokens[i];
      consumedIndices.add(i);
      continue;
    }

    // Explicit business/tax firewall flag ("biz", "tax", "deductible", "writeoff", "business")
    if (EXPLICIT_BIZ_TOKENS.has(lower)) {
      firewall = 'business';
      hasExplicitFirewall = true;
      isTaxDeductible = true;
      matchedTokens.firewallToken = rawTokens[i];
      consumedIndices.add(i);
      continue;
    }

    // Explicit personal token
    if (EXPLICIT_PERSONAL_TOKENS.has(lower)) {
      firewall = 'personal';
      hasExplicitFirewall = true;
      isTaxDeductible = false;
      matchedTokens.firewallToken = rawTokens[i];
      consumedIndices.add(i);
      continue;
    }

    // Cooldown intent token
    if (COOLDOWN_TOKENS.has(lower)) {
      isCooldownIntent = true;
      matchedTokens.cooldownToken = rawTokens[i];
      consumedIndices.add(i);
      continue;
    }

    // Explicit direction token ("income", "expense")
    if (EXPLICIT_DIRECTION_TOKENS.has(lower)) {
      direction = lower === 'income' || lower === 'revenue' ? 'income' : 'expense';
      hasExplicitDirection = true;
      matchedTokens.directionToken = rawTokens[i];
      consumedIndices.add(i);
      continue;
    }
  }

  // Pass 3: Remaining tokens form the Title; also inspect all tokens for semantic category/direction/business hints
  const titleWords: string[] = [];
  const allLowerWords: string[] = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const cleanLower = rawTokens[i].toLowerCase().replace(/[.,!?]/g, '');
    allLowerWords.push(cleanLower);
    if (!consumedIndices.has(i)) {
      titleWords.push(rawTokens[i]);
    }
  }

  // Infer income direction from words like "retainer", "invoice", "payout", "salary", "refund"
  if (!hasExplicitDirection) {
    for (const w of allLowerWords) {
      if (INCOME_KEYWORDS.has(w)) {
        direction = 'income';
        matchedTokens.directionToken = w;
        break;
      }
    }
  }

  // Infer business firewall if words like "client", "retainer", "invoice", "saas" appear and no explicit personal override
  if (!hasExplicitFirewall) {
    for (const w of allLowerWords) {
      if (FIREWALL_BIZ_KEYWORDS.has(w)) {
        firewall = 'business';
        isTaxDeductible = direction === 'expense';
        break;
      }
    }
  }

  // If business income, it's revenue (not a tax deduction, though it triggers the tax reserve partition!)
  if (firewall === 'business' && direction === 'income') {
    isTaxDeductible = false;
    if (method === 'card') {
      method = 'wire';
    }
  } else if (firewall === 'business' && direction === 'expense') {
    isTaxDeductible = true;
  }

  // Infer category
  let category =
    direction === 'income'
      ? firewall === 'business'
        ? 'Client Revenue'
        : 'Income'
      : firewall === 'business'
        ? 'Business Ops'
        : 'Lifestyle';

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => allLowerWords.includes(kw))) {
      category = rule.category;
      break;
    }
  }

  const finalTitle =
    titleWords.length > 0
      ? toTitleCase(titleWords.join(' '))
      : category;

  return {
    rawInput,
    title: finalTitle,
    amount,
    currency,
    direction,
    firewall,
    isTaxDeductible,
    category,
    method,
    isCooldownIntent,
    tokens: matchedTokens,
  };
}
