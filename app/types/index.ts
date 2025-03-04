export interface Translation {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalFileId: string;
  translatedFileId?: string;
  status: 'pending' | 'completed' | 'error';
  createdAt: Date;
}

export interface Language {
  code: string;
  name: string;
}
