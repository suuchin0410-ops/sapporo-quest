"use client";

import { useEffect, useState } from "react";
import { useLiff } from "@/providers/LiffProvider";
import { listMembers, type MemberData, type Skill } from "@/lib/member";
import { getLiff } from "@/lib/liff";

const ATTRIBUTE_STYLE: Record<string, { emoji: string; bg: string; text: string }> = {
  オモロ: { emoji: "🎭", bg: "bg-orange-100", text: "text-orange-700" },
  カシコ: { emoji: "📚", bg: "bg-blue-100", text: "text-blue-700" },
};

export default function LiffMembersPage() {
  const { profile, loading: liffLoading } = useLiff();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (liffLoading) return;
    listMembers().then((data) => {
      setMembers(data);
      setLoading(false);
    });
  }, [liffLoading]);

  const allSkills = Array.from(
    new Set(members.flatMap((m) => m.skills))
  ).sort();

  const filtered = members.filter((m) => {
    if (search && !m.nickname.includes(search) && !m.name.includes(search)) {
      return false;
    }
    if (selectedSkill && !(m.skills as string[]).includes(selectedSkill)) {
      return false;
    }
    return true;
  });

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
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a2e]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-amber-200/70">冒険者名簿を開いています...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] px-4 pb-24 pt-6">
      {/* ヘッダー */}
      <div className="mb-5 text-center">
        <h1 className="text-xl font-bold text-amber-300">⚔️ 冒険者名簿</h1>
        <p className="mt-1 text-sm text-amber-200/50">
          {members.length}名の冒険者が登録中
        </p>
      </div>

      {/* 検索 */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400/50">
            🔍
          </span>
          <input
            type="text"
            placeholder="名前で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-amber-900/30 bg-[#2a2a4a] py-2.5 pl-10 pr-4 text-sm text-amber-100 placeholder-amber-200/30 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* スキルフィルター */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedSkill(null)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selectedSkill === null
              ? "bg-amber-500 text-[#1a1a2e]"
              : "bg-[#2a2a4a] text-amber-200/60 hover:text-amber-200"
          }`}
        >
          全員
        </button>
        {allSkills.map((skill) => (
          <button
            key={skill}
            onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedSkill === skill
                ? "bg-amber-500 text-[#1a1a2e]"
                : "bg-[#2a2a4a] text-amber-200/60 hover:text-amber-200"
            }`}
          >
            {skill}
          </button>
        ))}
      </div>

      {/* 検索結果 */}
      {search || selectedSkill ? (
        <p className="mb-3 text-xs text-amber-200/40">
          {filtered.length}名がヒット
        </p>
      ) : null}

      {/* メンバーリスト */}
      {filtered.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-amber-200/40">該当する冒険者がいません</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((member) => {
            const isMe = profile?.userId === member.lineUserId;
            const isExpanded = expandedId === member.lineUserId;
            const attr = member.attribute ? ATTRIBUTE_STYLE[member.attribute] : null;

            return (
              <button
                key={member.lineUserId}
                onClick={() =>
                  setExpandedId(isExpanded ? null : member.lineUserId)
                }
                className={`w-full rounded-xl border text-left transition-all ${
                  isMe
                    ? "border-amber-500/40 bg-[#2a2a4a]"
                    : "border-amber-900/20 bg-[#22223a]"
                } ${isExpanded ? "pb-4" : ""}`}
              >
                <div className="flex items-center gap-3 p-3.5">
                  {member.pictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.pictureUrl}
                      alt=""
                      className={`h-11 w-11 shrink-0 rounded-full object-cover ring-2 ${
                        isMe ? "ring-amber-400" : "ring-amber-900/30"
                      }`}
                    />
                  ) : (
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2 ${
                        isMe
                          ? "bg-amber-500/20 text-amber-300 ring-amber-400"
                          : "bg-[#2a2a4a] text-amber-200/60 ring-amber-900/30"
                      }`}
                    >
                      {member.nickname.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-amber-100">
                        {member.nickname}
                      </span>
                      {isMe && (
                        <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                          YOU
                        </span>
                      )}
                      {attr && (
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${attr.bg} ${attr.text}`}
                        >
                          {attr.emoji} {member.attribute}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {member.skills.slice(0, 2).map((skill) => (
                        <span
                          key={skill}
                          className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-300/70"
                        >
                          {skill}
                        </span>
                      ))}
                      {member.skills.length > 2 && (
                        <span className="text-[11px] text-amber-200/30">
                          +{member.skills.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-amber-200/30 transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "" }}>
                    ▾
                  </span>
                </div>

                {/* 展開時の詳細 */}
                {isExpanded && (
                  <div className="border-t border-amber-900/20 mx-3.5 pt-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <span className="text-amber-200/40">名前</span>
                        <span className="text-amber-100">{member.name}</span>
                      </div>
                      <div>
                        <span className="text-amber-200/40">スキル</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {member.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300/80"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* LINEに戻るボタン */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-amber-900/20 bg-[#1a1a2e]/95 px-4 py-3 backdrop-blur-sm">
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
