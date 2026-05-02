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

- 学習アイテム管理（vocabulary / idiom / phrase / syntax / grammar / sentence-pattern / email / mistake / expression）
- 複数用法（meaning, explanation, example sentence, 日本語訳, difficulty, tags）
- Review（Easy / Hard / Again）で次回復習日更新
- Dashboard（今日復習件数・期限切れ・総数・ミス多い項目）
- Example Practice（例文を使った練習）
- Mistakes一覧
- localStorage保存
- CSV / Excel（.xlsx）インポート

## CSVインポート形式（MVP）

ヘッダ行ありで、以下順を想定:

```csv
type,headword,japaneseMeaning,explanation,tags
vocabulary,rationale,理由・根拠,判断の根拠となる考え方,toefl|formal
phrase,on the spot,その場で,即時対応を示す表現,toeic
```

- `tags` は `|` 区切り。
- インポート時に `sourceFileName` にアップロードファイル名を保存。

## Excel（.xlsx）インポート仕様

- 使用ライブラリ: `xlsx`（SheetJS）
- シート選択:
  - `累積リスト` シートがあれば優先
  - なければ最初の非空シートを使用
- 列マッピング:
  - `項目` → `expression`
  - `意味・瞬殺ルール` → `japaneseMeaning`
  - `メモ/例` → `explanation`
  - `領域` → `tags`
  - `ID` → `originalId`
- 追加メタデータ:
  - `sourceFileName`（ファイル名）
  - `sourceSheetName`（シート名）
- 区分マッピング（`区分`列）:
  - `V` → `vocabulary`
  - `V/S` → `phrase`
  - `S/G` → `grammar`
  - その他 → `expression`
- 優先度マッピング（`優先度`列）:
  - `★` → `hard`
  - その他 → `normal`
- 重複判定:
  - `項目` + `意味・瞬殺ルール` が同じ行は重複としてスキップ
- Import画面で表示される結果:
  - 読み込んだファイル名
  - シート名
  - 候補件数
  - 追加件数
  - 重複スキップ件数
  - エラー件数

## 基本的な使い方

1. Dashboard で今日の復習対象を確認
2. Add で新規登録（MVPは最小UI）
3. Import でCSV/XLSXを一括追加
4. Review で出題し Easy/Hard/Again を選択
5. Example で例文ベース練習、間違えたら「間違えた」記録
6. Mistakes で弱点のみ集中復習
