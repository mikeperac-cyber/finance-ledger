import React, { useState } from 'react';
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
import { ProfileConfigModal } from './components/ProfileConfigModal';
import { TaxExportModal } from './components/TaxExportModal';
import { MobileBottomSheetInput } from './components/MobileBottomSheetInput';

export function App() {
  const [activeSection, setActiveSection] =
    useState<WorkspaceSection>('overview');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTaxExportOpen, setIsTaxExportOpen] = useState(false);

  return (
    <LayoutBuilder>
      {(constraints) => {
        const renderMainWorkspace = () => (
          <ConstrainedBox
            maxWidth={constraints.isLargeScreen ? 1140 : 880}
            className="px-4 py-6 sm:px-8 space-y-5 pb-24 md:pb-12"
          >
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
