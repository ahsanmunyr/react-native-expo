import { create } from 'zustand';

export type Language = 'en' | 'ar';

export interface Segment {
  id: string;
  text: string;
  language: Language;
}

interface TranscriptionStore {
  segments: Segment[];
  liveText: string;
  isRecording: boolean;
  language: Language;
  appendWord: (word: string) => void;
  flushLive: () => void;
  setRecording: (v: boolean) => void;
  setLanguage: (lang: Language) => void;
  clear: () => void;
}

export const useTranscriptionStore = create<TranscriptionStore>((set, get) => ({
  segments: [],
  liveText: '',
  isRecording: false,
  language: 'en',

  appendWord: (word) =>
    set((s) => ({ liveText: s.liveText ? `${s.liveText} ${word}` : word })),

  flushLive: () => {
    const { liveText, language } = get();
    if (!liveText.trim()) return;
    set((s) => ({
      segments: [
        ...s.segments,
        { id: Date.now().toString(), text: liveText.trim(), language },
      ],
      liveText: '',
    }));
  },

  setRecording: (isRecording) => set({ isRecording }),
  setLanguage: (language) => set({ language }),
  clear: () => set({ segments: [], liveText: '', isRecording: false }),
}));
