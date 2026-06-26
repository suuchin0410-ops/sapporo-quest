"use client";

import { useEffect, useState } from "react";
import { useLiff } from "@/providers/LiffProvider";
import {
  type Guild,
  type GuildParticipant,
  listUpcomingGuilds,
  joinGuild,
  leaveGuild,
  getParticipants,
} from "@/lib/guild";
import { getLiff } from "@/lib/liff";

function formatDate(timestamp: { seconds: number }) {
  const d = new Date(timestamp.seconds * 1000);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day}（${weekday}）${hours}:${minutes}`;
}

function toGoogleCalendarUrl(guild: Guild): string {
  const start = new Date(guild.date.seconds * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: guild.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    location: guild.location,
    details: [
      guild.description || "",
      guild.fee > 0 ? `参加費: ¥${guild.fee.toLocaleString()}` : "参加費: 無料",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

interface GuildWithParticipants extends Guild {
  participants: GuildParticipant[];
  isJoined: boolean;
}

export default function LiffGuildsPage() {
  const { profile, loading: liffLoading } = useLiff();
  const [guilds, setGuilds] = useState<GuildWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [justJoinedId, setJustJoinedId] = useState<string | null>(null);

  async function load() {
    const list = await listUpcomingGuilds();
    const enriched = await Promise.all(
      list.map(async (g) => {
        const participants = await getParticipants(g.id);
        return {
          ...g,
          participants,
          isJoined: profile
            ? participants.some((p) => p.userId === profile.userId)
            : false,
        };
      })
    );
    setGuilds(enriched);
    setLoading(false);
  }

  useEffect(() => {
    if (!liffLoading) load();
  }, [liffLoading]);

  async function handleJoin(guildId: string) {
    if (!profile) return;
    setActioningId(guildId);
    try {
      await joinGuild(guildId, {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl ?? null,
      });
      setJustJoinedId(guildId);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setActioningId(null);
    }
  }

  async function handleLeave(guildId: string) {
    if (!profile) return;
    if (!confirm("参加をキャンセルしますか？")) return;
    setActioningId(guildId);
    setJustJoinedId(null);
    try {
      await leaveGuild(guildId, profile.userId);
      await load();
    } finally {
      setActioningId(null);
    }
  }

  function handleClose() {
    try {
      const liff = getLiff();
      liff.closeWindow();
    } catch {
      window.location.href = "https://line.me/R/";
    }
  }

  if (liffLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 pb-24 pt-6">
      <h1 className="mb-5 text-center text-xl font-bold text-zinc-900">
        ギルド会予約
      </h1>

      {guilds.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-zinc-500">現在予定されているギルド会はありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {guilds.map((guild) => {
            const isFull =
              guild.maxParticipants > 0 &&
              guild.participants.length >= guild.maxParticipants;
            const isActioning = actioningId === guild.id;
            const showCalendarPrompt = justJoinedId === guild.id;
            const calendarUrl = toGoogleCalendarUrl(guild);

            return (
              <div
                key={guild.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-zinc-900">
                  {guild.title}
                </h2>

                <div className="mt-3 space-y-1.5 text-sm text-zinc-600">
                  <p>📅 {formatDate(guild.date)}</p>
                  <p>📍 {guild.location}</p>
                  <p>
                    💰{" "}
                    {guild.fee > 0
                      ? `¥${guild.fee.toLocaleString()}`
                      : "無料"}
                  </p>
                  <p>
                    👥 {guild.participants.length}
                    {guild.maxParticipants > 0
                      ? ` / ${guild.maxParticipants}`
                      : ""}
                    名参加
                  </p>
                </div>

                {guild.description && (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                    {guild.description}
                  </p>
                )}

                <div className="mt-4 space-y-2">
                  {guild.isJoined ? (
                    <>
                      {showCalendarPrompt && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <p className="mb-2 text-sm font-medium text-blue-800">
                            ✅ 予約が完了しました！
                          </p>
                          <a
                            href={calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white py-2 text-sm font-medium text-blue-700 no-underline"
                          >
                            📅 Googleカレンダーに追加
                          </a>
                        </div>
                      )}

                      {!showCalendarPrompt && (
                        <a
                          href={calendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-600 no-underline"
                        >
                          📅 Googleカレンダーに追加
                        </a>
                      )}

                      <button
                        onClick={() => handleLeave(guild.id)}
                        disabled={isActioning}
                        className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {isActioning ? "処理中..." : "参加をキャンセル"}
                      </button>
                    </>
                  ) : isFull ? (
                    <div className="w-full rounded-lg bg-zinc-100 py-2.5 text-center text-sm font-medium text-zinc-400">
                      定員に達しました
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(guild.id)}
                      disabled={isActioning || !profile}
                      className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {isActioning ? "処理中..." : "参加する"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={handleClose}
          className="w-full rounded-xl bg-[#06C755] py-3 text-sm font-bold text-white shadow-lg"
        >
          LINEに戻る
        </button>
      </div>
    </div>
  );
}
