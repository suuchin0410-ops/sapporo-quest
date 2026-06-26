"use client";

import { useEffect, useState } from "react";
import { type MemberData, listMembers } from "@/lib/member";

function formatBirthday(birthday: string) {
  if (!birthday) return "-";
  const [y, m, d] = birthday.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (
    today.getMonth() + 1 < m ||
    (today.getMonth() + 1 === m && today.getDate() < d)
  )
    age--;
  return `${y}/${m}/${d}（${age}歳）`;
}

function formatTimestamp(ts: { seconds: number } | null) {
  if (!ts) return "-";
  const d = new Date(ts.seconds * 1000);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

type SortKey = "registeredAt" | "name" | "birthday";

function exportMembersCsv(members: MemberData[]) {
  const header = "名前,ニックネーム,生年月日,スキル,登録日";
  const rows = members.map((m) => {
    const name = `"${m.name.replace(/"/g, '""')}"`;
    const nick = `"${m.nickname.replace(/"/g, '""')}"`;
    const birthday = m.birthday || "";
    const skills = `"${m.skills.join("・")}"`;
    const reg = m.registeredAt
      ? new Date(m.registeredAt.seconds * 1000).toISOString().split("T")[0]
      : "";
    return `${name},${nick},${birthday},${skills},${reg}`;
  });
  const bom = "﻿";
  const csv = bom + [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `members_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("registeredAt");

  useEffect(() => {
    listMembers().then((data) => {
      setMembers(data);
      setLoading(false);
    });
  }, []);

  const filtered = search
    ? members.filter(
        (m) =>
          m.name.includes(search) ||
          m.nickname.includes(search) ||
          m.skills.some((s) => s.includes(search))
      )
    : members;

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name, "ja");
    if (sortKey === "birthday") return (a.birthday || "").localeCompare(b.birthday || "");
    const aTime = a.registeredAt?.seconds || 0;
    const bTime = b.registeredAt?.seconds || 0;
    return bTime - aTime;
  });

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "registeredAt", label: "登録日順" },
    { key: "name", label: "名前順" },
    { key: "birthday", label: "生年月日順" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">メンバー一覧</h1>
          {!loading && (
            <p className="mt-1 text-sm text-stone-500">
              {members.length}名のギルドメンバー
              {search && filtered.length !== members.length && (
                <span className="ml-1">（{filtered.length}件表示中）</span>
              )}
            </p>
          )}
        </div>
        {!loading && members.length > 0 && (
          <button
            onClick={() => exportMembersCsv(sorted)}
            className="shrink-0 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            CSV出力
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="名前・ニックネーム・スキルで検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder-stone-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          {sortOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="divide-y rounded-xl border border-stone-200 bg-white shadow-sm">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 px-6 py-4">
              <div className="h-10 w-10 rounded-full bg-stone-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-stone-200" />
                <div className="h-3 w-48 rounded bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg text-stone-400">
            {search ? "該当するメンバーがいません" : "メンバーがまだいません"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                <th className="px-6 py-3">メンバー</th>
                <th className="hidden px-6 py-3 sm:table-cell">生年月日</th>
                <th className="px-6 py-3">スキル</th>
                <th className="hidden px-6 py-3 sm:table-cell">登録日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sorted.map((member) => (
                <tr key={member.lineUserId} className="hover:bg-stone-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.pictureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.pictureUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
                          {member.nickname.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-stone-900">{member.nickname}</p>
                        <p className="text-sm text-stone-500">{member.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 text-sm text-stone-600 sm:table-cell">
                    {formatBirthday(member.birthday)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                        >
                          {skill}
                        </span>
                      ))}
                      {member.skills.length > 3 && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                          +{member.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 text-sm text-stone-500 sm:table-cell">
                    {formatTimestamp(member.registeredAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
