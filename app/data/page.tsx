'use client';
export const dynamic = 'force-dynamic';


import DataComponent from '@/page-components/data-page';
import { ClientOnly } from '@/components/ClientOnly';

export default function DataPage() {
  return (
    <ClientOnly>
      <DataComponent />
    </ClientOnly>
  );
}
