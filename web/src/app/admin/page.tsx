"use client";

import { useEffect, useState } from "react";
import { listMembers, type MemberData } from "@/lib/member";
import { type Guild, type GuildParticipant, getParticipants } from "@/lib/guild";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Stats {
  totalMembers: number;
  totalGuilds: number;
  upcomingGuilds: number;
  recentMembers: MemberData[];
  nextGuild: (Guild & { participantCount: number }) | null;
  skillCounts: { skill: string; count: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [allMembers, setAllMembers] = useState<MemberData[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [members, guildsSnap] = await Promise.all([
        listMembers(),
        getDocs(query(collection(db, "guilds"), orderBy("date", "asc"))),
      ]);

      const allGuilds = guildsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Guild
      );
      const now = Timestamp.now();
      const upcoming = allGuilds.filter(
        (g) => g.status === "published" && g.date >= now
      );

      let nextGuild: Stats["nextGuild"] = null;
      if (upcoming.length > 0) {
        const g = upcoming[0];
        const participants = await getParticipants(g.id);
        nextGuild = { ...g, participantCount: participants.length };
      }

      const skillMap = new Map<string, number>();
      for (const m of members) {
        for (const s of m.skills) {
          skillMap.set(s, (skillMap.get(s) || 0) + 1);
        }
      }
      const skillCounts = [...skillMap.entries()]
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setAllMembers(members);
      setStats({
        totalMembers: members.length,
        totalGuilds: allGuilds.length,
        upcomingGuilds: upcoming.length,
        recentMembers: members.slice(0, 5),
        nextGuild,
        skillCounts,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-stone-900">ダッシュボード</h1>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-stone-200 bg-white p-6">
              <div className="h-4 w-20 rounded bg-stone-200" />
              <div className="mt-3 h-8 w-12 rounded bg-stone-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  function formatDate(ts: { seconds: number }) {
    const d = new Date(ts.seconds * 1000);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${month}/${day}（${weekday}）${hours}:${minutes}`;
  }

  function formatRegisteredAt(ts: { seconds: number } | null) {
    if (!ts) return "";
    const d = new Date(ts.seconds * 1000);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  const maxSkillCount = stats.skillCounts[0]?.count || 1;

  const omoroCount = allMembers.filter((m) => m.attribute === "オモロ").length;
  const kashikoCount = allMembers.filter((m) => m.attribute === "カシコ").length;
  const attrTotal = omoroCount + kashikoCount;
  const omoroPct = attrTotal > 0 ? Math.round((omoroCount / attrTotal) * 100) : 0;
  const kashikoPct = attrTotal > 0 ? 100 - omoroPct : 0;
  const omoroAngle = attrTotal > 0 ? (omoroCount / attrTotal) * 360 : 180;

  function pieSlicePath(startAngle: number, endAngle: number, r: number): string {
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const x1 = 60 + r * Math.cos(toRad(startAngle));
    const y1 = 60 + r * Math.sin(toRad(startAngle));
    const x2 = 60 + r * Math.cos(toRad(endAngle));
    const y2 = 60 + r * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M60,60 L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-stone-900">ダッシュボード</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <a href="/admin/members" className="group rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:border-red-200 hover:shadow-md">
          <p className="text-sm font-medium text-stone-500">メンバー数</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{stats.totalMembers}</p>
          <p className="mt-1 text-xs text-red-600 opacity-0 transition-opacity group-hover:opacity-100">詳細を見る →</p>
        </a>
        <a href="/admin/guilds" className="group rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:border-red-200 hover:shadow-md">
          <p className="text-sm font-medium text-stone-500">ギルド会（全体）</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{stats.totalGuilds}</p>
          <p className="mt-1 text-xs text-red-600 opacity-0 transition-opacity group-hover:opacity-100">詳細を見る →</p>
        </a>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-500">予定中のギルド会</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats.upcomingGuilds}</p>
        </div>
      </div>

      {/* オモロ・カシコ分布 */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="font-semibold text-stone-900">属性分布</h2>
        </div>
        <div className="flex items-center justify-center gap-8 p-6 sm:gap-12">
          {attrTotal === 0 ? (
            <p className="text-sm text-stone-400">まだデータがありません</p>
          ) : (
            <>
              <svg viewBox="0 0 120 120" className="h-32 w-32 sm:h-40 sm:w-40">
                {omoroCount === attrTotal ? (
                  <circle cx="60" cy="60" r="55" fill="#fb923c" />
                ) : kashikoCount === attrTotal ? (
                  <circle cx="60" cy="60" r="55" fill="#60a5fa" />
                ) : (
                  <>
                    <path d={pieSlicePath(0, omoroAngle, 55)} fill="#fb923c" />
                    <path d={pieSlicePath(omoroAngle, 360, 55)} fill="#60a5fa" />
                  </>
                )}
                <circle cx="60" cy="60" r="28" fill="white" />
              </svg>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-block h-4 w-4 rounded-full bg-orange-400" />
                  <div>
                    <p className="text-sm font-medium text-stone-900">🎭 オモロ</p>
                    <p className="text-xl font-bold text-stone-900">
                      {omoroPct}%
                      <span className="ml-1 text-sm font-normal text-stone-400">({omoroCount}人)</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-block h-4 w-4 rounded-full bg-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-stone-900">📚 カシコ</p>
                    <p className="text-xl font-bold text-stone-900">
                      {kashikoPct}%
                      <span className="ml-1 text-sm font-normal text-stone-400">({kashikoCount}人)</span>
                    </p>
                  </div>
                </div>
                {allMembers.length > attrTotal && (
                  <p className="text-xs text-stone-400">
                    ※未設定: {allMembers.length - attrTotal}人
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 次のギルド会 */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-4">
            <h2 className="font-semibold text-stone-900">次のギルド会</h2>
          </div>
          <div className="p-6">
            {stats.nextGuild ? (
              <div>
                <h3 className="text-lg font-bold text-stone-900">{stats.nextGuild.title}</h3>
                <div className="mt-3 space-y-1.5 text-sm text-stone-600">
                  <p>📅 {formatDate(stats.nextGuild.date)}</p>
                  <p>📍 {stats.nextGuild.location}</p>
                  <p>👥 {stats.nextGuild.participantCount}
                    {stats.nextGuild.maxParticipants > 0 ? ` / ${stats.nextGuild.maxParticipants}` : ""}名参加
                  </p>
                </div>
                <a
                  href={`/admin/guilds/${stats.nextGuild.id}`}
                  className="mt-4 inline-block text-sm font-medium text-red-600 hover:text-red-800"
                >
                  編集する →
                </a>
              </div>
            ) : (
              <p className="text-sm text-stone-400">予定されているギルド会はありません</p>
            )}
          </div>
        </div>

        {/* スキル分布 */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-4">
            <h2 className="font-semibold text-stone-900">スキル分布</h2>
          </div>
          <div className="p-6">
            {stats.skillCounts.length === 0 ? (
              <p className="text-sm text-stone-400">データがありません</p>
            ) : (
              <div className="space-y-2.5">
                {stats.skillCounts.map(({ skill, count }) => (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkill(skill)}
                    className="flex w-full items-center gap-3 rounded-lg px-1 py-0.5 transition-colors hover:bg-red-50"
                  >
                    <span className="w-32 shrink-0 truncate text-left text-sm text-stone-700">{skill}</span>
                    <div className="flex-1">
                      <div className="h-5 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="flex h-full items-center rounded-full bg-red-500 px-2 text-[11px] font-medium text-white transition-all"
                          style={{ width: `${Math.max((count / maxSkillCount) * 100, 20)}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 最近の登録メンバー */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="font-semibold text-stone-900">最近の登録メンバー</h2>
          <a href="/admin/members" className="text-sm font-medium text-red-600 hover:text-red-800">
            全員を見る →
          </a>
        </div>
        <div className="divide-y divide-stone-100">
          {stats.recentMembers.map((m) => (
            <div key={m.lineUserId} className="flex items-center gap-4 px-6 py-3.5">
              {m.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.pictureUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
                  {m.nickname.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-medium text-stone-900">{m.nickname}</span>
                <span className="ml-2 text-sm text-stone-400">{m.name}</span>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {m.skills.slice(0, 3).map((s) => (
                  <span key={s} className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">{s}</span>
                ))}
                {m.skills.length > 3 && (
                  <span className="text-xs text-stone-400">+{m.skills.length - 3}</span>
                )}
              </div>
              <span className="shrink-0 text-xs text-stone-400">{formatRegisteredAt(m.registeredAt)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* スキルメンバーモーダル */}
      {selectedSkill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedSkill(null)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h3 className="text-lg font-bold text-stone-900">
                <span className="mr-2 inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-medium text-red-700">
                  {selectedSkill}
                </span>
                のメンバー
              </h3>
              <button
                onClick={() => setSelectedSkill(null)}
                className="rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                ✕
              </button>
            </div>
            <div className="max-h-80 divide-y divide-stone-100 overflow-y-auto">
              {allMembers
                .filter((m) => (m.skills as string[]).includes(selectedSkill))
                .map((m) => (
                  <div key={m.lineUserId} className="flex items-center gap-3 px-6 py-3">
                    {m.pictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.pictureUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
                        {m.nickname.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-stone-900">{m.nickname}</p>
                      <p className="text-sm text-stone-500">{m.name}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
