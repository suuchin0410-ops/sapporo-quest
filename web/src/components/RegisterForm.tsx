"use client";

import { useState } from "react";
import { useLiff } from "@/providers/LiffProvider";
import {
  SKILLS,
  ATTRIBUTES,
  type Skill,
  type Attribute,
  type MemberData,
  registerMember,
} from "@/lib/member";
import BirthdayPicker from "./BirthdayPicker";

interface Props {
  existing: MemberData | null;
  onComplete: () => void;
}

export default function RegisterForm({ existing, onComplete }: Props) {
  const { profile } = useLiff();
  const [name, setName] = useState(existing?.name ?? "");
  const [nickname, setNickname] = useState(
    existing?.nickname ?? profile?.displayName ?? ""
  );
  const [birthday, setBirthday] = useState(existing?.birthday ?? "");
  const [skills, setSkills] = useState<Skill[]>(existing?.skills ?? []);
  const [attribute, setAttribute] = useState<Attribute | "">(existing?.attribute ?? "");
  const [paidFee, setPaidFee] = useState<boolean | null>(existing ? true : null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSkill(skill: Skill) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!profile) {
      setError("LINEログインが必要です");
      return;
    }
    if (paidFee !== true) {
      setError("会費の振込を完了してから登録してください");
      return;
    }
    if (!name.trim()) {
      setError("名前を入力してください");
      return;
    }
    if (!nickname.trim()) {
      setError("ニックネームを入力してください");
      return;
    }
    if (!birthday) {
      setError("生年月日を入力してください");
      return;
    }
    if (skills.length === 0) {
      setError("得意スキルを1つ以上選択してください");
      return;
    }
    if (!attribute) {
      setError("属性を選択してください");
      return;
    }

    setSubmitting(true);
    try {
      await registerMember(
        profile.userId,
        { name: name.trim(), nickname: nickname.trim(), birthday, skills, attribute: attribute as Attribute },
        profile.pictureUrl ?? null
      );
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  const isEdit = !!existing;

  return (
    <div className="min-h-screen bg-background px-4 pb-10 pt-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="text-4xl">⚔️</div>
          <h1 className="mt-2 text-xl font-bold text-gold-light">
            {isEdit ? "冒険者情報の編集" : "冒険者登録"}
          </h1>
          <p className="mt-1 text-xs text-gold-dim">
            {isEdit
              ? "情報を更新して冒険を続けよう"
              : "札幌クエストの仲間になろう"}
          </p>
          <div className="rpg-divider mx-auto mt-3 w-32" />
        </div>

        {/* Profile preview */}
        {profile && (
          <div className="rpg-card mb-6 flex items-center gap-3 rounded-2xl p-4">
            {profile.pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.pictureUrl}
                alt=""
                className="h-12 w-12 rounded-full object-cover ring-2 ring-gold-dim"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-light text-lg font-bold text-gold">
                {profile.displayName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gold-light">
                {profile.displayName}
              </p>
              <p className="text-xs text-gold-dim">LINEアカウント連携済み</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Fee confirmation */}
          {!isEdit && (
            <div className="rpg-card rounded-xl p-4">
              <label className="mb-3 block text-sm font-semibold text-gold">
                会費の振込は完了しましたか？ <span className="text-red-accent">*</span>
              </label>
              <div className="flex gap-3">
                {([true, false] as const).map((val) => {
                  const selected = paidFee === val;
                  return (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setPaidFee(val)}
                      className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                        selected
                          ? val
                            ? "border-green-action bg-green-action/15 text-green-400"
                            : "border-red-accent bg-red-accent/15 text-red-400"
                          : "border-stone-border bg-stone text-foreground/70 active:bg-stone-light"
                      }`}
                    >
                      {val ? "✓ はい" : "✗ いいえ"}
                    </button>
                  );
                })}
              </div>
              {paidFee === false && (
                <p className="mt-2 text-xs text-red-400">
                  会費の振込を完了してから登録してください。
                </p>
              )}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gold">
              名前 <span className="text-red-accent">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              className="rpg-input w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gold">
              ニックネーム <span className="text-red-accent">*</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="たろう"
              className="rpg-input w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>

          {/* Birthday */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gold">
              生年月日 <span className="text-red-accent">*</span>
            </label>
            <BirthdayPicker value={birthday} onChange={setBirthday} />
          </div>

          {/* Skills */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gold">
              得意スキル（複数選択可）<span className="text-red-accent">*</span>
            </label>
            <p className="mb-3 text-xs text-gold-dim">
              あなたの得意分野を選んでください
            </p>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((skill) => {
                const selected = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-all ${
                      selected
                        ? "border-gold bg-gold/15 text-gold-light"
                        : "border-stone-border bg-stone text-foreground/70 active:bg-stone-light"
                    }`}
                  >
                    {selected && "✓ "}
                    {skill}
                  </button>
                );
              })}
            </div>
            {skills.length > 0 && (
              <p className="mt-2 text-xs text-gold">
                {skills.length}個選択中
              </p>
            )}
          </div>

          {/* Attribute */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gold">
              属性 <span className="text-red-accent">*</span>
            </label>
            <p className="mb-3 text-xs text-gold-dim">
              あなたのタイプに近い方を選んでください
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ATTRIBUTES.map((attr) => {
                const selected = attribute === attr;
                const isOmoro = attr === "オモロ";
                return (
                  <button
                    key={attr}
                    type="button"
                    onClick={() => setAttribute(attr)}
                    className={`rounded-xl border-2 px-4 py-4 text-center transition-all ${
                      selected
                        ? isOmoro
                          ? "border-orange-400 bg-orange-400/15 text-orange-300"
                          : "border-blue-400 bg-blue-400/15 text-blue-300"
                        : "border-stone-border bg-stone text-foreground/70 active:bg-stone-light"
                    }`}
                  >
                    <span className="block text-2xl">{isOmoro ? "🎭" : "📚"}</span>
                    <span className="mt-1 block text-sm font-bold">{attr}</span>
                    <span className="mt-0.5 block text-xs opacity-70">
                      {isOmoro ? "楽しさ重視！" : "学び重視！"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-accent/40 bg-red-accent/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-stone shadow-sm transition-all active:scale-[0.98] active:brightness-90 disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-stone border-t-transparent" />
                {isEdit ? "更新中..." : "登録中..."}
              </span>
            ) : isEdit ? (
              "更新する"
            ) : (
              "冒険者登録する"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
