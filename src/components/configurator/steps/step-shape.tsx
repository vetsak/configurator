'use client';

import { useState } from 'react';
import { PresetModal } from '../preset-modal';

export function StepShape() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="bg-white px-[18px] py-[20px]">
        <div className="flex items-center justify-between rounded-[12px] bg-[#eee] p-[15px]">
          <div className="flex flex-col gap-[3px]">
            <p className="text-[18px] font-medium text-black w-[188px]">
              Change sofa shape
            </p>
            <p className="text-[13px] text-black w-[218px]">
              Choose the shape of your sofa and start with your personalisation.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="shrink-0 rounded-[50px] border-[0.7px] border-[#111] px-[21px] py-[7px] text-[12px] text-[#111]"
          >
            Change Layout
          </button>
        </div>
      </section>

      <PresetModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
