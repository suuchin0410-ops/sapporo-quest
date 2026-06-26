"use client";

import { useEffect, useState } from "react";
import { useLiff } from "@/providers/LiffProvider";
import { type MemberData, getMember } from "@/lib/member";
import RegisterForm from "./RegisterForm";
import RegisterComplete from "./RegisterComplete";

type View = "loading" | "form" | "complete";

export default function RegisterContent() {
  const { profile, loading: liffLoading } = useLiff();
  const [view, setView] = useState<View>("loading");
  const [member, setMember] = useState<MemberData | null>(null);

  useEffect(() => {
    if (liffLoading) return;
    if (!profile) {
      setView("form");
      return;
    }

    getMember(profile.userId).then((m) => {
      setMember(m);
      setView(m ? "complete" : "form");
    });
  }, [liffLoading, profile]);

  async function handleComplete() {
    if (!profile) return;
    const m = await getMember(profile.userId);
    setMember(m);
    setView("complete");
  }

  if (view === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-zinc-300 border-t-zinc-600" />
          <p className="text-zinc-400 text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (view === "complete" && member) {
    return (
      <RegisterComplete
        member={member}
        onEdit={() => setView("form")}
      />
    );
  }

  return (
    <RegisterForm
      existing={member}
      onComplete={handleComplete}
    />
  );
}
