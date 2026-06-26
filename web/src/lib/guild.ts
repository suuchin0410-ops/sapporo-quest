import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Guild {
  id: string;
  title: string;
  description: string;
  date: Timestamp;
  location: string;
  fee: number;
  maxParticipants: number;
  status: "draft" | "published" | "cancelled";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GuildParticipant {
  id: string;
  userId: string;
  displayName: string;
  pictureUrl: string | null;
  joinedAt: Timestamp;
  attended?: boolean;
}

export type GuildInput = {
  title: string;
  description: string;
  date: Date;
  location: string;
  fee: number;
  maxParticipants: number;
  status: "draft" | "published" | "cancelled";
};

const guildsRef = collection(db, "guilds");

export async function createGuild(input: GuildInput): Promise<string> {
  const docRef = await addDoc(guildsRef, {
    ...input,
    date: Timestamp.fromDate(input.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateGuild(
  id: string,
  input: Partial<GuildInput>
): Promise<void> {
  const ref = doc(db, "guilds", id);
  const data: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  };
  if (input.date) {
    data.date = Timestamp.fromDate(input.date);
  }
  await updateDoc(ref, data);
}

export async function deleteGuild(id: string): Promise<void> {
  await deleteDoc(doc(db, "guilds", id));
}

export async function getGuild(id: string): Promise<Guild | null> {
  const snap = await getDoc(doc(db, "guilds", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Guild;
}

export async function listGuilds(
  filter: "all" | "published" = "all"
): Promise<Guild[]> {
  const constraints =
    filter === "published"
      ? [where("status", "==", "published"), orderBy("date", "asc")]
      : [orderBy("date", "asc")];

  const snap = await getDocs(query(guildsRef, ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Guild);
}

export async function listUpcomingGuilds(): Promise<Guild[]> {
  const snap = await getDocs(query(guildsRef, orderBy("date", "asc")));
  const now = Timestamp.now();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Guild)
    .filter((g) => g.status === "published" && g.date >= now);
}

// --- Participants ---

function participantsRef(guildId: string) {
  return collection(db, "guilds", guildId, "participants");
}

export async function joinGuild(
  guildId: string,
  user: { userId: string; displayName: string; pictureUrl: string | null }
): Promise<void> {
  const ref = doc(db, "guilds", guildId, "participants", user.userId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const guild = await getGuild(guildId);
  if (!guild) throw new Error("ギルド会が見つかりません");

  if (guild.maxParticipants > 0) {
    const current = await getParticipants(guildId);
    if (current.length >= guild.maxParticipants) {
      throw new Error("定員に達しています");
    }
  }

  const { setDoc } = await import("firebase/firestore");
  await setDoc(ref, {
    userId: user.userId,
    displayName: user.displayName,
    pictureUrl: user.pictureUrl ?? null,
    joinedAt: serverTimestamp(),
  });
}

export async function leaveGuild(
  guildId: string,
  userId: string
): Promise<void> {
  await deleteDoc(doc(db, "guilds", guildId, "participants", userId));
}

export async function getParticipants(
  guildId: string
): Promise<GuildParticipant[]> {
  const snap = await getDocs(
    query(participantsRef(guildId), orderBy("joinedAt", "asc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GuildParticipant);
}

export async function isParticipant(
  guildId: string,
  userId: string
): Promise<boolean> {
  const snap = await getDoc(
    doc(db, "guilds", guildId, "participants", userId)
  );
  return snap.exists();
}

export async function updateAttendance(
  guildId: string,
  userId: string,
  attended: boolean
): Promise<void> {
  await updateDoc(doc(db, "guilds", guildId, "participants", userId), {
    attended,
  });
}
