export interface TextSegment {
  text: string;
  syllables: string[];
  type: 'syllable' | 'word' | 'sentence';
}

export type ReadingMode = 'syllables' | 'words' | 'sentences';

export interface VoiceSettings {
  rate: number;
  pitch: number;
  voice: SpeechSynthesisVoice | null;
}