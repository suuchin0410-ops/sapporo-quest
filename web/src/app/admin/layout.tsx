"use client";

import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/guilds", label: "ギルド会" },
  { href: "/admin/members", label: "メンバー" },
  { href: "/admin/notify", label: "通知" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [path, setPath] = useState("");

  useEffect(() => {
    setPath(window.location.pathname);
  }, []);

  function isActive(href: string) {
    if (href === "/admin") return path === "/admin" || path === "/admin/";
    return path.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-red-100 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex h-14 items-center justify-between">
            <a href="/admin" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="札幌クエスト" className="h-8 w-8" />
              <span className="text-lg font-bold text-stone-900">
                札幌クエスト
                <span className="ml-1.5 text-sm font-normal text-stone-400">管理</span>
              </span>
            </a>
            <nav className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-red-600 text-white"
                      : "text-stone-600 hover:bg-red-50 hover:text-red-700"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
