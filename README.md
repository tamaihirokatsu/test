# Ultimate English Learning App (MVP)

React + TypeScript + Vite で作成した、英語ミス復習・ストック学習アプリです。

## 起動方法

```bash
npm install
npm run dev
```

本番ビルド:

```bash
npm run build
npm run preview
```

## MVP機能

- 学習アイテム管理（vocabulary / idiom / phrase / syntax / grammar / sentence-pattern / email / mistake）
- 複数用法（meaning, explanation, example sentence, 日本語訳, difficulty, tags）
- Review（Easy / Hard / Again）で次回復習日更新
- Dashboard（今日復習件数・期限切れ・総数・ミス多い項目）
- Example Practice（例文を使った練習）
- Mistakes一覧
- localStorage保存
- CSVインポート（既存データに追加・source file name保存）

## CSVインポート形式（MVP）

ヘッダ行ありで、以下順を想定:

```csv
type,headword,japaneseMeaning,explanation,tags
vocabulary,rationale,理由・根拠,判断の根拠となる考え方,toefl|formal
phrase,on the spot,その場で,即時対応を示す表現,toeic
```

- `tags` は `|` 区切り。
- インポート時に `sourceFileName` にアップロードファイル名を保存。

## Excel対応

- MVPはCSVのみ。
- 将来的に `.xlsx` の直接取込を追加予定（Sheet選択・列マッピング対応）。

## 基本的な使い方

1. Dashboard で今日の復習対象を確認
2. Add で新規登録（MVPは最小UI）
3. Import でCSVを一括追加
4. Review で出題し Easy/Hard/Again を選択
5. Example で例文ベース練習、間違えたら「間違えた」記録
6. Mistakes で弱点のみ集中復習

