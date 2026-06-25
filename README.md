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

Calendar は **Google Calendar API と連携する閲覧専用カレンダービューア**です。Mono Tab 内では予定の追加・編集・削除を行わず、Google Calendar 本体で管理されている予定を読み取って表示します。

Calendar パネル内には、2 ページ目全体の Home / Dashboard 切り替えとは独立した内部ページがあります。

- **Month View**: Google Calendar の `primary` カレンダーから取得した予定を月間カレンダーに表示します。
  - 月曜始まりの月間カレンダー
  - 前月 / 今日 / 次月 / 同期ボタン
  - 今日の日付を白い丸で強調
  - 選択中の日付を薄いグレー背景と細い枠線で強調
  - 予定がある日は月間グリッド内に短い予定タイトルを 1〜2 件表示
  - 予定が多い日は `+2 more` のように追加件数を表示
  - Google Calendar 接続状態、最終同期時刻、接続 / 同期 / 接続解除ボタン
- **Schedule View**: 選択日の Google Calendar 予定を広く表示します。
  - 選択日を `2026年6月25日（木）` のように表示
  - 予定を時間順に表示
  - 終日予定は `終日` として表示
  - 場所、説明、`Google Calendarで開く` リンクを表示
  - 予定が多い場合は Schedule View 内だけをスクロール

ローカル予定追加機能、予定追加モーダル、予定削除ボタン、`mono-tab-events` を前提にした予定管理 UI は削除されています。Calendar 内部ページを保存する場合は `localStorage` の `mono-tab-calendar-page` キーを使います。

設定画面や Google Calendar 接続 UI を操作している間は、Home / Calendar 間のページ切り替え wheel スクロールが誤発火しないようにしています。

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

Mono Tab の Calendar は Google Calendar API の読み取り専用連携です。

- 使用スコープは `https://www.googleapis.com/auth/calendar.readonly` のみです
- 書き込みスコープは要求しません
- Mono Tab では予定の追加・編集・削除はできません
- 予定の作成・編集・削除は Google Calendar 本体で行ってください
- Mono Tab は Google Calendar の予定を美しく確認するビューアとして使います
- 最初の実装対象は `primary` カレンダーのみです

取得した Google 予定は、読み込み直後やオフライン時にも前回同期分を表示できるように `localStorage` へキャッシュします。

- `mono-tab-google-events-cache`: 取得した Google 予定、取得時刻、取得範囲
- `mono-tab-google-sync-meta`: 接続状態、最終同期時刻、エラー状態

Todo / Memo / Pomodoro はこれまで通りローカル保存です。

- `mono-tab-todos`
- `mono-tab-memo`
- `mono-tab-pomodoro`
- `mono-tab-active-widget`

### Google Calendar API セットアップ

1. Google Cloud Console でプロジェクトを作成する
2. Google Calendar API を有効化する
3. OAuth 同意画面を設定する
4. Chrome Extension 用の OAuth Client ID を作成する
5. `manifest.json` の `oauth2.client_id` にある `YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` を、取得した Client ID に差し替える
6. Brave / Chromium で `brave://extensions` または `chrome://extensions` を開く
7. **Developer mode** を ON にする
8. **Load unpacked** でこの拡張フォルダを読み込む
9. Calendar の **Google Calendarに接続** ボタンから Google ログインする

未パッケージ拡張では拡張 ID が変わると Google Cloud 側の OAuth 設定と合わなくなることがあります。本格配布する場合は Chrome Web Store 登録、固定拡張 ID、Google Cloud 側の OAuth 設定管理が必要です。

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
