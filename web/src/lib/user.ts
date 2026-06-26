import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { Profile } from "@liff/get-profile";

export interface UserData {
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  statusMessage: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export async function saveUserToFirestore(profile: Profile): Promise<UserData> {
  const userRef = doc(db, "users", profile.userId);
  const snap = await getDoc(userRef);

  const data: Record<string, unknown> = {
    lineUserId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl ?? null,
    statusMessage: profile.statusMessage ?? null,
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    data.createdAt = serverTimestamp();
  }

  await setDoc(userRef, data, { merge: true });

  return {
    lineUserId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl ?? null,
    statusMessage: profile.statusMessage ?? null,
    createdAt: snap.exists() ? snap.data().createdAt : null,
    updatedAt: null,
  };
}
