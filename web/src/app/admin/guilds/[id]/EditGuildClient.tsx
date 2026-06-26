"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type Guild,
  type GuildInput,
  type GuildParticipant,
  getGuild,
  updateGuild,
  getParticipants,
  updateAttendance,
} from "@/lib/guild";
import GuildForm from "../_components/GuildForm";

export default function EditGuildClient() {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [guild, setGuild] = useState<Guild | null>(null);
  const [participants, setParticipants] = useState<GuildParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);

  useEffect(() => {
    const segments = window.location.pathname.split("/");
    const guildIdx = segments.indexOf("guilds");
    const guildId = guildIdx >= 0 ? segments[guildIdx + 1] : null;
    if (guildId) setId(guildId);
  }, []);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [g, p] = await Promise.all([getGuild(id!), getParticipants(id!)]);
      setGuild(g);
      setParticipants(p);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit(data: GuildInput) {
    if (!id) return;
    await updateGuild(id, data);
    router.push("/admin/guilds");
  }

  async function setAttendance(userId: string, value: boolean) {
    if (!id) return;
    await updateAttendance(id, userId, value);
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, attended: value } : p))
    );
    setOpenMenuUserId(null);
  }

  function exportParticipantsCsv() {
    if (!guild) return;
    const header = "名前,出欠,予約日";
    const rows = participants.map((p) => {
      const name = `"${p.displayName.replace(/"/g, '""')}"`;
      const att = p.attended === true ? "出席" : p.attended === false ? "欠席" : "未確認";
      const joined = p.joinedAt
        ? new Date(p.joinedAt.seconds * 1000).toISOString().split("T")[0]
        : "";
      return `${name},${att},${joined}`;
    });
    const bom = "﻿";
    const csv = bom + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${guild.title}_参加者.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p className="text-stone-500">読み込み中...</p>;
  }

  if (!guild) {
    return <p className="text-red-500">ギルド会が見つかりません</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">ギルド会を編集</h1>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <GuildForm
          initial={guild}
          onSubmit={handleSubmit}
          submitLabel="更新する"
        />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            参加者一覧（{participants.length}
            {guild.maxParticipants > 0 ? ` / ${guild.maxParticipants}` : ""}名）
          </h2>
          {participants.length > 0 && (
            <button
              onClick={exportParticipantsCsv}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              CSV出力
            </button>
          )}
        </div>
        {participants.length === 0 ? (
          <p className="text-sm text-stone-500">まだ参加者がいません</p>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-white shadow-sm">
            {participants.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-5 py-3 ${i > 0 ? "border-t border-stone-100" : ""}`}
              >
                {p.pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.pictureUrl}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs text-red-600">
                    ?
                  </div>
                )}
                <span className="flex-1 text-sm font-medium text-stone-900">
                  {p.displayName}
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuUserId(openMenuUserId === p.userId ? null : p.userId)
                    }
                    className={`cursor-pointer rounded-lg border px-4 py-2 text-xs font-bold transition-colors ${
                      p.attended === true
                        ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                        : p.attended === false
                          ? "border-red-300 bg-red-100 text-red-700"
                          : "border-stone-300 bg-stone-100 text-stone-600"
                    }`}
                  >
                    {p.attended === true
                      ? "出席 ✓"
                      : p.attended === false
                        ? "欠席 ✕"
                        : "未確認 ▾"}
                  </button>
                  {openMenuUserId === p.userId && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setOpenMenuUserId(null)}
                      />
                      <div className="absolute right-0 top-full z-30 mt-1 w-28 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
                        <button
                          type="button"
                          onClick={() => setAttendance(p.userId, true)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          ✓ 出席
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendance(p.userId, false)}
                          className="flex w-full items-center gap-2 border-t border-stone-100 px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          ✕ 欠席
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
