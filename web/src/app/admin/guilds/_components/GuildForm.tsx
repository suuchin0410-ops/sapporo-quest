"use client";

import { useState } from "react";
import { type Guild, type GuildInput } from "@/lib/guild";

interface Props {
  initial?: Guild;
  onSubmit: (data: GuildInput) => Promise<void>;
  submitLabel: string;
}

function toLocalDatetime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function GuildForm({ initial, onSubmit, submitLabel }: Props) {
  const initialDate = initial
    ? new Date(initial.date.seconds * 1000)
    : new Date();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(toLocalDatetime(initialDate));
  const [location, setLocation] = useState(initial?.location ?? "");
  const [fee, setFee] = useState(initial?.fee ?? 0);
  const [maxParticipants, setMaxParticipants] = useState(
    initial?.maxParticipants ?? 0
  );
  const [status, setStatus] = useState<GuildInput["status"]>(
    initial?.status ?? "draft"
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        date: new Date(date),
        location,
        fee,
        maxParticipants,
        status,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>タイトル *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={fieldClass}
          placeholder="第10回 ギルド会"
        />
      </div>

      <div>
        <label className={labelClass}>説明</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${fieldClass} resize-none`}
          rows={4}
          placeholder="ギルド会の詳細を入力..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>日時 *</label>
          <input
            type="datetime-local"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>場所 *</label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={fieldClass}
            placeholder="札幌市中央区..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>参加費（円）</label>
          <input
            type="number"
            min={0}
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>定員（0 = 制限なし）</label>
          <input
            type="number"
            min={0}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>ステータス</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as GuildInput["status"])}
          className={fieldClass}
        >
          <option value="draft">下書き</option>
          <option value="published">公開</option>
          <option value="cancelled">中止</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? "保存中..." : submitLabel}
        </button>
        <a
          href="/admin/guilds"
          className="rounded-lg border border-stone-300 px-5 py-2 text-sm text-stone-700 hover:bg-stone-50"
        >
          キャンセル
        </a>
      </div>
    </form>
  );
}
