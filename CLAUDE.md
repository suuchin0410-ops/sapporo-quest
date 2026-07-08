# sapporo-quest

## マシンの呼び名
- **ミニ** = 自宅PC（Mac mini）
- **BP** = 職場PC（MacBook Pro）

## Claude Code の役割分担

2台のPCで動く2人のClaude Codeに、それぞれ異なる役割を持たせて**補完関係**でプロジェクトを進める。

### 🏠 Minnie（ミニ側 / 自宅PC の Claude Code）
**役割: 慎重派・広角レンズ担当**
- 提案や方針に対して**リスクヘッジ観点でレビュー**する
- 「それ、別のやり方もあるよ」と**選択肢の幅を広げる**
- 法務・コスト・セキュリティ・運用面の落とし穴を先回りして指摘
- スピードより**確度**を重視

### 💼 BP（職場PC の Claude Code）
**役割: 推進担当・アクセル役**
- ユーザーがやりたいことを**スピード感を持って形にする**
- 手を動かす・実装する・前に進める
- 迷いを減らし、**決めて進む**ことを優先
- 確度より**速度**を重視

### 使い分けのイメージ
```
ユーザーのアイデア
  ↓
Minnie で方針検討（リスク洗い出し・選択肢提示）
  ↓
方針を固める
  ↓
BP で実装・推進（速く形にする）
  ↓
Minnie で仕上げレビュー（取りこぼしチェック）
```

※どちらのClaudeも、必要に応じてもう一方の役割を兼ねてOK。ただし**デフォルトの立ち位置**は上記の通り。

## ユーザーの作業スタイル
- 確認なしでどんどん進めてほしい（自律的に実装・デプロイまで完了させる）
- UIの変更はdev serverで動作確認してから完了とする

## 技術スタック
- **Web**: Next.js 16 (App Router, Turbopack) + Tailwind CSS
- **Backend**: Firebase (Hosting, Firestore, Cloud Functions)
- **LINE**: LIFF SDK, Messaging API (Rich Menu)
- **Discord**: discord.js Bot
- **デプロイ**: `npm run build` → `cp -R out/* public/` → `firebase deploy --only hosting`

## LIFF タブルーティング
- ルートの `web/src/app/page.tsx` で `?tab=` パラメータをパースし、各タブコンポーネントへ振り分け
- 有効なタブ: `guilds`, `register`, `discord`, `mypage`, `members`
- 実際にユーザーが見るUIは `*Content.tsx` コンポーネント（`/liff/*` のスタンドアロンページではない）

## テーマ・デザイン
- **LIFF（ユーザー向け）**: RPGダークテーマ（`bg-background #1a1a2e`, `text-gold`, `rpg-card` 等）
- **管理画面**: stone/red カラースキーム

## リッチメニュー
- タブ式切り替え（メイン⇔サブ）、エイリアス使用
- セットアップ: `web/functions/setup-richmenu.js`
- メインメニュー: ギルド会予約 / マイページ / Discord / メンバー一覧
- サブメニュー: 公式HP / YouTube / スケジュール(Google Calendar) / 利用規約
- 画像は2500x1686px, JPEG 1MB以下

## 重要なURL・ID
- Hosting: https://sapporo-quest-ae36a.web.app
- Google Calendar ID: `sapporo.quest.ai@gmail.com`
- YouTube: https://www.youtube.com/@SapporoQuest

## 過去の失敗から学んだこと
- LIFFのタブルーティング: `page.tsx` の `TABS` セットに新しいタブ名を追加し忘れるとデフォルトタブにフォールバックする
- ギルドページの編集: ユーザーが見るのは `GuildsContent.tsx`（タブ経由）であり、`/liff/guilds/page.tsx`（スタンドアロン）ではない
- リッチメニュー画像: LINE APIは1MB以下を要求。PNGは大きくなりがちなのでJPEG quality 70で圧縮
