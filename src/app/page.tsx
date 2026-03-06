'use client';

import { Providers } from './providers';
import { ConfiguratorShell } from '@/components/configurator/configurator-shell';

export default function ConfiguratorPage() {
  return (
    <Providers>
      <ConfiguratorShell />
    </Providers>
  );
}
