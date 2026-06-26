"use client";

import { useRouter } from "next/navigation";
import { createGuild, type GuildInput } from "@/lib/guild";
import GuildForm from "../_components/GuildForm";

const FUNCTIONS_BASE =
  "https://asia-northeast1-sapporo-quest-ae36a.cloudfunctions.net";

async function postToFunction(name: string, body: Record<string, unknown>) {
  try {
    await fetch(`${FUNCTIONS_BASE}/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // 失敗してもギルド会作成自体には影響させない
  }
}

export default function NewGuildPage() {
  const router = useRouter();

  async function handleSubmit(data: GuildInput) {
    await createGuild(data);

    const payload = {
      title: data.title,
      description: data.description,
      date: data.date.toISOString(),
      location: data.location,
      fee: data.fee,
      maxParticipants: data.maxParticipants,
    };

    await Promise.all([
      postToFunction("addGuildToCalendar", payload),
      data.status === "published"
        ? postToFunction("notifyNewGuild", payload)
        : Promise.resolve(),
    ]);

    router.push("/admin/guilds");
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">ギルド会を作成</h1>
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <GuildForm onSubmit={handleSubmit} submitLabel="作成する" />
      </div>
    </div>
  );
}
