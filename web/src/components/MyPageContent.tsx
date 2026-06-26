"use client";

import { useEffect, useState } from "react";
import { useLiff } from "@/providers/LiffProvider";
import { getMember, type MemberData } from "@/lib/member";
import {
  type Guild,
  type GuildParticipant,
  getParticipants,
} from "@/lib/guild";
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getLiff } from "@/lib/liff";
import RegisterForm from "./RegisterForm";

function formatDate(timestamp: { seconds: number }) {
  const d = new Date(timestamp.seconds * 1000);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day}（${weekday}）${hours}:${minutes}`;
}

function formatBirthday(birthday: string) {
  const [y, m, d] = birthday.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (
    today.getMonth() + 1 < m ||
    (today.getMonth() + 1 === m && today.getDate() < d)
  )
    age--;
  return `${y}年${m}月${d}日（${age}歳）`;
}

interface GuildWithStatus extends Guild {
  participants: GuildParticipant[];
  isPast: boolean;
}

export default function MyPageContent() {
  const { profile, loading: liffLoading } = useLiff();
  const [member, setMember] = useState<MemberData | null>(null);
  const [reservedGuilds, setReservedGuilds] = useState<GuildWithStatus[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (liffLoading || !profile) return;

    async function load() {
      try {
        const [memberData, guildsSnap] = await Promise.all([
          getMember(profile!.userId),
          getDocs(query(collection(db, "guilds"), orderBy("date", "asc"))),
        ]);

        setMember(memberData);

        const now = Timestamp.now();
        const allGuilds = guildsSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Guild
        );

        let participated = 0;
        const reserved: GuildWithStatus[] = [];

        await Promise.all(
          allGuilds.map(async (guild) => {
            const participants = await getParticipants(guild.id);
            const isJoined = participants.some(
              (p) => p.userId === profile!.userId
            );
            if (isJoined) {
              participated++;
              const isPast = guild.date < now;
              reserved.push({ ...guild, participants, isPast });
            }
          })
        );

        reserved.sort((a, b) => a.date.seconds - b.date.seconds);
        setReservedGuilds(reserved);
        setTotalCount(participated);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "データの取得に失敗しました"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [liffLoading, profile]);

  const header = (
    <div className="mb-6 text-center">
      <h1 className="text-xl font-bold text-gold-light">マイページ</h1>
      <p className="mt-1 text-xs text-gold-dim">冒険者の記録</p>
      <div className="rpg-divider mx-auto mt-3 w-32" />
    </div>
  );

  if (liffLoading || loading) {
    return (
      <div className="min-h-screen bg-background px-4 pb-8 pt-6">
        <div className="mx-auto max-w-lg">
          {header}
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rpg-card overflow-hidden rounded-2xl">
                <div className="animate-pulse p-5">
                  <div className="h-5 w-40 rounded-md bg-stone-light" />
                  <div className="mt-4 space-y-3">
                    <div className="h-4 w-48 rounded-md bg-stone-light" />
                    <div className="h-4 w-32 rounded-md bg-stone-light" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="rpg-card rounded-2xl p-6 text-center">
          <p className="text-2xl">😵</p>
          <p className="mt-2 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="rpg-card rounded-2xl p-6 text-center">
          <p className="text-sm text-gold-dim">
            LINEからアクセスしてください
          </p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="rpg-card rounded-2xl p-6 text-center">
          <p className="text-2xl">📋</p>
          <p className="mt-2 text-sm text-gold-dim">
            まだ冒険者登録がされていません
          </p>
        </div>
      </div>
    );
  }

  if (editing && member) {
    return (
      <RegisterForm
        existing={member}
        onComplete={async () => {
          const updated = await getMember(profile!.userId);
          setMember(updated);
          setEditing(false);
        }}
      />
    );
  }

  const upcomingGuilds = reservedGuilds.filter((g) => !g.isPast);
  const pastGuilds = reservedGuilds.filter((g) => g.isPast);

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-6">
      <div className="mx-auto max-w-lg">
        {header}

        {/* 参加実績サマリー */}
        <div className="rpg-card mb-4 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              {member.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.pictureUrl}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-gold-dim"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-lg font-bold text-gold ring-2 ring-gold-dim">
                  {member.nickname.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-lg font-bold text-gold-light">
                  {member.nickname}
                </p>
                <p className="text-xs text-gold-dim">{member.name}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gold">{totalCount}</p>
              <p className="text-[11px] text-gold-dim">参加回数</p>
            </div>
          </div>
        </div>

        {/* 登録情報 */}
        <div className="rpg-card mb-4 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-gold-dim/30 bg-gold/5 px-5 py-3">
            <h2 className="text-sm font-bold text-gold">冒険者カード</h2>
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-gold-dim/50 px-3 py-1 text-xs font-medium text-gold-dim transition-colors active:bg-gold/10"
            >
              編集
            </button>
          </div>
          <div className="space-y-2.5 p-5 text-sm">
            <div className="flex items-center gap-3 text-foreground">
              <span className="w-5 text-center">🎂</span>
              <span>{member.birthday ? formatBirthday(member.birthday) : "未設定"}</span>
            </div>
            {member.attribute && (
              <div className="flex items-center gap-3 text-foreground">
                <span className="w-5 text-center">{member.attribute === "オモロ" ? "🎭" : "📚"}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    member.attribute === "オモロ"
                      ? "bg-orange-400/15 text-orange-300"
                      : "bg-blue-400/15 text-blue-300"
                  }`}
                >
                  {member.attribute}
                </span>
              </div>
            )}
            <div className="flex items-start gap-3 text-foreground">
              <span className="w-5 pt-0.5 text-center">⚡</span>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-gold-dim/50 bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold-light"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 予約中のギルド会 */}
        <div className="rpg-card mb-4 overflow-hidden rounded-2xl">
          <div className="border-b border-gold-dim/30 bg-gold/5 px-5 py-3">
            <h2 className="text-sm font-bold text-gold">
              予約中のギルド会
              {upcomingGuilds.length > 0 && (
                <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-xs">
                  {upcomingGuilds.length}件
                </span>
              )}
            </h2>
          </div>
          <div className="p-5">
            {upcomingGuilds.length === 0 ? (
              <p className="text-center text-sm text-gold-dim">
                予約中のギルド会はありません
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingGuilds.map((guild) => (
                  <div
                    key={guild.id}
                    className="rounded-xl border border-stone-border bg-stone/50 p-4"
                  >
                    <h3 className="font-bold text-gold-light">{guild.title}</h3>
                    <div className="mt-2 space-y-1.5 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📅</span>
                        <span>{formatDate(guild.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📍</span>
                        <span>{guild.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">👥</span>
                        <span>
                          {guild.participants.length}
                          {guild.maxParticipants > 0
                            ? ` / ${guild.maxParticipants}`
                            : ""}
                          名参加
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 過去の参加履歴 */}
        {pastGuilds.length > 0 && (
          <div className="rpg-card mb-4 overflow-hidden rounded-2xl">
            <div className="border-b border-gold-dim/30 bg-gold/5 px-5 py-3">
              <h2 className="text-sm font-bold text-gold">
                過去の参加履歴
                <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-xs">
                  {pastGuilds.length}件
                </span>
              </h2>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {pastGuilds.map((guild) => (
                  <div
                    key={guild.id}
                    className="flex items-center justify-between rounded-lg border border-stone-border/50 bg-stone/30 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gold-dim">
                        {guild.title}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {formatDate(guild.date)}
                      </p>
                    </div>
                    <span className="text-xs text-gold-dim/60">参加済</span>
                  </div>
                ))}
              </div>
            </div>
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
          className="mt-2 w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-stone shadow-sm transition-all active:scale-[0.98] active:brightness-90"
        >
          LINEに戻る
        </button>
      </div>
    </div>
  );
}
