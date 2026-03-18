'use client';

import { useMemo } from 'react';
import { useStore } from '@/stores';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { TopDownSchematic, computeSchematicData } from './top-down-schematic';

/* ── Main modal ──────────────────────────────────────────── */

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SummaryModal({ open, onOpenChange }: SummaryModalProps) {
  const modules = useStore((s) => s.modules);

  const data = useMemo(() => computeSchematicData(modules), [modules]);

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-[min(430px,calc(100vw-2rem))] rounded-[16px] border-none p-0 max-h-[90vh] overflow-y-auto"
      >
        <div className="px-[24px] pt-[24px] pb-[32px]">
          <DialogTitle className="sr-only">Sofa Details</DialogTitle>

          {/* Top-down schematic */}
          <div className="flex justify-center mb-[28px]">
            <TopDownSchematic data={data} />
          </div>

          {/* Dimensions */}
          <div className="mb-[24px]">
            <p className="text-[14px] font-medium text-black mb-[6px]">
              Dimensions (W x D x H) (cm):
            </p>
            <p className="text-[14px] text-black">
              {data.totalW} cm x {data.totalD} cm x {data.totalH} cm (seating height)
            </p>
          </div>

          {/* Module count */}
          <div className="mb-[24px]">
            <p className="text-[14px] font-medium text-black mb-[6px]">
              Number of modules:
            </p>
            {data.counts.map((c, i) => (
              <p key={i} className="text-[14px] text-black">
                {c.count} x {c.name} {c.dimLabel}
              </p>
            ))}
          </div>

          {/* What's in the box */}
          <div className="mb-[24px]">
            <p className="text-[14px] font-medium text-black mb-[6px]">
              What&apos;s in the box?
            </p>
            <ul className="list-disc pl-[20px] text-[14px] text-black space-y-[2px]">
              <li>EPP sofa foundation form</li>
              <li>Sofa inner foam pad</li>
              <li>Foam-filled inner sofa quilt</li>
              <li>Sofa cover</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
