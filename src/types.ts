export interface Phrase {
  id: number;
  contextLabel: string;
  optionA: string;
  optionB: string;
  userChoice: string;
  traits: Record<TraitName, number>;
}

export type TraitName =
  | 'Clarity'
  | 'Warmth'
  | 'Playfulness'
  | 'Boldness'
  | 'Sophistication'
  | 'Formality'
  | 'Inspiration'
  | 'Empathy';

export interface VoiceArchetype {
  name: string;
  traits: TraitName[];
  vibe: string;
  doWrite: string[];
  dontWrite: string[];
}

export type AppState = 'intro' | 'quiz' | 'results';

export interface UserData {
  email: string;
}