'use client';

import { useState } from 'react';
import { SupportIcon } from '@/components/icons';
import { ConsultationModal } from '@/components/configurator/consultation-modal';

export function FaqSection() {
  const [consultationOpen, setConsultationOpen] = useState(false);

  return (
    <section className="bg-white px-[18px] py-[20px] lg:px-[28px] lg:py-[28px]">
      <div className="flex flex-col gap-[11px] rounded-[12px] bg-[#eee] px-[15px] py-[21px]">
        <SupportIcon className="h-[30px] w-[30px]" />

        <p className="text-[21px] font-medium text-black w-[349px] lg:w-auto">
          Do you have any questions?
        </p>

        <p className="text-[13px] text-black w-[349px] lg:w-auto">
          Our team is looking forward to help you or consult you with any question
        </p>

        <div>
          <button
            onClick={() => setConsultationOpen(true)}
            className="rounded-[50px] border-[0.7px] border-[#111] bg-[#111] px-[12px] py-[7px] text-[12px] text-white"
          >
            Book your consultation
          </button>
        </div>
      </div>

      <ConsultationModal
        open={consultationOpen}
        onClose={() => setConsultationOpen(false)}
      />
    </section>
  );
}
