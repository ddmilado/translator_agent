"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '../lib/utils';
import { SUPPORTED_LANGUAGES, SUPPORTED_FILE_TYPES, formatFileSize } from '../lib/utils';

// Supabase storage bucket name for document uploads
const BUCKET_NAME = 'documents';

export default function TranslationForm() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translationId, setTranslationId] = useState<string | null>(null);
  const [translationStatus, setTranslationStatus] = useState<'pending' | 'completed' | 'error'>('pending');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const router = useRouter();
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (translationId && translationStatus === 'pending') {
      interval = setInterval(async () => {
        try {
          const { data: translation, error: fetchError } = await supabase
            .from('translations')
            .select('*')
            .eq('id', translationId)
            .single();
          
          if (fetchError) throw fetchError;
          
          if (translation.status === 'completed' && translation.translated_file_path) {
            setTranslationStatus('completed');
            clearInterval(interval);
            
            // Redirect to download page
            router.push(`/download/${translationId}`);
          } else if (translation.status === 'error' || translation.status === 'failed') {
            setTranslationStatus('error');
            setError(translation.error || 'Translation failed. Please try again.');
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error checking translation status:', error);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [translationId, translationStatus, router]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create translation request in database
      const { data: translationData, error: translationError } = await supabase
        .from('translations')
        .insert([
          {
            source_file_path: fileName,
            source_language: sourceLanguage,
            target_language: targetLanguage,
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (translationError) throw translationError;

      setTranslationId(translationData.id);
      setTranslationStatus('pending');
    } catch (error) {
      console.error('Error submitting translation:', error);
      setError('Failed to submit translation request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-container rounded-2xl p-8 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ease-in-out",
            dragActive
              ? "border-primary/80 bg-primary/5"
              : "border-gray-200 dark:border-gray-700",
            file
              ? "bg-success/5 border-success/50"
              : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
          )}
        >
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={SUPPORTED_FILE_TYPES.join(',')}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <svg
                className={cn(
                  "w-12 h-12 transition-colors duration-200",
                  file ? "text-success" : "text-gray-400"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {file ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                )}
              </svg>
            </div>
            <div className="text-sm">
              {file ? (
                <div className="font-medium text-success">
                  {file.name} ({formatFileSize(file.size)})
                </div>
              ) : (
                <div>
                  <span className="font-semibold">Click to upload</span> or drag and
                  drop
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Supported formats: PDF, TXT, DOC, DOCX
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Language</label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 input-ring"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Language</label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 input-ring"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !file}
            className={cn(
              "relative px-6 py-2.5 rounded-lg font-medium transition-all duration-200",
              loading || !file
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white/90 rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              "Translate Document"
            )}
          </button>
        </div>
      </form>

      {translationStatus === 'pending' && translationId && (
        <div className="mt-8 p-6 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="text-primary font-medium">
              Translation in progress...
            </div>
          </div>
        </div>
      )}

      {translationStatus === 'completed' && downloadUrl && (
        <div className="mt-8 p-6 rounded-lg bg-success/5 border border-success/10">
          <div className="text-center space-y-4">
            <div className="text-success font-medium">
              Translation completed successfully!
            </div>
            <a
              href={downloadUrl}
              className="inline-flex items-center px-6 py-2.5 rounded-lg font-medium bg-success text-white shadow-lg shadow-success/25 hover:shadow-xl hover:shadow-success/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              download
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Translation
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
