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

export function ConfiguratorShell() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      {/* 3D Viewer — sticky on scroll */}
      <ViewerSection />

      {/* Scrollable editor sections with 1px #e9e9e9 gap separators */}
      <div className="pb-[120px]">
        <div className="mx-auto w-full max-w-[430px] shadow-[0px_0px_30px_0px_rgba(0,0,0,0.05)]">
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

      {/* Sticky price bar (mobile) */}
      <PriceBar />
    </div>
  );
}
