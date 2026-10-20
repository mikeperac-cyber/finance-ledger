import React, { useState } from 'react';
import { BookOpen, Sliders } from 'lucide-react';
import {
  AdaptiveSidebar,
  CompactHeaderBar,
  WorkspaceSection,
} from './components/HeaderBar';
import { LayoutBuilder, ConstrainedBox } from './components/AdaptiveLayout';
import { TopMetricBar } from './components/TopMetricBar';
import { QuickCaptureOmnibar } from './components/QuickCaptureOmnibar';
import { DualViewLedger } from './components/DualViewLedger';
import { CooldownChamber } from './components/CooldownChamber';
import { FxRunwayModule } from './components/FxRunwayModule';
import { InstructionsPage } from './components/InstructionsPage';
import { ProfileConfigModal } from './components/ProfileConfigModal';
import { TaxExportModal } from './components/TaxExportModal';
import { MobileBottomSheetInput } from './components/MobileBottomSheetInput';
import { useLedgerStore } from './store/useLedgerStore';

export function App() {
  const [activeSection, setActiveSection] =
    useState<WorkspaceSection>('overview');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTaxExportOpen, setIsTaxExportOpen] = useState(false);

  const { profile, transactions, accounts } = useLedgerStore();
  const isFreshState =
    profile.monthlyNetIncome === 0 &&
    transactions.length === 0 &&
    accounts.length === 0;

  return (
    <LayoutBuilder>
      {(constraints) => {
        const renderMainWorkspace = () => (
          <ConstrainedBox
            maxWidth={constraints.isLargeScreen ? 1140 : 880}
            className="px-4 py-6 sm:px-8 space-y-5 pb-24 md:pb-12"
          >
            {activeSection === 'instructions' ? (
              <InstructionsPage
                onOpenConfig={() => setIsConfigOpen(true)}
                onOpenTaxExport={() => setIsTaxExportOpen(true)}
                onNavigateSection={setActiveSection}
              />
            ) : (
              <>
                {/* Onboarding prompt when starting with an empty ledger */}
                {isFreshState && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#14161a] px-5 py-3.5 text-[13px]">
                    <div className="text-[#d4d4d8]">
                      <span className="font-medium text-white">
                        Welcome to Equinox.
                      </span>{' '}
                      Your ledger is empty and ready. Start by setting your
                      monthly income &amp; work hours, or read the quick-entry
                      guide.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSection('instructions')}
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#1c1f26] px-3 py-1.5 text-[12px] font-medium text-[#e4e4e7] transition hover:bg-white/[0.12]"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Read Instructions</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfigOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#ededef] px-3 py-1.5 text-[12px] font-medium text-[#0c0d0f] transition hover:bg-white"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>Set Income &amp; Rate</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Top Metric Strip: Safe-to-Spend, Net Worth & Runway, Tax Set-Aside */}
                <TopMetricBar
                  onOpenConfig={() => setIsConfigOpen(true)}
                  onOpenTaxExport={() => setIsTaxExportOpen(true)}
                />

                {/* Quick Entry Command Bar */}
                <QuickCaptureOmnibar />

                {/* Adaptive View Content based on selected section & window constraints */}
                {activeSection === 'overview' && (
                  <>
                    {constraints.isSplitPaneCapable ? (
                      /* Wide / Desktop Adaptive Split: Flexible 7:4 ratio */
                      <div className="flex items-start gap-5">
                        <div className="min-w-0 flex-[7]">
                          <DualViewLedger
                            onOpenTaxExport={() => setIsTaxExportOpen(true)}
                          />
                        </div>
                        <div className="w-[360px] shrink-0 space-y-5 xl:w-[390px]">
                          <CooldownChamber />
                          <FxRunwayModule />
                        </div>
                      </div>
                    ) : (
                      /* Medium / Compact Adaptive Stack + 2-Col Secondary Grid */
                      <div className="space-y-5">
                        <DualViewLedger
                          onOpenTaxExport={() => setIsTaxExportOpen(true)}
                        />
                        <div
                          className={
                            constraints.sizeClass === 'medium'
                              ? 'grid grid-cols-2 gap-5 items-start'
                              : 'space-y-5'
                          }
                        >
                          <CooldownChamber />
                          <FxRunwayModule />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeSection === 'ledger' && (
                  <DualViewLedger
                    onOpenTaxExport={() => setIsTaxExportOpen(true)}
                  />
                )}

                {activeSection === 'cooldown' && (
                  <ConstrainedBox maxWidth={680}>
                    <CooldownChamber />
                  </ConstrainedBox>
                )}

                {activeSection === 'fx' && (
                  <ConstrainedBox maxWidth={680}>
                    <FxRunwayModule />
                  </ConstrainedBox>
                )}
              </>
            )}
          </ConstrainedBox>
        );

        return (
          <>
            {constraints.isLargeScreen ? (
              /* Large Screen Layout: Row with Sidebar + Expanded Constrained Content */
              <div className="flex min-h-screen w-full">
                <AdaptiveSidebar
                  activeSection={activeSection}
                  onSelectSection={setActiveSection}
                  onOpenConfig={() => setIsConfigOpen(true)}
                  onOpenTaxExport={() => setIsTaxExportOpen(true)}
                />
                <main className="min-w-0 flex-1 overflow-y-auto">
                  {renderMainWorkspace()}
                </main>
              </div>
            ) : (
              /* Small / Medium Screen Layout: Column with Compact Header + Content */
              <div className="flex min-h-screen flex-col">
                <CompactHeaderBar
                  activeSection={activeSection}
                  onSelectSection={setActiveSection}
                  onOpenConfig={() => setIsConfigOpen(true)}
                  onOpenTaxExport={() => setIsTaxExportOpen(true)}
                />
                <main className="flex-1">{renderMainWorkspace()}</main>
                {constraints.sizeClass === 'compact' && (
                  <MobileBottomSheetInput />
                )}
              </div>
            )}

            {/* Modals */}
            <ProfileConfigModal
              isOpen={isConfigOpen}
              onClose={() => setIsConfigOpen(false)}
            />

            <TaxExportModal
              isOpen={isTaxExportOpen}
              onClose={() => setIsTaxExportOpen(false)}
            />
          </>
        );
      }}
    </LayoutBuilder>
  );
}

export default App;
