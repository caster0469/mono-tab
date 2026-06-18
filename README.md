# Mono Tab

Mono Tab は Brave / Chromium 用の、超シンプルなモノクロ新規タブ拡張です。
毎回開いても邪魔にならないように、表示する情報を時計・日付・検索・クイックリンクだけに絞っています。
外部ライブラリは使わず、すべてローカルファイルだけで動作します。

## 機能

- 大きな時計
- 日本語の日付
- 検索バー
  - Enter で検索します。
  - URL のような入力はその URL へ移動します。
  - それ以外は Google 検索を開きます。
- クイックリンク
- 薄いドット / グリッド / 光のにじみ背景
- 右下の小さな設定アイコン風ボタン
  - 現時点では見た目だけです。
  - 将来的に設定画面を追加しやすいよう、独立したボタンとして置いています。

## Brave / Chromium で読み込む手順

1. Brave のアドレスバーで `brave://extensions` を開く
2. 右上の「デベロッパーモード」を ON にする
3. 「パッケージ化されていない拡張機能を読み込む」を押す
4. このフォルダを選択する
5. 新しいタブを開いて表示を確認する

Chromium 系ブラウザでも、同様に拡張機能ページから「パッケージ化されていない拡張機能」として読み込めます。

## クイックリンクを変更する場所

`index.html` の `<nav class="quick-links">` 内にあるリンクを書き換えてください。
初期値は次の 5 つです。

- YouTube: `https://www.youtube.com/`
- ChatGPT: `https://chat.openai.com/`
- GitHub: `https://github.com/`
- Gmail: `https://mail.google.com/`
- Drive: `https://drive.google.com/`

例:

```html
<a class="quick-link" href="https://github.com/">GitHub</a>
```

## 色を変更する場所

`style.css` の先頭にある `:root` の CSS 変数を編集してください。

```css
:root {
  --background: #050505;
  --main-text: #eeeeee;
  --sub-text: #999999;
  --border: #2a2a2a;
  --card-background: rgba(18, 18, 18, 0.72);
}
```

## 構成

- `manifest.json`: Manifest V3 の拡張機能設定
- `index.html`: 新しいタブとして表示される画面
- `style.css`: モノクロの見た目とレスポンシブレイアウト
- `script.js`: 時計、日付、検索処理
- `README.md`: 説明と編集方法

## 削除した機能

今回のシンプル化で、以下の機能と関連コードを削除しました。

- CPU / RAM / SSD / Wi-Fi などのステータス表示
- Battery / Network / Storage / Session 表示
- TODO カード、チェックリスト、追加フォーム
- MEMO カード、textarea、自動保存処理
- TODO / MEMO 用の `localStorage` 保存処理
- 使われなくなった JavaScript 関数と CSS
