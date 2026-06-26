"use client";

import { useLiff } from "@/providers/LiffProvider";

export default function LiffPage() {
  const { profile, loading, error } = useLiff();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-zinc-500">ログイン中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-4">
        {profile.pictureUrl && (
          <img
            src={profile.pictureUrl}
            alt={profile.displayName}
            className="h-24 w-24 rounded-full"
          />
        )}
        <h1 className="text-2xl font-bold">{profile.displayName}</h1>
        {profile.statusMessage && (
          <p className="text-zinc-500">{profile.statusMessage}</p>
        )}
      </div>
      <div className="rounded-lg bg-zinc-100 p-6 text-center">
        <p className="text-lg font-medium">札幌クエストへようこそ！</p>
        <p className="mt-2 text-sm text-zinc-500">
          LINEアカウントの連携が完了しました
        </p>
      </div>
    </div>
  );
}
