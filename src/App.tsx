import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';
import type { Difficulty, ItemType, LearningItem, ReviewRating } from './types';
import { sampleItems } from './sampleData';

const KEY = 'english-learning-mvp-v1';
const tabs = ['dashboard', 'stock', 'add', 'import', 'review', 'example', 'mistakes'] as const;
type Tab = (typeof tabs)[number];

const toDate = (s?: string) => (s ? new Date(s) : new Date(0));
const isEnglishLike = (text: string) => /[A-Za-z]{3,}/.test(text);
const typeMap = (value: string): ItemType => (value === 'V' ? 'vocabulary' : value === 'V/S' ? 'phrase' : value === 'S/G' ? 'grammar' : 'expression');
const difficultyMap = (value: string): { difficulty: Difficulty; priority: 'normal' | 'high' } =>
  value.includes('★') ? { difficulty: 'hard', priority: 'high' } : { difficulty: 'medium', priority: 'normal' };

const score = (i: LearningItem) => {
  const now = new Date();
  const overdue = toDate(i.nextReviewAt) < now ? 100 : 0;
  const dueToday = toDate(i.nextReviewAt).toDateString() === now.toDateString() ? 70 : 0;
  const mistakes = i.mistakeCount * 5;
  const hard = i.difficulty === 'hard' ? 10 : 0;
  const old = Math.max(0, (now.getTime() - toDate(i.lastReviewedAt).getTime()) / 86400000);
  const exam = i.tags.some((t) => ['toefl', 'ielts', 'toeic'].includes(t.toLowerCase())) ? 8 : 0;
  return overdue + dueToday + mistakes + hard + old + exam;
};

const updateByRating = (item: LearningItem, r: ReviewRating): LearningItem => {
  const base = item.reviewCount === 0 ? 1 : Math.max(1, Math.round((toDate(item.nextReviewAt).getTime() - Date.now()) / 86400000));
  const nextDays = r === 'Again' ? 0 : r === 'Hard' ? Math.max(1, Math.round(base * 1.2)) : Math.max(2, Math.round(base * 2));
  return { ...item, lastReviewedAt: new Date().toISOString(), nextReviewAt: new Date(Date.now() + nextDays * 86400000).toISOString(), reviewCount: item.reviewCount + 1, mistakeCount: item.mistakeCount + (r === 'Again' ? 1 : 0), difficulty: r === 'Again' ? 'hard' : item.difficulty, updatedAt: new Date().toISOString() };
};

