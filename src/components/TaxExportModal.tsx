import React, { useState, useMemo } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { useLedgerStore } from '../store/useLedgerStore';
import {
  convertCurrency,
  formatCurrency,
  generateLedgerCSV,
} from '../utils/currency';

interface TaxExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportScope =
  | 'biz-deductions'
  | 'biz-all'
  | 'personal-only'
  | 'full-ledger';

export const TaxExportModal: React.FC<TaxExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { profile, currencies, transactions } = useLedgerStore();

  const [scope, setScope] = useState<ExportScope>('biz-all');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [copied, setCopied] = useState(false);

  const base = profile.baseCurrency;

  const filteredTx = useMemo(() => {
    return transactions.filter((tx) => {
      if (scope === 'biz-deductions') {
        return (
          tx.firewall === 'business' &&
          tx.direction === 'expense' &&
          tx.isTaxDeductible
        );
      }
      if (scope === 'biz-all') {
        return tx.firewall === 'business';
      }
      if (scope === 'personal-only') {
        return tx.firewall === 'personal';
      }
      return true;
    });
  }, [transactions, scope]);

  const auditMetrics = useMemo(() => {
    let bizRevenue = 0;
    let taxReserved = 0;
    let bizDeductions = 0;
    let personalSpend = 0;

    for (const tx of transactions) {
      const inBase = convertCurrency(tx.amount, tx.currency, base, currencies);
      if (tx.firewall === 'business' && tx.direction === 'income') {
        bizRevenue += inBase;
        taxReserved += convertCurrency(
          tx.taxReservedAmount || tx.amount * (profile.taxBufferPercent / 100),
          tx.currency,
          base,
          currencies
        );
      } else if (
        tx.firewall === 'business' &&
        tx.direction === 'expense' &&
        tx.isTaxDeductible
      ) {
        bizDeductions += inBase;
      } else if (tx.firewall === 'personal' && tx.direction === 'expense') {
        personalSpend += inBase;
      }
    }

    const estimatedTaxWriteOffSaving =
      bizDeductions * (profile.taxBufferPercent / 100);
    const netTaxableProfit = Math.max(0, bizRevenue - bizDeductions);
    const adjustedTaxLiability =
      netTaxableProfit * (profile.taxBufferPercent / 100);

    return {
      bizRevenue,
      taxReserved,
      bizDeductions,
      estimatedTaxWriteOffSaving,
      netTaxableProfit,
      adjustedTaxLiability,
      personalSpend,
    };
  }, [transactions, base, currencies, profile.taxBufferPercent]);

  const exportPayloadString = useMemo(() => {
    if (format === 'csv') {
      return generateLedgerCSV(filteredTx, profile, currencies);
    }
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        exportScope: scope,
        baseCurrency: base,
        taxBufferPercent: profile.taxBufferPercent,
        taxWriteOffSummary: {
          grossBusinessRevenue: Number(auditMetrics.bizRevenue.toFixed(2)),
          segregatedTaxReserve: Number(auditMetrics.taxReserved.toFixed(2)),
          totalTaxDeductibleExpenses: Number(
            auditMetrics.bizDeductions.toFixed(2)
          ),
          calculatedTaxWriteOffSavings: Number(
            auditMetrics.estimatedTaxWriteOffSaving.toFixed(2)
          ),
          netTaxableBusinessProfit: Number(
            auditMetrics.netTaxableProfit.toFixed(2)
          ),
          totalPersonalExpenses: Number(auditMetrics.personalSpend.toFixed(2)),
        },
        transactions: filteredTx,
      },
      null,
      2
    );
  }, [format, filteredTx, profile, currencies, scope, base, auditMetrics]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(exportPayloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const mime =
      format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json';
    const blob = new Blob([exportPayloadString], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equinox-tax-export-${scope}-${new Date().toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tax-export-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#121417] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.07] pb-4">
          <div>
            <h2
              id="tax-export-modal-title"
              className="text-base font-medium text-white"
            >
              Business &amp; Personal Tax Export
            </h2>
            <p className="mt-0.5 text-[12px] text-[#8a8f98]">
              Calculated in {base} using a {profile.taxBufferPercent}% tax
              set-aside rate
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

        {/* Summary Strip */}
        <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-white/[0.07] rounded-xl border border-white/[0.07] bg-[#0c0d0f] sm:grid-cols-4 sm:divide-y-0">
          <div className="p-3.5">
            <div className="text-[11px] text-[#8a8f98]">Business revenue</div>
            <div className="mt-1 font-mono text-sm font-medium text-white">
              {formatCurrency(auditMetrics.bizRevenue, base, currencies)}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-[#71717a]">
              {formatCurrency(auditMetrics.taxReserved, base, currencies)} held
            </div>
          </div>

          <div className="p-3.5">
            <div className="text-[11px] text-[#8a8f98]">Tax write-offs</div>
            <div className="mt-1 font-mono text-sm font-medium text-white">
              {formatCurrency(auditMetrics.bizDeductions, base, currencies)}
            </div>
            <div className="mt-0.5 text-[11px] text-[#71717a]">
              Deductible expenses
            </div>
          </div>

          <div className="p-3.5">
            <div className="text-[11px] text-[#8a8f98]">Tax shield saved</div>
            <div className="mt-1 font-mono text-sm font-medium text-[#78b090]">
              +{formatCurrency(
                auditMetrics.estimatedTaxWriteOffSaving,
                base,
                currencies
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-[#71717a]">
              At {profile.taxBufferPercent}% rate
            </div>
          </div>

          <div className="p-3.5">
            <div className="text-[11px] text-[#8a8f98]">Personal total</div>
            <div className="mt-1 font-mono text-sm font-medium text-white">
              {formatCurrency(auditMetrics.personalSpend, base, currencies)}
            </div>
            <div className="mt-0.5 text-[11px] text-[#71717a]">
              Non-deductible
            </div>
          </div>
        </div>

        {/* Filter & Format Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#0c0d0f] p-1 border border-white/[0.06] text-[12px]">
            {(
              [
                { id: 'biz-deductions', label: 'Deductions only' },
                { id: 'biz-all', label: 'All business' },
                { id: 'personal-only', label: 'Personal' },
                { id: 'full-ledger', label: 'All entries' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScope(opt.id)}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  scope === opt.id
                    ? 'bg-[#1f2228] text-white'
                    : 'text-[#8a8f98] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-lg bg-[#0c0d0f] p-1 border border-white/[0.06] font-mono text-[12px]">
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`rounded-md px-2.5 py-1 ${
                format === 'csv'
                  ? 'bg-[#1f2228] text-white'
                  : 'text-[#8a8f98]'
              }`}
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`rounded-md px-2.5 py-1 ${
                format === 'json'
                  ? 'bg-[#1f2228] text-white'
                  : 'text-[#8a8f98]'
              }`}
            >
              JSON
            </button>
          </div>
        </div>

        {/* Preview Box */}
        <div className="mt-3">
          <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-white/[0.07] bg-[#16181d] px-3 py-1.5 text-[11px] text-[#8a8f98]">
            <span>
              Preview ({filteredTx.length} rows · {format.toUpperCase()})
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[#d4d4d8] hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-[#78b090]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="max-h-48 overflow-auto rounded-b-lg border border-white/[0.07] bg-[#0c0d0f] p-3 font-mono text-[11px] leading-relaxed text-[#a1a1aa]">
            {exportPayloadString}
          </pre>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-white/[0.07] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-[#181a1f] px-4 py-1.5 text-[12px] text-[#d4d4d8] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg bg-[#ededef] px-4 py-1.5 text-[12px] font-medium text-[#0c0d0f] transition hover:bg-white"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download {format.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
