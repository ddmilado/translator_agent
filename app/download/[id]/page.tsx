import { Suspense } from 'react';
import type { Metadata } from 'next';
import DownloadPageClient, { LoadingSpinner } from './DownloadPageClient';

interface PageProps {
  params: {
    id: string
  }
  searchParams: Record<string, string | string[] | undefined>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Download Translation ${params.id}`,
  };
}

export default function Page({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DownloadPageClient id={params.id} />
    </Suspense>
  );
}