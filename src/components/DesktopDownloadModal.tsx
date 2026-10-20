import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Monitor,
  Download,
  HardDrive,
  Upload,
  Check,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useLedgerStore } from '../store/useLedgerStore';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface DesktopDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onClearDeferredPrompt: () => void;
}

export const DesktopDownloadModal: React.FC<DesktopDownloadModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onClearDeferredPrompt,
}) => {
  const {
    profile,
    currencies,
    accounts,
    commitments,
    transactions,
    cooldownItems,
    importBackupData,
  } = useLedgerStore();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) setStatusMessage(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleNativePwaInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('Equinox Desktop App installed to your system!');
        onClearDeferredPrompt();
      }
    }
  };

  // Save Full Local Database File (.equinox.json) to Hard Drive
  const handleSaveDatabaseFile = () => {
    const backup = {
      app: 'Equinox Ledger',
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      data: {
        profile,
        currencies,
        accounts,
        commitments,
        transactions,
        cooldownItems,
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equinox-vault-${new Date().toISOString().slice(0, 10)}.equinox.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Saved local .equinox.json database file to your computer.');
  };

  // Load / Restore Database File from Hard Drive
  const handleImportDatabaseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        const payload = parsed.data || parsed;
        importBackupData(payload);
        showToast('Restored ledger database from local file.');
      } catch {
        showToast('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#121417] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.07] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-[#181a1f] text-white">
              <Monitor className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="desktop-modal-title"
                className="text-base font-medium text-white"
              >
                Download Equinox Desktop (.exe) &amp; Local Vault
              </h2>
              <p className="mt-0.5 text-[12px] text-[#8a8f98]">
                Download the standalone Windows executable or manage local
                database files on your computer.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-[#181a1f] p-1.5 text-[#8a8f98] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Option 1: Direct Windows .exe Executable Download */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0f] p-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-medium text-white">
                    1. Standalone Windows Desktop Executable (.exe)
                  </h3>
                  <span className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-[#78b090]">
                    PORTABLE .EXE
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#8a8f98]">
                  Self-contained native Windows executable (
                  <code className="font-mono text-[#d4d4d8]">
                    Equinox-Ledger-Desktop.exe
                  </code>
                  ) with custom app icon and version metadata. Double-click to
                  launch in a dedicated offline desktop window.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <a
                  href="./Equinox-Ledger-Desktop.exe"
                  download="Equinox-Ledger-Desktop.exe"
                  onClick={() =>
                    showToast(
                      'Downloading Equinox-Ledger-Desktop.exe — double-click to launch Equinox on your desktop.'
                    )
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-[#ededef] px-4 py-2 text-[12px] font-medium text-[#0c0d0f] transition hover:bg-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Portable .exe</span>
                </a>

                {deferredPrompt && (
                  <button
                    type="button"
                    onClick={handleNativePwaInstall}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#181a1f] px-3 py-2 text-[12px] font-medium text-white transition hover:bg-white/[0.1]"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span>Install PWA</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Option 2: Microsoft Store Ready Packages (.msix & Silent Setup .exe) */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0f] p-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#78b090]" />
                  <h3 className="text-[14px] font-medium text-white">
                    2. Microsoft Store Submission Packages (.msix &amp; Setup .exe)
                  </h3>
                  <span className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-[#78b090]">
                    STORE READY
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#8a8f98]">
                  Packaged for Microsoft Partner Center: choose the native{' '}
                  <code className="font-mono text-[#d4d4d8]">
                    Equinox-Ledger.msix
                  </code>{' '}
                  package (with <code className="font-mono">AppxManifest.xml</code>{' '}
                  &amp; Store visual assets) or the silent-capable Win32 installer{' '}
                  (supports <code className="font-mono">/S</code>,{' '}
                  <code className="font-mono">/quiet</code>,{' '}
                  <code className="font-mono">/uninstall</code>).
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <a
                  href="./Equinox-Ledger.msix"
                  download="Equinox-Ledger.msix"
                  onClick={() =>
                    showToast(
                      'Downloading Equinox-Ledger.msix (Microsoft Store MSIX package).'
                    )
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#181a1f] px-3 py-2 text-[12px] font-medium text-white transition hover:bg-white/[0.1]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .msix</span>
                </a>

                <a
                  href="./Equinox-Ledger-Store-Installer.exe"
                  download="Equinox-Ledger-Store-Installer.exe"
                  onClick={() =>
                    showToast(
                      'Downloading Equinox-Ledger-Store-Installer.exe (supports /S silent install for Microsoft Partner Center).'
                    )
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#181a1f] px-3 py-2 text-[12px] font-medium text-white transition hover:bg-white/[0.1]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Store Setup .exe</span>
                </a>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 font-mono text-[11px]">
              <div className="rounded-lg border border-white/[0.06] bg-[#14161a] p-2.5">
                <div className="text-[#71717a]">Partner Center Silent Flag</div>
                <div className="mt-0.5 text-white">/S</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#14161a] p-2.5">
                <div className="text-[#71717a]">Store Category</div>
                <div className="mt-0.5 text-white">Personal Finance</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#14161a] p-2.5">
                <div className="text-[#71717a]">Privacy Policy (10.5.1)</div>
                <div className="mt-0.5">
                  <a
                    href="./privacy.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#78b090] underline underline-offset-2"
                  >
                    /privacy.html
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Option 3: Local Hard-Drive Database Vault (.equinox.json) */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0f] p-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-[#c4a468]" />
                  <h3 className="text-[14px] font-medium text-white">
                    3. Local Desktop Database File (.equinox.json)
                  </h3>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#8a8f98]">
                  Save your complete ledger, accounts, commitments, and settings
                  directly to your computer&apos;s hard drive, or load an
                  existing database file.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <input
                  ref={fileInputRef}
                  id="import-equinox-file"
                  name="importEquinoxFile"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportDatabaseFile}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#181a1f] px-3 py-2 text-[12px] font-medium text-[#d4d4d8] transition hover:text-white"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Load File</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveDatabaseFile}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#181a1f] px-3.5 py-2 text-[12px] font-medium text-white transition hover:bg-white/[0.1]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Save Database File</span>
                </button>
              </div>
            </div>
          </div>

          {/* Microsoft Store Certification Compliance Note */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#14161a] px-4 py-3 text-[12px]">
            <div className="flex items-center gap-2 text-[#8a8f98]">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#78b090]" />
              <span>
                100% local-first storage — passes Microsoft Store Policy 10.5.1
                (Privacy) &amp; 10.2 (Security). Rebuild anytime via{' '}
                <code className="font-mono text-white">npm run build:store</code>.
              </span>
            </div>
          </div>

          {statusMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-[#78b090]/30 bg-[#78b090]/10 px-3.5 py-2.5 text-[12px] text-[#78b090]">
              <Check className="h-4 w-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end border-t border-white/[0.07] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-[#181a1f] px-4 py-1.5 text-[12px] text-[#d4d4d8] hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
