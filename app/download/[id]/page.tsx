import { Suspense } from 'react';
import type { Metadata } from 'next';

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

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

interface DownloadPageClientProps {
  id: string;
}

export function DownloadPageClient({ id }: DownloadPageClientProps) {
  "use client";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  interface Translation {
  id: string;
  source_language: string;
  target_language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'error';
  translated_file_path?: string;
  created_at: string;
}

const [translation, setTranslation] = useState<Translation | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTranslation() {
      try {
        // Get translation details
        const { data, error } = await supabase
          .from('translations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setTranslation(data);

        // If translation is completed, get download URL
        if (data.status === 'completed' && data.translated_file_path) {
          const { data: urlData } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(data.translated_file_path, 60 * 60); // 1 hour expiry

          if (urlData) {
            setDownloadUrl(urlData.signedUrl);
          }
        } else if (data.status === 'failed' || data.status === 'error') {
          setError('Translation failed. Please try again.');
        } else if (data.status === 'pending' || data.status === 'processing') {
          // Redirect back to home if translation is still in progress
          router.push('/');
        }
      } catch (err) {
        console.error('Error fetching translation:', err);
        setError('Failed to load translation details');
      } finally {
        setLoading(false);
      }
    }

    fetchTranslation();
  }, [id, router]);

  const handleDownload = async () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      
      // After a short delay, redirect back to the upload page
      setTimeout(() => {
        router.push('/');
      }, 1000);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-container rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold mb-4">Translation Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link href="/" className="inline-block py-3 px-6 rounded-lg font-medium bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white transition-all duration-200">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-container rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-bold mb-4">Translation Complete</h2>
        
        {translation && (
          <div className="mb-6 text-left">
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="text-gray-400">Source Language:</div>
              <div className="font-medium">{translation.source_language.toUpperCase()}</div>
              
              <div className="text-gray-400">Target Language:</div>
              <div className="font-medium">{translation.target_language.toUpperCase()}</div>
              
              <div className="text-gray-400">Created:</div>
              <div className="font-medium">{new Date(translation.created_at).toLocaleString()}</div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleDownload}
          className="w-full py-3 px-6 rounded-lg font-medium bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white transition-all duration-200 flex items-center justify-center mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Translation
        </button>
        
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
          Return to Home
        </Link>
      </div>
    </div>
  );
}