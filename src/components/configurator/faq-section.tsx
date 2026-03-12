'use client';

import { useState } from 'react';
import { ConsultationModal } from '@/components/configurator/consultation-modal';

function ConsultationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Speech bubble */}
      <path d="M8 12C8 9.79 9.79 8 12 8H36C38.21 8 40 9.79 40 12V28C40 30.21 38.21 32 36 32H26L18 38V32H12C9.79 32 8 30.21 8 28V12Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* Person silhouette */}
      <circle cx="24" cy="17" r="3.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity="0.15" />
      <path d="M17 28C17 24.13 20.13 22 24 22C27.87 22 31 24.13 31 28" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Calendar/booking dots */}
      <circle cx="19" cy="26" r="0.8" fill="currentColor" opacity="0.4" />
      <circle cx="24" cy="26" r="0.8" fill="currentColor" opacity="0.4" />
      <circle cx="29" cy="26" r="0.8" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function FaqSection() {
  const [consultationOpen, setConsultationOpen] = useState(false);

  return (
    <section className="bg-white px-[18px] py-[10px] lg:px-[28px]">
      <div className="rounded-[12px] bg-[#f5f4ef] px-[15px] py-[21px]">
        <div className="mb-[11px]">
          <ConsultationIcon className="h-[40px] w-[40px] text-[#3d3d3d]" />
        </div>

        <h3 className="mb-[11px] text-[21px] font-medium text-black">
          Do you have any questions?
        </h3>

        <p className="mb-[11px] text-[13px] text-black/60 leading-normal">
          Our team is looking forward to help you or consult you with any question
        </p>

        <button
          onClick={() => setConsultationOpen(true)}
          className="rounded-[50px] border-[0.7px] border-black bg-black px-[12px] py-[7px] text-[12px] text-white transition-colors hover:bg-black/85"
        >
          Book your consultation
        </button>
      </div>

      <ConsultationModal
        open={consultationOpen}
        onClose={() => setConsultationOpen(false)}
      />
    </section>
  );
}
