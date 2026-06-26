import { LiffProvider } from "@/providers/LiffProvider";

export default function LiffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LiffProvider>{children}</LiffProvider>;
}
