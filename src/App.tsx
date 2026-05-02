import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';
import type { Difficulty, LearningItem, ReviewRating, Usage } from './types';
import { sampleItems } from './sampleData';

const KEY = 'english-learning-mvp-v1';
const today = () => new Date();
const toDate = (s?: string) => (s ? new Date(s) : new Date(0));

const score = (i: LearningItem) => {
  const overdue = toDate(i.nextReviewAt) < today() ? 100 : 0;
  const dueToday = toDate(i.nextReviewAt).toDateString() === today().toDateString() ? 70 : 0;
  const mistakes = i.mistakeCount * 5;
  const hard = i.difficulty === 'hard' ? 10 : 0;
  const old = Math.max(0, (today().getTime() - toDate(i.lastReviewedAt).getTime()) / 86400000);
  const exam = i.tags.some((t) => ['toefl', 'ielts', 'toeic'].includes(t.toLowerCase())) ? 8 : 0;
  return overdue + dueToday + mistakes + hard + old + exam;
};

const updateByRating = (item: LearningItem, r: ReviewRating): LearningItem => {
  const base = item.reviewCount === 0 ? 1 : Math.max(1, Math.round((toDate(item.nextReviewAt).getTime() - Date.now()) / 86400000));
  const nextDays = r === 'Again' ? 0 : r === 'Hard' ? Math.max(1, Math.round(base * 1.2)) : Math.max(2, Math.round(base * 2));
  return {
    ...item,
    lastReviewedAt: new Date().toISOString(),
    nextReviewAt: new Date(Date.now() + nextDays * 86400000).toISOString(),
    reviewCount: item.reviewCount + 1,
    mistakeCount: item.mistakeCount + (r === 'Again' ? 1 : 0),
    difficulty: r === 'Again' ? 'hard' : item.difficulty,
    updatedAt: new Date().toISOString(),
  };
};

type ImportResult = {
  fileName: string;
  sheetName: string;
  candidateCount: number;
  addedCount: number;
  skippedDuplicateCount: number;
  errorCount: number;
};

