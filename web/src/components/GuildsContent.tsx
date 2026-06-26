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
import { getMember, type MemberData } from "@/lib/member";

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
  participants: GuildParticipant[] | null;
  isJoined: boolean;
}

export default function GuildsContent() {
  const { profile, loading: liffLoading } = useLiff();
  const [guilds, setGuilds] = useState<GuildWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);

  async function handleAvatarTap(userId: string) {
    setMemberLoading(true);
    setSelectedMember(null);
    const member = await getMember(userId);
    setSelectedMember(member);
    setMemberLoading(false);
  }

  useEffect(() => {
    if (liffLoading) return;

    async function load() {
      try {
        const list = await listUpcomingGuilds();
        setGuilds(
          list.map((g) => ({ ...g, participants: null, isJoined: false }))
        );
        setLoading(false);

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
      } catch (e) {
        setLoadError(
          e instanceof Error ? e.message : "データの取得に失敗しました"
        );
        setLoading(false);
      }
    }
    load();
  }, [liffLoading, profile]);

  async function reloadGuild(guildId: string) {
    const participants = await getParticipants(guildId);
    setGuilds((prev) =>
      prev.map((g) =>
        g.id === guildId
          ? {
              ...g,
              participants,
              isJoined: profile
                ? participants.some((p) => p.userId === profile.userId)
                : false,
            }
          : g
      )
    );
  }

  async function handleJoin(guildId: string) {
    if (!profile) return;
    setActioningId(guildId);
    try {
      const guild = guilds.find((g) => g.id === guildId);
      await joinGuild(guildId, {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl ?? null,
      });
      await reloadGuild(guildId);

      if (guild) {
        const calUrl = toGoogleCalendarUrl(guild);
        try {
          getLiff().openWindow({ url: calUrl, external: true });
        } catch {
          window.open(calUrl, "_blank");
        }
      }
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
      await reloadGuild(guildId);
    } finally {
      setActioningId(null);
    }
  }

  const header = (
    <div className="mb-6 text-center">
      <h1 className="text-xl font-bold text-gold-light">
        ギルド会予約
      </h1>
      <p className="mt-1 text-xs text-gold-dim">
        仲間と集い、冒険を語ろう
      </p>
      <div className="rpg-divider mx-auto mt-3 w-32" />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 pb-8 pt-6">
        <div className="mx-auto max-w-lg">
          {header}
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rpg-card overflow-hidden rounded-2xl"
              >
                <div className="animate-pulse p-5">
                  <div className="h-5 w-40 rounded-md bg-stone-light" />
                  <div className="mt-4 space-y-3">
                    <div className="h-4 w-48 rounded-md bg-stone-light" />
                    <div className="h-4 w-32 rounded-md bg-stone-light" />
                    <div className="h-4 w-24 rounded-md bg-stone-light" />
                  </div>
                  <div className="mt-5 h-12 rounded-xl bg-stone-light" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="rpg-card rounded-2xl p-6 text-center">
          <p className="text-2xl">😵</p>
          <p className="mt-2 text-sm text-red-400">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-6">
      <div className="mx-auto max-w-lg">
        {header}

        {guilds.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-4xl">🏰</p>
            <p className="mt-3 text-sm text-gold-dim">
              現在予定されているギルド会はありません
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {guilds.map((guild) => {
              const participantCount = guild.participants?.length ?? 0;
              const isFull =
                guild.maxParticipants > 0 &&
                participantCount >= guild.maxParticipants;
              const isActioning = actioningId === guild.id;
              const fillRatio =
                guild.maxParticipants > 0
                  ? Math.min(participantCount / guild.maxParticipants, 1)
                  : 0;

              return (
                <div
                  key={guild.id}
                  className="rpg-card overflow-hidden rounded-2xl"
                >
                  <div className="p-5">
                    {/* Title + badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-[17px] font-bold text-gold-light">
                        {guild.title}
                      </h2>
                      {guild.isJoined && (
                        <span className="shrink-0 rounded-full border border-gold-dim/50 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold">
                          参加中 ✓
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-center gap-3 text-sm text-foreground">
                        <span className="w-5 text-center text-base">📅</span>
                        <span>{formatDate(guild.date)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-foreground">
                        <span className="w-5 text-center text-base">📍</span>
                        <span>{guild.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-foreground">
                        <span className="w-5 text-center text-base">💰</span>
                        <span>
                          {guild.fee > 0
                            ? `¥${guild.fee.toLocaleString()}`
                            : "無料"}
                        </span>
                      </div>

                      {/* Participants */}
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center text-base">👥</span>
                        <div className="flex-1">
                          {guild.participants === null ? (
                            <div className="h-4 w-16 animate-pulse rounded bg-stone-light" />
                          ) : (
                            <div className="flex items-center justify-between text-sm text-foreground">
                              <span>
                                {participantCount}
                                {guild.maxParticipants > 0
                                  ? ` / ${guild.maxParticipants}`
                                  : ""}
                                名参加
                              </span>
                              {isFull && (
                                <span className="text-xs font-bold text-red-accent">
                                  満員
                                </span>
                              )}
                            </div>
                          )}
                          {guild.maxParticipants > 0 &&
                            guild.participants !== null && (
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-light">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isFull
                                      ? "bg-red-accent"
                                      : fillRatio > 0.7
                                        ? "bg-gold"
                                        : "bg-green-action"
                                  }`}
                                  style={{ width: `${fillRatio * 100}%` }}
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Avatars */}
                    {guild.participants && guild.participants.length > 0 && (
                      <div className="mt-3.5 flex items-center gap-1">
                        {guild.participants.slice(0, 8).map((p) => (
                          <button
                            key={p.userId}
                            onClick={() => handleAvatarTap(p.userId)}
                            className="relative h-7 w-7 overflow-hidden rounded-full ring-2 ring-stone transition-all active:scale-110 active:ring-gold"
                            title={p.displayName}
                          >
                            {p.pictureUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.pictureUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-stone-light text-[11px] font-bold text-gold-dim">
                                {p.displayName.charAt(0)}
                              </div>
                            )}
                          </button>
                        ))}
                        {guild.participants.length > 8 && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-light text-[11px] font-medium text-gold-dim">
                            +{guild.participants.length - 8}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {guild.description && (
                      <p className="mt-3.5 text-[13px] leading-relaxed text-foreground/70">
                        {guild.description}
                      </p>
                    )}

                    {/* Action */}
                    <div className="mt-5 space-y-2">
                      {guild.isJoined ? (
                        <>
                          <a
                            href={toGoogleCalendarUrl(guild)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-dim/30 bg-gold/10 py-3 text-sm font-semibold text-gold no-underline transition-colors active:bg-gold/20"
                          >
                            📅 Googleカレンダーに追加
                          </a>
                          <button
                            onClick={() => handleLeave(guild.id)}
                            disabled={isActioning}
                            className="w-full rounded-xl border border-stone-border bg-stone py-3 text-sm font-semibold text-gold-dim transition-colors active:bg-stone-light disabled:opacity-50"
                          >
                            {isActioning ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gold-dim border-t-transparent" />
                                処理中...
                              </span>
                            ) : (
                              "参加をキャンセル"
                            )}
                          </button>
                        </>
                      ) : isFull ? (
                        <div className="w-full rounded-xl bg-stone-light py-3 text-center text-sm font-semibold text-gold-dim/50">
                          定員に達しました
                        </div>
                      ) : liffLoading || guild.participants === null ? (
                        <div className="flex w-full items-center justify-center rounded-xl bg-stone-light py-3">
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gold-dim border-t-transparent" />
                        </div>
                      ) : !profile ? (
                        <div className="w-full rounded-xl bg-stone-light py-3 text-center text-sm text-gold-dim/50">
                          LINEからアクセスしてください
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoin(guild.id)}
                          disabled={isActioning}
                          className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-stone shadow-sm transition-all active:scale-[0.98] active:brightness-90 disabled:opacity-50"
                        >
                          {isActioning ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-stone border-t-transparent" />
                              処理中...
                            </span>
                          ) : (
                            "参加する"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LINEに戻る */}
        <button
          onClick={() => {
            try {
              getLiff().closeWindow();
            } catch {
              window.close();
            }
          }}
          className="mt-6 w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-stone shadow-sm transition-all active:scale-[0.98] active:brightness-90"
        >
          LINEに戻る
        </button>
      </div>

      {/* Member detail modal */}
      {(memberLoading || selectedMember) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setSelectedMember(null); setMemberLoading(false); }}
        >
          <div
            className="w-full max-w-lg animate-[slideUp_0.25s_ease-out] rounded-t-2xl border-t border-stone-border bg-background px-5 pb-8 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gold-dim/30" />

            {memberLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                <p className="text-xs text-gold-dim">読み込み中...</p>
              </div>
            ) : selectedMember ? (
              <div className="flex flex-col items-center">
                {selectedMember.pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedMember.pictureUrl}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-gold"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-light text-2xl font-bold text-gold-dim ring-2 ring-gold">
                    {selectedMember.nickname.charAt(0)}
                  </div>
                )}

                <h3 className="mt-3 text-lg font-bold text-gold-light">
                  {selectedMember.nickname}
                </h3>
                <p className="text-sm text-foreground/60">{selectedMember.name}</p>

                {selectedMember.attribute && (
                  <span className={`mt-2 rounded-full px-3 py-1 text-xs font-medium ${
                    selectedMember.attribute === "オモロ"
                      ? "bg-orange-500/20 text-orange-300"
                      : "bg-blue-500/20 text-blue-300"
                  }`}>
                    {selectedMember.attribute === "オモロ" ? "🎭" : "📚"} {selectedMember.attribute}
                  </span>
                )}

                {selectedMember.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {selectedMember.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-gold/10 px-3 py-1 text-xs text-gold-dim"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { setSelectedMember(null); setMemberLoading(false); }}
                  className="mt-6 w-full rounded-xl border border-stone-border bg-stone py-3 text-sm font-semibold text-gold-dim transition-colors active:bg-stone-light"
                >
                  閉じる
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
