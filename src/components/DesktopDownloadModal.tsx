import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Monitor,
  Download,
  HardDrive,
  Upload,
  Check,
  Terminal,
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
    }, 4000);
  };

  // 1. Trigger Native Browser PWA Desktop Install if available
  const handleNativePwaInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('Equinox Desktop App installed to your system!');
        onClearDeferredPrompt();
      }
      return;
    }
    // Fallback: download Windows chromeless app window launcher (.bat)
    handleDownloadWindowsLauncher();
  };

  // 2. Download Windows Native App-Mode Launcher (.bat)
  const handleDownloadWindowsLauncher = () => {
    const targetUrl = window.location.origin + window.location.pathname;
    const batContent = [
      '@echo off',
      'title Equinox Ledger Desktop Launcher',
      'REM Launches Equinox Ledger in a dedicated native desktop window without browser toolbars',
      `start "" msedge --app="${targetUrl}" --window-size=1380,880 2>nul || start "" chrome --app="${targetUrl}" --window-size=1380,880 2>nul || start "" "${targetUrl}"`,
      'exit',
    ].join('\r\n');

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Equinox-Ledger-Desktop.bat';
    a.click();
    URL.revokeObjectURL(url);
    showToast(
      'Downloaded Equinox-Ledger-Desktop.bat — double-click it to open Equinox in a dedicated desktop window.'
    );
  };

  // 3. Save Full Local Database File (.equinox.json) to Hard Drive
  const handleSaveDatabaseFile = () => {
    const backup = {
      app: 'Equinox Ledger',
      version: '1.0.0',
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

  // 4. Load / Restore Database File from Hard Drive
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
                Download Equinox for Desktop &amp; Local Vault
              </h2>
              <p className="mt-0.5 text-[12px] text-[#8a8f98]">
                Run Equinox as a standalone desktop app and store encrypted-ready
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
          {/* Option 1: Instant Desktop App Install & Windows Launcher */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0f] p-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-medium text-white">
                    1. Standalone Desktop App Window
                  </h3>
                  <span className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-[#d4d4d8]">
                    WINDOWS / MAC / LINUX
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#8a8f98]">
                  {deferredPrompt
                    ? 'Click Install to add Equinox directly to your Desktop, Start Menu, and Taskbar as a native standalone window.'
                    : 'Download the desktop launcher script or use your browser address bar ("Install Equinox" icon) to pin Equinox to your OS taskbar.'}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {deferredPrompt && (
                  <button
                    type="button"
                    onClick={handleNativePwaInstall}
                    className="flex items-center gap-1.5 rounded-lg bg-[#ededef] px-3.5 py-2 text-[12px] font-medium text-[#0c0d0f] transition hover:bg-white"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span>Install Desktop App</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadWindowsLauncher}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#181a1f] px-3.5 py-2 text-[12px] font-medium text-white transition hover:bg-white/[0.1]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Desktop Launcher (.bat)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: Local Hard-Drive Database Vault (.equinox.json) */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0f] p-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-[#78b090]" />
                  <h3 className="text-[14px] font-medium text-white">
                    2. Local Desktop Database File (`.equinox.json`)
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
                  className="flex items-center gap-1.5 rounded-lg bg-[#ededef] px-3.5 py-2 text-[12px] font-medium text-[#0c0d0f] transition hover:bg-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Save Database File</span>
                </button>
              </div>
            </div>
          </div>

          {/* Option 3: Native Electron .exe Build */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0f] p-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#c4a468]" />
              <h3 className="text-[14px] font-medium text-white">
                3. Native Electron Desktop Binary (`.exe` / `.dmg` / `.AppImage`)
              </h3>
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-[#8a8f98]">
              This repository includes a native Electron wrapper (
              <code className="font-mono text-[#d4d4d8]">electron/main.cjs</code>
              ) and automated GitHub Actions builds. Run either command in the
              project folder:
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 font-mono text-[11px]">
              <div className="rounded-lg border border-white/[0.06] bg-[#14161a] p-2.5">
                <div className="text-[#71717a]"># Launch native window now</div>
                <div className="mt-1 text-white">npm run desktop</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#14161a] p-2.5">
                <div className="text-[#71717a]">
                  # Package portable .exe installer
                </div>
                <div className="mt-1 text-white">npm run desktop:build</div>
              </div>
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
