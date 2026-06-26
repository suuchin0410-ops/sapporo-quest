"use client";

import { useEffect, useState } from "react";
import { LiffProvider } from "@/providers/LiffProvider";
import GuildsContent from "@/components/GuildsContent";
import RegisterContent from "@/components/RegisterContent";
import DiscordVerifyContent from "@/components/DiscordVerifyContent";
import MyPageContent from "@/components/MyPageContent";
import MembersContent from "@/components/MembersContent";
import { initLiff, getLiff } from "@/lib/liff";

const TABS: ReadonlySet<string> = new Set(["guilds", "register", "discord", "mypage", "members"]);
type AppTab = "guilds" | "register" | "discord" | "mypage" | "members" | null;

function asTab(v: string | null): AppTab {
  return v && TABS.has(v) ? (v as AppTab) : null;
}

function parseTab(): AppTab {
  const params = new URLSearchParams(window.location.search);

  const direct = asTab(params.get("tab"));
  if (direct) return direct;

  const liffState = params.get("liff.state");
  if (liffState) {
    const queryPart = liffState.includes("?") ? liffState.split("?")[1] : "";
    if (queryPart) {
      const fromQuery = asTab(new URLSearchParams(queryPart).get("tab"));
      if (fromQuery) return fromQuery;
    }

    const path = liffState.split("?")[0].replace(/^\/+|\/+$/g, "");
    const fromPath = asTab(path) || asTab(path.replace(/^liff\//, ""));
    if (fromPath) return fromPath;
  }

  return null;
}

export default function Home() {
  const [tab, setTab] = useState<AppTab | "loading">("loading");

  useEffect(() => {
    async function init() {
      const tabBefore = parseTab();
      if (tabBefore) {
        setTab(tabBefore);
        return;
      }

      try {
        await initLiff();
        const tabAfter = parseTab();
        if (tabAfter) {
          setTab(tabAfter);
        } else if (getLiff().isInClient()) {
          setTab("guilds");
        } else {
          setTab(null);
        }
      } catch {
        setTab(null);
      }
    }
    init();
  }, []);

  if (tab === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-stone-border border-t-gold" />
          <p className="text-gold-dim text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (tab === "register") {
    return (
      <LiffProvider>
        <RegisterContent />
      </LiffProvider>
    );
  }

  if (tab === "discord") {
    return (
      <LiffProvider>
        <DiscordVerifyContent />
      </LiffProvider>
    );
  }

  if (tab === "guilds") {
    return (
      <LiffProvider>
        <GuildsContent />
      </LiffProvider>
    );
  }

  if (tab === "mypage") {
    return (
      <LiffProvider>
        <MyPageContent />
      </LiffProvider>
    );
  }

  if (tab === "members") {
    return (
      <LiffProvider>
        <MembersContent />
      </LiffProvider>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 bg-background">
      <h1 className="text-2xl font-bold text-gold-light">札幌クエスト</h1>
      <p className="text-gold-dim">LINEからアクセスしてください</p>
    </div>
  );
}
