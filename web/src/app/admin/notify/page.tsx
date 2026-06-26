"use client";

import { useState } from "react";

const TEMPLATES = [
  {
    label: "ギルド会リマインダー",
    text: "⚔️ 明日はギルド会の日です！\n\n皆さんの参加をお待ちしています。\n場所と時間を確認して、遅れずにお越しください。\n\n詳細はアプリの「ギルド会予約」から確認できます。",
  },
  {
    label: "新ギルド会のお知らせ",
    text: "📢 新しいギルド会が公開されました！\n\n参加希望の方は、アプリの「ギルド会予約」から予約してください。\n定員に達し次第、締め切りとなります。",
  },
  {
    label: "お知らせ（汎用）",
    text: "",
  },
];

export default function AdminNotifyPage() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; sent?: number; error?: string } | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    if (!confirm(`以下のメッセージを全メンバーに送信します。よろしいですか？\n\n${message}`)) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch(
        "https://asia-northeast1-sapporo-quest-ae36a.cloudfunctions.net/sendNotification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: message.trim() }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, sent: data.sent });
        setMessage("");
      } else {
        setResult({ success: false, error: data.error || "送信に失敗しました" });
      }
    } catch {
      setResult({ success: false, error: "通信エラーが発生しました" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">一斉通知</h1>
        <p className="mt-1 text-sm text-stone-500">
          登録済みの全メンバーにLINEメッセージを送信します
        </p>
      </div>

      {/* テンプレート */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-stone-700">テンプレート</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => setMessage(t.text)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 transition-colors hover:bg-stone-50"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* メッセージ入力 */}
      <div className="mb-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="送信するメッセージを入力..."
          rows={8}
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <p className="mt-1 text-right text-xs text-stone-400">{message.length} 文字</p>
      </div>

      {/* 送信ボタン */}
      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="w-full rounded-xl bg-red-600 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {sending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            送信中...
          </span>
        ) : (
          "全メンバーに送信"
        )}
      </button>

      {/* 結果 */}
      {result && (
        <div
          className={`mt-4 rounded-xl border p-4 text-sm ${
            result.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {result.success
            ? `${result.sent}名にメッセージを送信しました`
            : `エラー: ${result.error}`}
        </div>
      )}
    </div>
  );
}