function App() {
  const [items, setItems] = useState<LearningItem[]>(() => JSON.parse(localStorage.getItem(KEY) || 'null') || sampleItems);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [query, setQuery] = useState('');
  const [reviewIdx, setReviewIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewMode, setReviewMode] = useState<'word' | 'example'>('word');
  const [importSummary, setImportSummary] = useState('');

  const persist = (next: LearningItem[]) => { setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const due = useMemo(() => items.filter((i) => toDate(i.nextReviewAt) <= new Date()).sort((a, b) => score(b) - score(a)), [items]);
  const mistakes = useMemo(() => [...items].sort((a, b) => b.mistakeCount - a.mistakeCount), [items]);

  const addItem = () => {
    const now = new Date().toISOString();
    persist([{ id: crypto.randomUUID(), type: 'vocabulary', headword: 'new item', japaneseMeaning: '', explanation: '', usages: [], tags: [], createdAt: now, updatedAt: now, nextReviewAt: now, mistakeCount: 0, reviewCount: 0, difficulty: 'medium', status: 'new' }, ...items]);
  };

  const importFile = async (file: File) => {
    let rows: Record<string, string>[] = [];
    let sheetName = 'CSV';
    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      const wb = XLSX.read(text, { type: 'string' });
      sheetName = wb.SheetNames[0];
      rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    } else {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      sheetName = wb.SheetNames.find((n) => n === '累積リスト') || wb.SheetNames[0];
      rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    }

    let added = 0, skipped = 0, errors = 0;
    const next = [...items];
    for (const row of rows) {
      try {
        const expression = String(row['項目'] || '').trim();
        const meaning = String(row['意味・瞬殺ルール'] || '').trim();
        if (!expression || !meaning) { errors++; continue; }
        const exists = next.some((i) => i.headword === expression && i.japaneseMeaning === meaning);
        if (exists) { skipped++; continue; }
        const area = String(row['領域'] || '').trim();
        const kbn = String(row['区分'] || '').trim();
        const memo = String(row['メモ/例'] || '').trim();
        const { difficulty, priority } = difficultyMap(String(row['優先度'] || ''));
        const now = new Date().toISOString();
        next.unshift({
          id: crypto.randomUUID(), originalId: String(row['ID'] || ''), type: typeMap(kbn), headword: expression, japaneseMeaning: meaning,
          explanation: memo, usages: [{ id: crypto.randomUUID(), label: area || kbn || 'usage', japaneseMeaning: meaning, explanation: memo, exampleSentence: isEnglishLike(memo) ? memo : '', exampleSentenceJa: '', difficulty, tags: [area, kbn].filter(Boolean), mistakeCount: 0, reviewCount: 0 }],
          tags: [area, kbn].filter(Boolean), sourceFileName: file.name, sourceSheetName: sheetName, priority,
          createdAt: now, updatedAt: now, lastReviewedAt: String(row['最終確認日'] || '') || undefined,
          nextReviewAt: now, mistakeCount: 0, reviewCount: 0, difficulty,
          status: String(row['ステータス'] || '').includes('master') ? 'mastered' : 'new',
        });
        added++;
      } catch {
        errors++;
      }
    }
    persist(next);
    setImportSummary(`ファイル: ${file.name} / シート: ${sheetName} / 候補: ${rows.length} / 追加: ${added} / 重複スキップ: ${skipped} / エラー: ${errors}`);
  };

  const reviewItem = due[reviewIdx];
  const reviewUsage = reviewItem?.usages[0];

  return <div className='container'>
    <header><h1>📘 My Ultimate English Learning App</h1></header>
    <nav className='nav'>{tabs.map((t) => <button key={t} className={tab===t?'active':''} onClick={() => setTab(t)}>{t}</button>)}</nav>

    {tab === 'dashboard' && <section className='grid'><article className='card'><h3>今日やるべき</h3><p>{due.length}</p></article><article className='card'><h3>弱点Top</h3><p>{mistakes[0]?.headword ?? '-'}</p></article><article className='card'><h3>総ストック</h3><p>{items.length}</p></article></section>}
    {tab === 'stock' && <section className='panel'><input placeholder='search expression' value={query} onChange={(e) => setQuery(e.target.value)} />{items.filter((i) => i.headword.toLowerCase().includes(query.toLowerCase())).map((i) => <article key={i.id} className='row'><b>{i.headword}</b><span>{i.type}</span><small>{i.japaneseMeaning}</small></article>)}</section>}
    {tab === 'add' && <section className='panel'><button onClick={addItem}>空アイテム追加</button></section>}
    {tab === 'import' && <section className='panel'><h3>Import (CSV / Excel)</h3><input type='file' accept='.csv,.xlsx' onChange={(e) => e.target.files && importFile(e.target.files[0])} /><p>対応列: ID / 区分 / 領域 / 項目 / 意味・瞬殺ルール / メモ/例 / 優先度 / ステータス / 最終確認日</p><pre>例: V,語彙,rationale,理由・根拠,...</pre><p>{importSummary}</p></section>}
    {tab === 'review' && <section className='panel'><div><button onClick={()=>setReviewMode('word')}>単語暗記モード</button><button onClick={()=>setReviewMode('example')}>例文意味確認モード</button></div>{reviewItem ? <div className='card'><h3>{reviewMode==='word'?reviewItem.headword:(reviewUsage?.exampleSentence||reviewItem.headword)}</h3><button onClick={()=>setShowAnswer(true)}>答えを見る</button>{showAnswer&&<div><p>{reviewItem.japaneseMeaning}</p><p>{reviewItem.explanation}</p></div>}{(['Easy','Hard','Again'] as ReviewRating[]).map((r) => <button key={r} onClick={() => {persist(items.map((i) => i.id === reviewItem.id ? updateByRating(i, r) : i)); setShowAnswer(false); setReviewIdx((p)=>Math.min(p+1,due.length-1));}}>{r}</button>)}</div> : <p>復習対象なし</p>}</section>}
    {tab === 'example' && <section className='panel'>{items.flatMap((i) => i.usages.map((u) => ({ i, u }))).map(({ i, u }) => <article key={u.id} className='row'><b>{u.exampleSentence || i.headword}</b><small>{u.japaneseMeaning}</small><button onClick={() => persist(items.map((it) => it.id === i.id ? { ...it, mistakeCount: it.mistakeCount + 1, updatedAt: new Date().toISOString() } : it))}>間違えた</button></article>)}</section>}
    {tab === 'mistakes' && <section className='panel'>{mistakes.filter((i) => i.mistakeCount > 0).map((i) => <article key={i.id} className='row'>{i.headword} / {i.mistakeCount}</article>)}</section>}
  </div>;
}

export default App;
