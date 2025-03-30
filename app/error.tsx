"use client";

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-container rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
        <svg
          className="w-16 h-16 text-red-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-300 mb-6">{error.message || 'An unexpected error occurred'}</p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="inline-block py-3 px-6 rounded-lg font-medium bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white transition-all duration-200"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-block py-3 px-6 rounded-lg font-medium border border-violet-500 text-violet-500 hover:bg-violet-500 hover:text-white transition-all duration-200"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}