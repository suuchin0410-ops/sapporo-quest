import { doc, getDoc, setDoc, getDocs, collection, orderBy, query, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export const SKILLS = [
  "エンジニア",
  "デザイナー",
  "マーケター",
  "ライター",
  "動画クリエイター",
  "フォトグラファー",
  "SNS運用",
  "営業・セールス",
  "経営・マネジメント",
  "コンサルタント",
  "人事・採用",
  "経理・財務",
  "広報・PR",
  "カスタマーサポート",
  "データ分析",
  "プロジェクトマネージャー",
  "教育・講師",
  "飲食・フード",
  "イベント企画",
  "その他",
] as const;

export type Skill = (typeof SKILLS)[number];

export const ATTRIBUTES = ["オモロ", "カシコ"] as const;
export type Attribute = (typeof ATTRIBUTES)[number];

export interface MemberData {
  lineUserId: string;
  name: string;
  nickname: string;
  birthday: string;
  skills: Skill[];
  attribute?: Attribute;
  pictureUrl: string | null;
  registeredAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MemberInput {
  name: string;
  nickname: string;
  birthday: string;
  skills: Skill[];
  attribute: Attribute;
}

export async function listMembers(): Promise<MemberData[]> {
  const snap = await getDocs(query(collection(db, "members"), orderBy("registeredAt", "desc")));
  return snap.docs.map((d) => d.data() as MemberData);
}

export async function getMember(lineUserId: string): Promise<MemberData | null> {
  const snap = await getDoc(doc(db, "members", lineUserId));
  if (!snap.exists()) return null;
  return snap.data() as MemberData;
}

export async function registerMember(
  lineUserId: string,
  input: MemberInput,
  pictureUrl: string | null
): Promise<void> {
  const ref = doc(db, "members", lineUserId);
  const snap = await getDoc(ref);
  const isNewRegistration = !snap.exists();

  const data: Record<string, unknown> = {
    lineUserId,
    name: input.name,
    nickname: input.nickname,
    birthday: input.birthday,
    skills: input.skills,
    attribute: input.attribute,
    pictureUrl,
    updatedAt: serverTimestamp(),
  };

  if (isNewRegistration) {
    data.registeredAt = serverTimestamp();
  }

  await setDoc(ref, data, { merge: true });

  try {
    await fetch(
      "https://asia-northeast1-sapporo-quest-ae36a.cloudfunctions.net/linkRegisteredRichMenu",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId }),
      }
    );
  } catch {
    // リッチメニュー切り替え失敗は登録自体には影響させない
  }
}
