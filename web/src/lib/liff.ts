import type liffType from "@line/liff";

let liffInstance: typeof liffType | null = null;
let initPromise: Promise<void> | null = null;

export async function initLiff() {
  if (liffInstance) return;
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    const liffModule = await import("@line/liff");
    const liff = liffModule.default;
    await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
    liffInstance = liff;
  })();

  await initPromise;
}

export function getLiff(): typeof liffType {
  if (!liffInstance) throw new Error("LIFF not initialized");
  return liffInstance;
}
