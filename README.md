# Mono Tab

Brave / Chromium の新しいタブページを、モノクロでミニマルなローカルホーム画面に置き換える Manifest V3 拡張機能です。
外部ライブラリは使わず、すべてローカルファイルだけで動作します。

## Brave で読み込む手順

1. Brave のアドレスバーで `brave://extensions` を開く
2. 右上の「デベロッパーモード」を ON にする
3. 「パッケージ化されていない拡張機能を読み込む」を押す
4. このフォルダを選択する
5. 新しいタブを開いて表示を確認する

## 変更しやすい場所

### クイックリンクを変更する

`index.html` の `<nav class="quick-links">` 内にある `<a class="quick-link">` を編集してください。
リンク名と URL をそのまま書き換えられます。

```html
<a class="quick-link" href="https://github.com/">
  <span class="quick-icon">◆</span>
  <span>GitHub</span>
</a>
```

「＋」ボタンは見た目だけ用意してあります。今後リンク追加機能を実装する場合は、同じ `quick-link` 構造を使うと追加しやすいです。

### ステータスカードを変更する

`script.js` の `statusItems` 配列を編集してください。
実際の PC 情報は取得しておらず、表示用のダミー値です。

```js
const statusItems = [
  { label: "CPU", value: 12, icon: "▣" },
  { label: "RAM", value: 22, icon: "▤" },
];
```

### 初期 Todo を変更する

`script.js` の `defaultTodos` 配列を編集してください。
一度ブラウザで Todo を保存すると、以降は `localStorage` の内容が優先されます。

### メモ / Todo の保存先

メモと Todo はブラウザの `localStorage` に保存されます。
拡張機能を再読み込みしても同じブラウザプロファイル内で保持されます。

### 色や余白を変更する

`style.css` の先頭にある `:root` の CSS 変数を編集してください。

```css
:root {
  --bg: #050505;
  --text: #eeeeee;
  --muted: #999999;
  --card: rgba(18, 18, 18, 0.72);
  --border: #2a2a2a;
}
```

## 構成

- `manifest.json`: Manifest V3 の拡張機能設定
- `index.html`: 新しいタブとして表示される画面
- `style.css`: モノクロ / ガラス UI の見た目
- `script.js`: 時計、検索、Todo、メモ、ステータス表示の処理
