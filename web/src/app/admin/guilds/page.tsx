"use client";

import { useEffect, useState } from "react";
import { type Guild, type GuildParticipant, listGuilds, getParticipants } from "@/lib/guild";

function formatDate(timestamp: { seconds: number }) {
  const d = new Date(timestamp.seconds * 1000);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day}（${weekday}）${hours}:${minutes}`;
}

const statusLabel: Record<string, string> = {
  draft: "下書き",
  published: "公開中",
  cancelled: "中止",
};

const statusColor: Record<string, string> = {
  draft: "bg-stone-100 text-stone-600",
  published: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

interface GuildWithParticipants extends Guild {
  participants: GuildParticipant[] | null;
}

export default function AdminGuildsPage() {
  const [guilds, setGuilds] = useState<GuildWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await listGuilds("all");
    const withNull = data.map((g) => ({ ...g, participants: null }));
    setGuilds(withNull);
    setLoading(false);

    const enriched = await Promise.all(
      data.map(async (g) => {
        const participants = await getParticipants(g.id);
        return { ...g, participants };
      })
    );
    setGuilds(enriched);
  }

  useEffect(() => {
    load();
  }, []);

  const isPast = (g: Guild) =>
    g.date.seconds * 1000 < Date.now();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">ギルド会一覧</h1>
        <a
          href="/admin/guilds/new"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
        >
          + 新規作成
        </a>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-stone-200 bg-white p-6">
              <div className="h-5 w-40 rounded bg-stone-200" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-48 rounded bg-stone-200" />
                <div className="h-4 w-32 rounded bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      ) : guilds.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg text-stone-400">ギルド会がまだありません</p>
          <a
            href="/admin/guilds/new"
            className="mt-4 inline-block text-sm font-medium text-red-600 hover:text-red-800"
          >
            最初のギルド会を作成する →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {guilds.map((guild) => {
            const past = isPast(guild);
            const count = guild.participants?.length;

            return (
              <div
                key={guild.id}
                className={`rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md ${
                  past ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between p-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-semibold text-stone-900">
                        {guild.title}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[guild.status]}`}
                      >
                        {statusLabel[guild.status]}
                      </span>
                      {past && (
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">
                          終了
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-600">
                      <span>📅 {formatDate(guild.date)}</span>
                      <span>📍 {guild.location}</span>
                      <span>
                        💰 {guild.fee > 0 ? `¥${guild.fee.toLocaleString()}` : "無料"}
                      </span>
                      <span>
                        👥{" "}
                        {count != null
                          ? `${count}${guild.maxParticipants > 0 ? ` / ${guild.maxParticipants}` : ""}名`
                          : "..."}
                      </span>
                    </div>
                    {guild.participants && guild.participants.length > 0 && (
                      <div className="mt-3 flex items-center gap-1">
                        {guild.participants.slice(0, 6).map((p) => (
                          <div
                            key={p.userId}
                            className="relative h-7 w-7 overflow-hidden rounded-full ring-2 ring-white"
                            title={p.displayName}
                          >
                            {p.pictureUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.pictureUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-red-100 text-[11px] font-bold text-red-600">
                                {p.displayName.charAt(0)}
                              </div>
                            )}
                          </div>
                        ))}
                        {guild.participants.length > 6 && (
                          <span className="ml-1 text-xs text-stone-400">
                            +{guild.participants.length - 6}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <a
                    href={`/admin/guilds/${guild.id}`}
                    className="shrink-0 rounded-lg border border-stone-300 px-3.5 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    編集
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
