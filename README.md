# Mono Tab

Brave / Chromium の新しいタブページを、モノクロでミニマルなローカルホーム画面に置き換える Manifest V3 拡張機能です。
外部ライブラリは使わず、すべてローカルファイルだけで動作します。

## Brave で読み込む手順

1. Brave のアドレスバーで `brave://extensions` を開く
2. 右上の「デベロッパーモード」を ON にする
3. 「パッケージ化されていない拡張機能を読み込む」を押す
4. このフォルダを選択する
5. 新しいタブを開いて表示を確認する

## 画面構成

- 中央: 大きな時計、日付、検索バー、クイックリンク
- 右上: ブラウザで取得できる実データを使った Status カード
- 左下: TODO カード
- TODO の隣: MEMO カード

小さい画面ではカードサイズと配置を調整し、新規タブページとしてスクロールバーが出にくいレイアウトにしています。

## Status カードについて

通常のブラウザ拡張では、OS の本物の CPU 使用率、OS 全体の RAM 使用率、SSD 全体の使用量、Wi-Fi の詳細状態を直接取得することはできません。
そのため Mono Tab では、見た目だけの CPU / RAM / SSD ダミー値は表示せず、ブラウザから取得できる情報だけを動的に表示します。

表示する項目は次のとおりです。

- Battery: `navigator.getBattery()` が使える場合に、バッテリー残量と充電状態を表示します。使えない場合は `Unavailable` と表示します。
- Network: `navigator.onLine` で Online / Offline を表示します。`navigator.connection` が使える場合は `effectiveType`、`downlink`、`rtt` も表示し、取得できない情報は `Limited` と表示します。
- JS Memory: `performance.memory` が使える場合に JavaScript heap の使用量を表示します。これは OS 全体の RAM 使用率ではありません。使えない場合は `Browser limited` と表示します。
- Browser Storage: `navigator.storage.estimate()` を使って、このブラウザ origin のストレージ使用量と推定残量を表示します。これは SSD 全体の容量ではありません。
- Session: ページを開いてからの経過時間を `00:00:00` 形式で表示します。

ブラウザや拡張機能の実行環境によって一部 API が無効な場合があります。その場合もページ全体が壊れないようにフォールバック表示を行います。

## TODO の使い方

TODO は MEMO とは別の独立したカードです。

- 入力欄に TODO を書いて Enter を押すと追加できます。
- チェックボックスで完了 / 未完了を切り替えられます。
- `×` ボタンで削除できます。
- 完了済みの TODO は薄い文字色と取り消し線で表示されます。

TODO は `localStorage` の `mono-tab-todos` キーに保存されます。同じブラウザプロファイル内では、拡張機能を再読み込みしても保持されます。

## MEMO の使い方

MEMO は TODO とは別の独立したカードです。
自由に入力できる textarea で、入力内容は自動保存されます。

MEMO は `localStorage` の `mono-tab-memo` キーに保存されます。

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

### 初期状態の TODO / MEMO

TODO と MEMO は空の状態から始まり、入力した内容が `localStorage` に保存されます。
古いバージョンの保存キーが残っている場合は、読み込み時だけ互換的に参照します。

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
- `script.js`: 時計、検索、TODO、MEMO、ステータス表示の処理
