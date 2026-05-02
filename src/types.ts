export type ItemType =
  | 'vocabulary'
  | 'idiom'
  | 'phrase'
  | 'syntax'
  | 'grammar'
  | 'sentence-pattern'
  | 'email'
  | 'mistake'
  | 'expression';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'normal';
export type ReviewRating = 'Easy' | 'Hard' | 'Again';

export interface Usage {
  id: string;
  label: string;
  japaneseMeaning: string;
  explanation: string;
  exampleSentence: string;
  exampleSentenceJa: string;
  difficulty: Difficulty;
  tags: string[];
  mistakeCount: number;
  reviewCount: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
}

export interface LearningItem {
  id: string;
  type: ItemType;
  headword: string;
  japaneseMeaning: string;
  explanation: string;
  usages: Usage[];
  myWrongSentence?: string;
  correctSentence?: string;
  tags: string[];
  sourceFileName?: string;
  sourceSheetName?: string;
  originalId?: string;
  createdAt: string;
  updatedAt: string;
  lastReviewedAt?: string;
  nextReviewAt: string;
  mistakeCount: number;
  reviewCount: number;
  difficulty: Difficulty;
  status: 'new' | 'learning' | 'mastered';
}
