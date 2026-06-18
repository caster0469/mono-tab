# Mono Tab

Mono Tab は Brave / Chromium 用のモノクロ新規タブ拡張です。黒背景、大きな時計、日付、検索バー、最大 5 個のクイックリンクだけに情報を絞り、iPhone のロック画面のように制限された範囲で美しくカスタムできます。

DankMaterialShell / Hyprland / Arch Linux のようなミニマルなデスクトップ環境に馴染む、白・黒・グレーのみの静かな見た目を目指しています。外部ライブラリは使わず、すべてローカルファイルで動作します。

## Brave / Chromium で読み込む手順

1. Brave のアドレスバーで `brave://extensions` を開く
2. 右上の「デベロッパーモード」を ON にする
3. 「パッケージ化されていない拡張機能を読み込む」を押す
4. このフォルダを選択する
5. 新しいタブを開いて Mono Tab が表示されることを確認する

Chromium 系ブラウザでも、同様に拡張機能ページから「パッケージ化されていない拡張機能」として読み込めます。

## カスタムできる項目

右下の歯車ボタンから設定パネルを開けます。もう一度歯車を押すか、パネル右上の閉じるボタンで閉じられます。

- 時計
  - フォント: Mono / Sans / Serif / Thin / Digital
  - サイズ: Small / Medium / Large
  - 時刻形式: 24 時間表示 / 12 時間表示
  - 秒表示: オン / オフ
- 日付
  - Full: `2026年6月18日（木）`
  - Simple: `6月18日（木）`
  - Dot: `2026.06.18`
  - Slash: `2026/06/18`
  - Hidden: 非表示
  - 曜日表示: オン / オフ
- 検索バー
  - 表示 / 非表示
  - 検索エンジン: Google / Brave Search / DuckDuckGo / Bing
  - URL のような入力は直接移動し、それ以外は選択中の検索エンジンで検索します。
- クイックリンク
  - Slot 1〜Slot 5 の最大 5 個まで設定できます。
  - 各スロットで表示名と URL を編集できます。
  - 表示名または URL が空欄のスロットは表示されません。
  - 初期値は YouTube / ChatGPT / GitHub / Gmail / Drive です。
- 背景
  - Pure Black / Soft Glow / Dot Grid / Noise / Diagonal Lines
- レイアウト位置
  - Top / Center / Bottom
- コントラスト
  - High Contrast / Soft Gray / Dim

## 設定の保存

設定はブラウザの `localStorage` に保存されます。キーは `mono-tab-settings` です。ページを再読み込みしても設定は保持されます。

## 色やレイアウトを変更したい場合

- `style.css`
  - CSS 変数、背景プリセット、時計フォント、時計サイズ、設定パネル、レスポンシブ調整を管理しています。
- `script.js`
  - `defaultSettings`、設定の読み書き、時計・日付・リンクの描画、検索処理、設定パネルのイベントを管理しています。
- `index.html`
  - メイン表示、設定ボタン、設定パネルの構造を定義しています。

## 構成

- `manifest.json`: Manifest V3 の拡張機能設定
- `index.html`: 新しいタブとして表示される画面と設定パネル
- `style.css`: モノクロの見た目、背景、レスポンシブレイアウト
- `script.js`: 設定保存、時計、日付、検索、クイックリンク描画
- `README.md`: 説明と読み込み手順
- `LICENSE`: ライセンス

## ライセンス

このプロジェクトは `LICENSE` ファイルに記載されたライセンスに従います。
