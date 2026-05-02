import type { LearningItem, ItemType } from './types';

const now = new Date().toISOString();
const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

const mk = (headword: string, type: ItemType, ja: string, tags: string[] = []): LearningItem => ({
  id: crypto.randomUUID(),
  type,
  headword,
  japaneseMeaning: ja,
  explanation: `${headword} の学習項目です。`,
  usages: [
    {
      id: crypto.randomUUID(),
      label: '用法1',
      japaneseMeaning: ja,
      explanation: '主要用法',
      exampleSentence: `Use: ${headword}.`,
      exampleSentenceJa: `${headword} の例文。`,
      difficulty: 'medium',
      tags,
      mistakeCount: 0,
      reviewCount: 0,
      nextReviewAt: now,
    },
  ],
  tags,
  createdAt: now,
  updatedAt: now,
  nextReviewAt: day(-1),
  mistakeCount: 0,
  reviewCount: 0,
  difficulty: 'medium',
  status: 'new',
});

export const sampleItems: LearningItem[] = [
  mk('rationale', 'vocabulary', '理由、根拠、判断の背後にある考え方', ['toefl']),
  mk('be committed to doing', 'idiom', '〜することに尽力している'),
  mk('somewhere in the archives', 'phrase', '資料庫のどこかに'),
  mk('on the spot', 'phrase', 'その場で'),
  mk('fall behind on coursework', 'phrase', '課題提出に遅れる', ['ielts']),
  mk('Could you give me some suggestions on how to ~?', 'email', '〜についてアドバイスをいただけますか？'),
  mk('I am writing to ask for your advice on ~', 'email', '〜についてご助言をお願いしたくご連絡しました'),
  mk('by the deadline', 'phrase', '締切までに'),
  mk('manage your workload', 'phrase', '仕事量・学習量を管理する'),
  mk('academic responsibilities', 'phrase', '学業上の責務'),
  mk('special accommodations', 'phrase', '特別配慮'),
  mk('The latter way of saying it is much clearer', 'sentence-pattern', '後者の言い方のほうが明確です'),
  mk('How long will it take me to get a 7.0 on IELTS?', 'mistake', 'IELTS 7.0取得までどれくらいかかりますか', ['ielts']),
];

sampleItems[0].usages = [
  {
    id: crypto.randomUUID(), label: '用法1', japaneseMeaning: '理由、根拠', explanation: '判断の理由',
    exampleSentence: 'What is the rationale behind this policy?', exampleSentenceJa: 'この方針の根拠は何ですか。',
    difficulty: 'medium', tags: ['formal'], mistakeCount: 0, reviewCount: 0, nextReviewAt: now,
  },
  {
    id: crypto.randomUUID(), label: '用法2', japaneseMeaning: '判断や仕様の背後にある考え方', explanation: '設計思想',
    exampleSentence: 'Please explain the rationale for the feature design.', exampleSentenceJa: '機能設計の背景にある考え方を説明してください。',
    difficulty: 'hard', tags: ['business'], mistakeCount: 0, reviewCount: 0, nextReviewAt: now,
  },
  {
    id: crypto.randomUUID(), label: '用法3', japaneseMeaning: '行動を正当化する論理', explanation: '正当化の理屈',
    exampleSentence: 'He offered a weak rationale for his decision.', exampleSentenceJa: '彼は決定に対して弱い正当化しか示せなかった。',
    difficulty: 'hard', tags: ['toefl'], mistakeCount: 0, reviewCount: 0, nextReviewAt: now,
  },
];
