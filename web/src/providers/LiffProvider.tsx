"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Profile } from "@liff/get-profile";
import { initLiff, getLiff } from "@/lib/liff";
import { saveUserToFirestore, type UserData } from "@/lib/user";

interface LiffContextValue {
  profile: Profile | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
}

const LiffContext = createContext<LiffContextValue>({
  profile: null,
  userData: null,
  loading: true,
  error: null,
});

export function useLiff() {
  return useContext(LiffContext);
}

export function LiffProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await initLiff();
        const liff = getLiff();

        if (liff.isLoggedIn()) {
          const p = await liff.getProfile();
          setProfile(p);
          saveUserToFirestore(p).then(setUserData).catch(() => {});
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "LIFF初期化に失敗しました");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <LiffContext.Provider value={{ profile, userData, loading, error }}>
      {children}
    </LiffContext.Provider>
  );
}
