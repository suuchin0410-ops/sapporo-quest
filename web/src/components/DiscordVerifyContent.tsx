"use client";

import { useLiff } from "@/providers/LiffProvider";

const DISCORD_INVITE_URL = "https://discord.gg/sXXR8rATpR";

export default function DiscordVerifyContent() {
  const { loading: liffLoading } = useLiff();

  if (liffLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-stone-border border-t-gold" />
          <p className="text-gold-dim text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-10 pt-6">
      <div className="mx-auto max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-4xl">🔗</div>
          <h1 className="mt-2 text-xl font-bold text-gold-light">
            Discord連携
          </h1>
          <p className="mt-1 text-xs text-gold-dim">
            札幌クエストのDiscordサーバーに参加しよう
          </p>
          <div className="rpg-divider mx-auto mt-3 w-32" />
        </div>

        <div className="rpg-card rounded-2xl p-5">
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                1
              </span>
              <p className="text-sm text-foreground">
                下のボタンからDiscordサーバーに参加
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                2
              </span>
              <p className="text-sm text-foreground">
                参加するだけでギルドメンバーのロールが自動付与されます
              </p>
            </div>
          </div>
        </div>

        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] active:brightness-90"
        >
          Discordサーバーに参加する
        </a>
      </div>
    </div>
  );
}
