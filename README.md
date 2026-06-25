# Mono Tab

Mono Tab は Brave / Chromium 用のモノクロ新規タブ拡張です。Manifest V3 の `chrome_url_overrides` で新規タブを `index.html` に置き換え、黒背景・白/グレー文字・ガラス UI・角丸カードで構成したミニマルなホーム / ダッシュボードを表示します。

DankMaterialShell / Hyprland / Arch Linux のような静かなデスクトップ環境に馴染む、派手な色を使わない OS の一部のような見た目を目指しています。外部ライブラリは使わず、完全にローカルファイルだけで動作します。

## ページ構成

### 1 ページ目: Home

- 大きな時計
- 日付
- 検索バー
- 固定クイックリンク 5 個
- 右下の設定ボタン

検索バーは URL のような入力なら直接移動し、それ以外は設定した検索エンジンで検索します。

### 2 ページ目: Calendar / Widget Stack

2 ページ目は横長ブラウザ向けの 2 カラム構成です。

- 左半分: **Calendar**
- 右半分: **Widget Stack**
  - Widget 1: Todo
  - Widget 2: Memo
  - Widget 3: Pomodoro Timer

ページ全体のスクロールバーは出ません。下方向スクロール、下部ボタン、ページインジケーターで 2 ページ目へ移動できます。上方向スクロール、`Esc` キー、`Homeに戻る` ボタンで 1 ページ目に戻れます。

## Calendar

Calendar は Google Calendar ではなく、完全ローカルのオリジナル月間カレンダーです。Google Calendar 風の見やすい月表示を参考にしつつ、Mono Tab の黒背景・白/グレーのみのガラス UI に合わせています。

Calendar パネル内には、2 ページ目全体の Home / Dashboard 切り替えとは独立した内部ページがあります。

- **Month View**: 月間カレンダーを広く表示し、日付選択と予定の有無を確認できます。
  - 月曜始まりの月間カレンダー
  - 前月 / 今日 / 次月ボタン
  - 今日の日付を白い丸で強調
  - 選択中の日付を薄いグレー背景と細い枠線で強調
  - イベントがある日は月間グリッド内に短い予定タイトルを 1〜2 件表示
  - 予定が多い日は `+2 more` のように追加件数を表示
  - 予定追加ボタン
- **Schedule View**: 選択日の予定一覧を広く表示します。
  - 選択日を `2026年6月25日（木）` のように表示
  - 予定を時間順に表示
  - 時間なしの予定は `時間なし` として下の方に表示
  - 予定が多い場合は Schedule View 内だけをスクロール
  - 予定追加ボタンと削除ボタン

予定データは `localStorage` の `mono-tab-events` キーに保存されます。予定には `id`, `title`, `date`, `time`, `note`, `createdAt` が含まれます。予定追加は Month View / Schedule View の両方から可能で、Calendar パネル内のインラインフォームではなく、Calendar の上に重なるモーダル画面で行います。モーダル内ではタイトル・日付・時間・メモを入力でき、時間とメモは空欄のまま保存できます。Calendar 内部ページを保存する場合は `localStorage` の `mono-tab-calendar-page` キーを使います。

設定画面や予定追加モーダルを開いている間は、Home / Calendar 間のページ切り替え wheel スクロールを無効化します。その代わり、設定パネル内や予定追加モーダル内だけを通常どおりスクロールできます。オーバーレイを閉じると、ページ切り替えスクロールは再び有効になります。

## Widget Stack

Widget Stack は右半分全体を使うカード型の切り替え UI です。

- 右上に `1 / 3` のような現在位置を表示
- 左右矢印ボタンで切り替え
- キーボードの左右矢印でも切り替え
- 下部にドットインジケーターを表示
- 最後に開いていたウィジェット番号を `localStorage` の `mono-tab-active-widget` キーに保存

### Todo

- タスク追加
- 入力欄で Enter を押すと追加
- チェックボックスで完了 / 未完了を切り替え
- 削除ボタンで削除
- 完了済みは薄い文字 + 取り消し線
- 完了数 / 全件数を表示
- `完了済みをクリア` ボタン

Todo は `localStorage` の `mono-tab-todos` キーに保存されます。

### Memo

- 大きめの textarea
- 自由入力
- 入力内容を自動保存
- 文字数表示

Memo は `localStorage` の `mono-tab-memo` キーに保存されます。

### Pomodoro Timer

- Focus: 25 分
- Break: 5 分
- Start / Pause / Reset
- Focus / Break の手動切り替え
- 残り時間を大きく表示
- Focus が終わると Break へ、Break が終わると Focus へ切り替え

Pomodoro の状態は `localStorage` の `mono-tab-pomodoro` キーに保存されます。ページ再読み込み後も、可能な範囲で残り時間と実行状態を復元します。通知音やブラウザ通知は実装していません。

## Google Calendar 連携について

Google Calendar 連携はまだ実装していません。

- Google Calendar API は使っていません
- OAuth 認証は使っていません
- iframe 埋め込みは使っていません

Calendar / Todo / Memo / Pomodoro はすべてブラウザの `localStorage` に保存され、完全にローカルで動きます。

## Brave / Chromium で読み込む手順

1. Brave のアドレスバーで `brave://extensions` を開く
2. 右上の **Developer mode** を ON にする
3. **Load unpacked** を押す
4. このフォルダを選択する
5. 新しいタブを開いて Mono Tab が表示されることを確認する

Chromium 系ブラウザでも、同様に拡張機能ページから **Load unpacked** / **パッケージ化されていない拡張機能を読み込む** を選択して読み込めます。

## カスタム方法

右下の歯車ボタンから設定パネルを開けます。

- 時計
  - フォント: Mono / Sans / Serif / Thin / Digital
  - サイズ: Small / Medium / Large
  - 時刻形式: 24 時間表示 / 12 時間表示
  - 秒表示: オン / オフ
- 日付
  - Full / Simple / Dot / Slash / Hidden
  - 曜日表示: オン / オフ
- 検索バー
  - 表示 / 非表示
  - 検索エンジン: Google / Brave Search / DuckDuckGo / Bing
- クイックリンク
  - Slot 1〜Slot 5 の表示名と URL を編集
- 背景
  - Pure Black / Soft Glow / Dot Grid / Noise / Diagonal Lines
- レイアウト位置
  - Top / Center / Bottom
- コントラスト
  - High Contrast / Soft Gray / Dim

ファイルを直接編集する場合は、以下を参照してください。

- `index.html`: ホーム、Calendar、Widget Stack、設定パネルの構造
- `style.css`: モノクロデザイン、2 ページスライド、カレンダー、Widget Stack、レスポンシブ調整
- `script.js`: 設定、ページ遷移、時計、検索、リンク、Calendar、Todo、Memo、Pomodoro、localStorage の処理
- `manifest.json`: Manifest V3 の拡張機能設定

## ライセンス

このプロジェクトは `LICENSE` ファイルに記載されたライセンスに従います。