function App() {
  const [items, setItems] = useState<LearningItem[]>(() => JSON.parse(localStorage.getItem(KEY) || 'null') || sampleItems);
  const [tab, setTab] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [reviewIdx, setReviewIdx] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const persist = (next: LearningItem[]) => { setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const due = useMemo(() => items.filter(i => toDate(i.nextReviewAt) <= today()).sort((a,b)=>score(b)-score(a)), [items]);
  const mistakes = useMemo(() => [...items].sort((a,b)=>b.mistakeCount-a.mistakeCount), [items]);

  const addItem = () => {
    const n: LearningItem = { id: crypto.randomUUID(), type: 'vocabulary', headword: 'new item', japaneseMeaning: '', explanation: '', usages: [], tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), nextReviewAt: new Date().toISOString(), mistakeCount:0, reviewCount:0, difficulty:'medium', status:'new'};
    persist([n, ...items]);
  };

  const mapType = (kind?: string): LearningItem['type'] => {
    if (kind === 'V') return 'vocabulary';
    if (kind === 'V/S') return 'phrase';
    if (kind === 'S/G') return 'grammar';
    return 'expression';
  };

  const importFile = (file: File) => {
    if (file.name.toLowerCase().endsWith('.csv')) {
      file.text().then((text) => {
        const rows = text.split('\n').slice(1).filter(Boolean);
        const imported = rows.map((r) => {
          const [type, headword, japaneseMeaning, explanation, tags] = r.split(',');
          const now = new Date().toISOString();
          return { id: crypto.randomUUID(), type: (type as LearningItem['type']) || 'phrase', headword, japaneseMeaning, explanation, usages: [], tags: (tags||'').split('|').filter(Boolean), sourceFileName: file.name, createdAt: now, updatedAt: now, nextReviewAt: now, mistakeCount:0, reviewCount:0, difficulty:'medium' as Difficulty, status:'new' as const };
        });
        persist([...imported, ...items]);
        setImportResult({ fileName: file.name, sheetName: 'CSV', candidateCount: rows.length, addedCount: imported.length, skippedDuplicateCount: 0, errorCount: 0 });
      });
      return;
    }

    file.arrayBuffer().then((buf) => {
      const wb = XLSX.read(buf, { type: 'array' });
      const preferred = wb.SheetNames.find((name: string) => name === '累積リスト');
      const fallback = wb.SheetNames.find((name: string) => {
        const sheet = wb.Sheets[name];
        const range = sheet['!ref'];
        return !!range && range !== 'A1';
      });
      const sheetName = preferred || fallback;
      if (!sheetName) {
        setImportResult({ fileName: file.name, sheetName: '-', candidateCount: 0, addedCount: 0, skippedDuplicateCount: 0, errorCount: 1 });
        return;
      }

      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
      const existing = new Set(items.map((i) => `${i.headword}__${i.japaneseMeaning}`));
      const now = new Date().toISOString();
      let addedCount = 0;
      let skippedDuplicateCount = 0;
      let errorCount = 0;

      const imported: LearningItem[] = rows.flatMap((row: Record<string, string>) => {
        const expression = String(row['項目'] || '').trim();
        const japaneseMeaning = String(row['意味・瞬殺ルール'] || '').trim();
        if (!expression || !japaneseMeaning) {
          errorCount += 1;
          return [];
        }
        const key = `${expression}__${japaneseMeaning}`;
        if (existing.has(key)) {
          skippedDuplicateCount += 1;
          return [];
        }
        existing.add(key);
        addedCount += 1;
        return [{
          id: crypto.randomUUID(),
          originalId: String(row['ID'] || '').trim(),
          type: mapType(String(row['区分'] || '').trim()),
          headword: expression,
          japaneseMeaning,
          explanation: String(row['メモ/例'] || '').trim(),
          usages: [],
          tags: String(row['領域'] || '').split(/[|,]/).map((t) => t.trim()).filter(Boolean),
          sourceFileName: file.name,
          sourceSheetName: sheetName,
          createdAt: now,
          updatedAt: now,
          nextReviewAt: now,
          mistakeCount: 0,
          reviewCount: 0,
          difficulty: String(row['優先度'] || '').trim() === '★' ? 'hard' : 'normal',
          status: 'new',
        } as LearningItem];
      });

      persist([...imported, ...items]);
      setImportResult({ fileName: file.name, sheetName, candidateCount: rows.length, addedCount, skippedDuplicateCount, errorCount });
    });
  };

  const reviewItem = due[reviewIdx];

  return <div className='container'>
    <h1>My Ultimate English Learning App</h1>
    <nav>{['dashboard','stock','add','import','review','example','mistakes'].map(t=><button key={t} onClick={()=>setTab(t)}>{t}</button>)}</nav>
    {tab==='dashboard' && <section><p>今日復習: {due.length}</p><p>期限切れ: {items.filter(i=>toDate(i.nextReviewAt)<today()).length}</p><p>総ストック: {items.length}</p><ul>{mistakes.slice(0,5).map(i=><li key={i.id}>{i.headword} ({i.mistakeCount})</li>)}</ul></section>}
    {tab==='stock' && <section><input placeholder='search' value={query} onChange={e=>setQuery(e.target.value)} />{items.filter(i=>i.headword.toLowerCase().includes(query.toLowerCase())).map(i=><article key={i.id}><b>{i.headword}</b> [{i.type}] - {i.japaneseMeaning}</article>)}</section>}
    {tab==='add' && <section><button onClick={addItem}>空アイテム追加</button></section>}
    {tab==='import' && <section><input type='file' accept='.csv,.xlsx' onChange={e=>e.target.files&&importFile(e.target.files[0])}/>{importResult && <div><p>ファイル名: {importResult.fileName}</p><p>シート名: {importResult.sheetName}</p><p>候補件数: {importResult.candidateCount}</p><p>追加件数: {importResult.addedCount}</p><p>重複スキップ件数: {importResult.skippedDuplicateCount}</p><p>エラー件数: {importResult.errorCount}</p></div>}</section>}
    {tab==='review' && <section>{reviewItem ? <div><h3>{reviewItem.headword}</h3><p>{reviewItem.japaneseMeaning}</p><p>{reviewItem.explanation}</p>{reviewItem.usages.map((u:Usage)=><div key={u.id}>{u.exampleSentence} / {u.exampleSentenceJa}</div>)}{(['Easy','Hard','Again'] as ReviewRating[]).map(r=><button key={r} onClick={()=>{const next=items.map(i=>i.id===reviewItem.id?updateByRating(i,r):i); persist(next); setReviewIdx((p)=>Math.min(p+1,due.length-1));}}>{r}</button>)}</div> : <p>復習対象なし</p>}</section>}
    {tab==='example' && <section>{items.flatMap(i=>i.usages.map(u=>({i,u}))).slice(0,30).map(({i,u})=><article key={u.id}><b>{u.exampleSentence}</b><p>{u.exampleSentenceJa}</p><button onClick={()=>persist(items.map(it=>it.id===i.id?{...it,mistakeCount:it.mistakeCount+1,updatedAt:new Date().toISOString()}:it))}>間違えた</button></article>)}</section>}
    {tab==='mistakes' && <section>{mistakes.filter(i=>i.mistakeCount>0).map(i=><article key={i.id}>{i.headword} / mistakes:{i.mistakeCount}</article>)}</section>}
  </div>;
}

export default App;
