# 株式市場日次レポート生成ツール 設計書

## 1. プロジェクト概要

株式市場のデータ（JSON）を入力として受け取り、見やすいHTMLレポートを生成するNode.jsツール。
ブラウザで直接開ける静的HTMLファイルを出力する。

## 2. 技術スタック

| 項目 | 選定 | 理由 |
|------|------|------|
| ランタイム | Node.js | サーバー不要、CLIツールとして動作 |
| テスト | Jest | 標準的、設定が簡単 |
| テンプレート | 自前（テンプレートリテラル） | 依存ゼロで保守しやすい |
| グラフ | なし（v1） | まずはテーブル表示のみ。v2で追加予定 |

## 3. ディレクトリ構成

```
stock-report/
├── package.json
├── src/
│   ├── formatData.js      # データ整形・計算ロジック
│   ├── generateHtml.js    # HTML文字列の生成
│   └── main.js            # エントリーポイント（ファイル読み書き）
├── tests/
│   ├── formatData.test.js
│   └── generateHtml.test.js
├── data/
│   └── sample.json        # サンプル入力データ
└── output/
    └── (生成されたHTMLがここに出力される)
```

## 4. データ構造

### 入力データ (JSON)

```json
{
  "date": "2026-03-05",
  "markets": [
    {
      "name": "日経平均",
      "close": 38245.78,
      "change": 312.45,
      "changePercent": 0.82
    },
    {
      "name": "S&P 500",
      "close": 5123.45,
      "change": -23.12,
      "changePercent": -0.45
    }
  ]
}
```

### フィールド定義

| フィールド | 型 | 説明 |
|---|---|---|
| date | string | レポート日付（YYYY-MM-DD） |
| markets | array | 市場データの配列 |
| markets[].name | string | 市場名 |
| markets[].close | number | 終値 |
| markets[].change | number | 前日比（値） |
| markets[].changePercent | number | 前日比（%） |

## 5. モジュール仕様

### formatData.js

| 関数 | 入力 | 出力 | 説明 |
|------|------|------|------|
| `formatPrice(number)` | `38245.78` | `"38,245.78"` | 数値をカンマ区切りに整形 |
| `formatChange(change, percent)` | `312.45, 0.82` | `"+312.45 (+0.82%)"` | 前日比を符号付き文字列に |
| `formatDate(dateStr)` | `"2026-03-05"` | `"2026年3月5日"` | 日付を日本語表記に |
| `getDirection(change)` | `312.45` | `"up"` | 上昇/下降/横ばいを判定。0は`"unchanged"` |

### generateHtml.js

| 関数 | 入力 | 出力 | 説明 |
|------|------|------|------|
| `generateHtml(data)` | レポートJSON | HTML文字列 | 完全なHTMLドキュメントを生成 |

生成するHTMLの要件:
- `<!DOCTYPE html>` から始まる完全なHTML
- レスポンシブ対応（viewport meta タグ）
- 日本語（lang="ja"）
- 市場データをテーブルで表示
- 上昇は緑、下降は赤で色分け
- CSSはHTML内にインライン（外部ファイル不要）

### main.js

| 関数 | 説明 |
|------|------|
| `main(inputPath, outputPath)` | JSONを読み込み→HTMLを生成→ファイルに書き出し |

## 6. エラーハンドリング

| ケース | 処理 |
|------|------|
| 入力ファイルが存在しない | エラーメッセージを表示して終了 |
| JSONのパースに失敗 | エラーメッセージを表示して終了 |
| markets配列が空 | 「データがありません」と表示するHTMLを生成 |

## 7. 今後の拡張予定（v2）

- [ ] Chart.jsによるグラフ表示
- [ ] 為替データ（USD/JPY等）の追加
- [ ] 複数日分のデータを受け取り推移表示
- [ ] ダークモード対応
