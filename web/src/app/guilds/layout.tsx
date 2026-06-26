import { LiffProvider } from "@/providers/LiffProvider";

export default function GuildsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LiffProvider>{children}</LiffProvider>;
}
