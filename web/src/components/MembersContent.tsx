"use client";

import { useEffect, useState } from "react";
import { useLiff } from "@/providers/LiffProvider";
import { listMembers, type MemberData } from "@/lib/member";
import { getLiff } from "@/lib/liff";

const ATTRIBUTE_STYLE: Record<string, { emoji: string; bg: string; text: string }> = {
  オモロ: { emoji: "🎭", bg: "bg-orange-100", text: "text-orange-700" },
  カシコ: { emoji: "📚", bg: "bg-blue-100", text: "text-blue-700" },
};

export default function MembersContent() {
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

  if (liffLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-gold-dim text-sm">冒険者名簿を開いています...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-6">
      <div className="mx-auto max-w-lg">
        {/* ヘッダー */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gold-light">⚔️ 冒険者名簿</h1>
          <p className="mt-1 text-xs text-gold-dim">
            {members.length}名の冒険者が登録中
          </p>
          <div className="rpg-divider mx-auto mt-3 w-32" />
        </div>

        {/* 検索 */}
        <div className="mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dim/50">
              🔍
            </span>
            <input
              type="text"
              placeholder="名前で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-stone-border bg-stone py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-gold-dim/30 focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        {/* スキルフィルター */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSkill(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedSkill === null
                ? "bg-gold text-stone"
                : "bg-stone-light text-gold-dim hover:text-gold"
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
                  ? "bg-gold text-stone"
                  : "bg-stone-light text-gold-dim hover:text-gold"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* 検索結果 */}
        {search || selectedSkill ? (
          <p className="mb-3 text-xs text-gold-dim/50">
            {filtered.length}名がヒット
          </p>
        ) : null}

        {/* メンバーリスト */}
        {filtered.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-gold-dim/50">該当する冒険者がいません</p>
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
                  className={`rpg-card w-full rounded-xl text-left transition-all ${
                    isMe ? "ring-1 ring-gold/40" : ""
                  } ${isExpanded ? "pb-4" : ""}`}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    {member.pictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.pictureUrl}
                        alt=""
                        className={`h-11 w-11 shrink-0 rounded-full object-cover ring-2 ${
                          isMe ? "ring-gold" : "ring-stone-border"
                        }`}
                      />
                    ) : (
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2 ${
                          isMe
                            ? "bg-gold/10 text-gold ring-gold"
                            : "bg-stone-light text-gold-dim ring-stone-border"
                        }`}
                      >
                        {member.nickname.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">
                          {member.nickname}
                        </span>
                        {isMe && (
                          <span className="shrink-0 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">
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
                            className="rounded bg-gold/10 px-1.5 py-0.5 text-[11px] text-gold-dim"
                          >
                            {skill}
                          </span>
                        ))}
                        {member.skills.length > 2 && (
                          <span className="text-[11px] text-gold-dim/40">
                            +{member.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className="shrink-0 text-gold-dim/40 transition-transform"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "" }}
                    >
                      ▾
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mx-3.5 border-t border-stone-border pt-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                          <span className="text-gold-dim/50">名前</span>
                          <span className="text-foreground">{member.name}</span>
                        </div>
                        <div>
                          <span className="text-gold-dim/50">スキル</span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {member.skills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs text-gold-dim"
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
    </div>
  );
}
