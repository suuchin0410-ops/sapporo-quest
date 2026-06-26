"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => currentYear - 15 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

const ITEM_HEIGHT = 44;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2);

function WheelColumn({
  items,
  selected,
  onSelect,
  format,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  format: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const selectedIdx = items.indexOf(selected);

  useEffect(() => {
    if (ref.current && !isScrolling.current) {
      const idx = items.indexOf(selected);
      if (idx >= 0) {
        ref.current.scrollTop = idx * ITEM_HEIGHT;
      }
    }
  }, [selected, items]);

  const handleScroll = useCallback(() => {
    isScrolling.current = true;
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      ref.current.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
      if (items[clamped] !== selected) {
        onSelect(items[clamped]);
      }
      setTimeout(() => {
        isScrolling.current = false;
      }, 100);
    }, 80);
  }, [items, selected, onSelect]);

  return (
    <div className="relative flex-1" style={{ height: ITEM_HEIGHT * VISIBLE }}>
      <div
        className="pointer-events-none absolute left-0 right-0 z-10 rounded-lg border border-gold/40 bg-gold/10"
        style={{ top: CENTER * ITEM_HEIGHT, height: ITEM_HEIGHT }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full snap-y snap-mandatory overflow-y-auto scrollbar-none"
        style={{
          paddingTop: CENTER * ITEM_HEIGHT,
          paddingBottom: CENTER * ITEM_HEIGHT,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {items.map((item, i) => (
          <div
            key={item}
            className={`flex h-[44px] snap-center items-center justify-center text-sm font-medium transition-colors ${
              i === selectedIdx
                ? "text-gold-light"
                : "text-foreground/40"
            }`}
            onClick={() => {
              onSelect(item);
              if (ref.current) {
                ref.current.scrollTo({ top: i * ITEM_HEIGHT, behavior: "smooth" });
              }
            }}
          >
            {format(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BirthdayPicker({ value, onChange }: Props) {
  const parsed = value ? value.split("-").map(Number) : [1995, 1, 1];
  const [year, setYear] = useState(parsed[0]);
  const [month, setMonth] = useState(parsed[1]);
  const [day, setDay] = useState(parsed[2]);

  const days = Array.from(
    { length: daysInMonth(year, month) },
    (_, i) => i + 1
  );

  useEffect(() => {
    const maxDay = daysInMonth(year, month);
    const clampedDay = Math.min(day, maxDay);
    if (clampedDay !== day) setDay(clampedDay);
    const yy = String(year);
    const mm = String(month).padStart(2, "0");
    const dd = String(clampedDay).padStart(2, "0");
    onChange(`${yy}-${mm}-${dd}`);
  }, [year, month, day, onChange]);

  return (
    <div className="rpg-card overflow-hidden rounded-xl">
      <div className="flex gap-0 px-2 py-1">
        <WheelColumn
          items={YEARS}
          selected={year}
          onSelect={setYear}
          format={(v) => `${v}年`}
        />
        <WheelColumn
          items={MONTHS}
          selected={month}
          onSelect={setMonth}
          format={(v) => `${v}月`}
        />
        <WheelColumn
          items={days}
          selected={day}
          onSelect={setDay}
          format={(v) => `${v}日`}
        />
      </div>
    </div>
  );
}
