'use client';

import { useEffect } from 'react';
import { useStore } from '@/stores';

export function NotificationBar() {
  const notification = useStore((s) => s.notification);
  const clearNotification = useStore((s) => s.clearNotification);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(clearNotification, 3000);
    return () => clearTimeout(timer);
  }, [notification, clearNotification]);

  if (!notification) return null;

  return (
    <section className="bg-white px-[18px] py-[9px]">
      <div className={`flex items-center justify-center gap-[8px] rounded-[6px] py-[12px] px-[15px] ${
        notification.type === 'success' ? 'bg-[#e8f5e9]' : 'bg-[#eee]'
      }`}>
        <span className="text-[13px] text-black text-center">
          {notification.message}
        </span>
      </div>
    </section>
  );
}
