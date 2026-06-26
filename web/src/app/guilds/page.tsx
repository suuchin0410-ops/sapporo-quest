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

function formatDate(timestamp: { seconds: number }) {
  const d = new Date(timestamp.seconds * 1000);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day}（${weekday}）${hours}:${minutes}`;
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
    try {
      await leaveGuild(guildId, profile.userId);
      await load();
    } finally {
      setActioningId(null);
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
    <div className="min-h-screen bg-zinc-50 px-4 py-6">
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

                <div className="mt-4">
                  {guild.isJoined ? (
                    <button
                      onClick={() => handleLeave(guild.id)}
                      disabled={isActioning}
                      className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {isActioning ? "処理中..." : "参加をキャンセル"}
                    </button>
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
    </div>
  );
}
