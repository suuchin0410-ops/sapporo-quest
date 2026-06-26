"use client";

import { type MemberData } from "@/lib/member";
import { getLiff } from "@/lib/liff";

interface Props {
  member: MemberData;
  onEdit: () => void;
}

export default function RegisterComplete({ member, onEdit }: Props) {
  return (
    <div className="min-h-screen bg-background px-4 pb-10 pt-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-3 text-xl font-bold text-gold-light">
            登録完了！
          </h1>
          <p className="mt-1 text-sm text-gold-dim">
            冒険者ギルドへようこそ
          </p>
          <div className="rpg-divider mx-auto mt-3 w-32" />
        </div>

        <div className="rpg-card overflow-hidden rounded-2xl">
          <div className="border-b border-gold-dim/30 bg-gold/5 px-5 py-3">
            <h2 className="text-sm font-bold text-gold">冒険者カード</h2>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              {member.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.pictureUrl}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-gold-dim"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-xl font-bold text-gold ring-2 ring-gold-dim">
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

            <div className="rpg-divider" />

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-3 text-foreground">
                <span className="w-5 text-center">🎂</span>
                <span>
                  {member.birthday && (() => {
                    const [y, m, d] = member.birthday.split("-").map(Number);
                    const today = new Date();
                    let age = today.getFullYear() - y;
                    if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
                    return `${y}年${m}月${d}日（${age}歳）`;
                  })()}
                </span>
              </div>
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
        </div>

        <button
          onClick={() => {
            try {
              getLiff().closeWindow();
            } catch {
              window.close();
            }
          }}
          className="mt-5 w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-stone shadow-sm transition-all active:scale-[0.98] active:brightness-90"
        >
          LINEに戻る
        </button>

        <button
          onClick={onEdit}
          className="mt-3 w-full rounded-xl border border-stone-border bg-stone py-3 text-sm font-semibold text-gold-dim transition-colors active:bg-stone-light"
        >
          情報を編集する
        </button>
      </div>
    </div>
  );
}
