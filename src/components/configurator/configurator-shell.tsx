'use client';

import { Header } from './header';
import { ViewerSection } from './viewer-section';
import { PriceBar } from './price-bar';
import { StepShape } from './steps/step-shape';
import { StepSize } from './steps/step-size';
import { StepModules } from './steps/step-modules';
import { StepMaterial } from './steps/step-material';
import { StepFinish } from './steps/step-finish';
import { FinancingBanner } from './financing-banner';
import { ArPreviewBanner } from './ar-preview-banner';
import { FaqSection } from './faq-section';
import { SummarySection } from './summary-section';
import { InlinePriceSection } from './inline-price-section';
import { NotificationBar } from './notification-bar';
import { CtaSection } from './cta-section';
import { Footer } from './footer';
import { HqRenderModal } from './hq-render-modal';

export function ConfiguratorShell() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <HqRenderModal />

      {/* Configurator — fills exactly 100vh on desktop */}
      <div className="flex flex-col lg:h-screen lg:min-h-0 lg:overflow-hidden">
        <Header />

        {/* Main content: single-column mobile, two-column desktop */}
        <div className="relative flex flex-1 flex-col lg:flex-row lg:min-h-0">
          {/* 3D Viewer — sticky on mobile, left column on desktop */}
          <div className="sticky top-0 z-20 lg:static lg:flex-1 lg:min-w-0">
            <ViewerSection />
          </div>

          {/* Editor panel */}
          <div className="relative z-10 bg-white pb-[120px] lg:w-[420px] lg:min-w-[380px] lg:max-w-[480px] lg:shrink-0 lg:flex lg:flex-col lg:pb-0 lg:min-h-0">
            <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0">
              <div className="mx-auto w-full max-w-[430px] shadow-[0px_0px_30px_0px_rgba(0,0,0,0.05)] lg:max-w-none lg:shadow-[-4px_0px_24px_0px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col gap-px bg-[#e9e9e9]">
                  <NotificationBar />
                  <StepShape />
                  <StepSize />
                  <StepModules />
                  <StepMaterial />
                  <StepFinish />
                  <FinancingBanner />
                  <ArPreviewBanner />
                  <FaqSection />
                  <SummarySection />

                  <InlinePriceSection />

                  <CtaSection />
                </div>
              </div>
            </div>

            {/* Price bar — pinned at bottom of editor panel on desktop */}
            <div className="hidden lg:block lg:shrink-0">
              <PriceBar />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky price bar (mobile only) */}
      <div className="lg:hidden">
        <PriceBar />
      </div>

      {/* Footer — full width, below the configurator (scroll page to reach on desktop) */}
      <Footer />
    </div>
  );
}
