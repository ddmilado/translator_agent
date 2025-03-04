"use client";

import Image from "next/image";
import TranslationForm from './components/TranslationForm';

export default function Home() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 md:px-8 animate-gradient">
      {/* Decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.1)_0,rgba(124,58,237,0)_50%)]" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.12)_0,rgba(124,58,237,0)_70%)] blur-2xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.12)_0,rgba(124,58,237,0)_70%)] blur-2xl" />
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent animate-gradient relative">
            <span className="absolute inset-0 bg-gradient-to-r from-violet-400/20 via-purple-400/20 to-violet-400/20 blur-xl" />
            Document Translator
          </h1>
          <p className="text-lg text-gray-300">
            Translate your documents instantly with our AI-powered translation service
          </p>
        </div>

        <TranslationForm />

        <footer className="mt-16 text-center text-sm text-gray-500">
          Powered by Next.js and Appwrite
        </footer>
      </div>
    </main>
  );
}
