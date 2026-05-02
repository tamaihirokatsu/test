# Ultimate English Learning App (MVP+)

## 起動方法

```bash
npm install
npm run dev
npm run build
```

## Import仕様（Excel / CSV）

アプリ内部は `LearningItem` / `Usage` の正規構造で統一し、Excel/CSVは取り込み時に変換します。

### 対応拡張子
- `.csv`
- `.xlsx`

### シート選択ルール（Excel）
1. `累積リスト` シートがあれば最優先
2. なければ先頭シート

### 現在のExcel列マッピング（決め打ち）
- `ID` → `originalId`
- `区分` → `type`
- `領域` → `tags` / domain
- `項目` → `headword`
- `意味・瞬殺ルール` → `japaneseMeaning`
- `メモ/例` → `explanation`
- `優先度` → `difficulty` / `priority`
- `ステータス` → `status`
- `最終確認日` → `lastReviewedAt`

### type変換
- `V` → `vocabulary`
- `V/S` → `phrase`
- `S/G` → `grammar`
- その他 → `expression`

### difficulty変換
- `★` → `hard` + `high priority`
- `通常` または空 → `medium` + `normal`

### Usage自動生成
1行につき最低1つ生成:
- `usageLabel`: 領域 or 区分
- `japaneseMeaning`: 意味・瞬殺ルール
- `explanation`: メモ/例
- `exampleSentence`: メモ/例が英語らしければ採用
- `difficulty`: 優先度から変換
- `tags`: 領域, 区分

### 重複スキップ
同じ `項目(headword)` かつ 同じ `意味・瞬殺ルール(japaneseMeaning)` はスキップ。

### 取り込み結果表示
- ファイル名
- シート名
- インポート候補件数
- 追加件数
- 重複スキップ件数
- エラー件数

### 標準インポート形式サンプル
```csv
ID,区分,領域,項目,意味・瞬殺ルール,メモ/例,優先度,ステータス,最終確認日
1001,V,TOEFL,rationale,理由・根拠,What is the rationale behind this?,★,new,2026-04-28
1002,V/S,Academic,fall behind on coursework,課題提出に遅れる,I fell behind on coursework.,通常,learning,2026-04-20
```

## 今後の改善
- Import Wizard（列対応をユーザーが選択できるUI）を追加予定。
