/**
 * リッチメニューセットアップスクリプト（タブ切り替え対応）
 *
 * 使い方:
 *   # .env を読み込んで実行
 *   source .env && node setup-richmenu.js <command> [args]
 *
 * コマンド:
 *   create-unregistered [image]        未登録用メニュー作成
 *   create-main [image]                メインメニュー作成（タブ付き）
 *   create-sub [image]                 サブメニュー作成（タブ付き）
 *   setup-tabs <mainId> <subId>        エイリアス作成＆タブ切り替え有効化
 *   setup-all <mainImg> <subImg>       メイン＋サブ作成→エイリアス設定を一括実行
 *   link-users <richMenuId>            全メンバーにリッチメニューをリンク
 *   set-default <richMenuId>           デフォルトに設定
 *   list                               一覧表示
 *   list-aliases                        エイリアス一覧
 *   delete-alias <aliasId>             エイリアス削除
 */

const fs = require("fs");
const path = require("path");

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("Error: LINE_CHANNEL_ACCESS_TOKEN is required");
  process.exit(1);
}

const LIFF_URL = "https://liff.line.me";
const LIFF_ID = process.env.LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID;
const HOSTING_URL = "https://sapporo-quest-ae36a.web.app";

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

const MAIN_ALIAS = "richmenu-alias-main";
const SUB_ALIAS = "richmenu-alias-sub";

// タブバー高さ: 300px, コンテンツ各行: 693px (300+693+693=1686)
const TAB_H = 300;
const ROW_H = 693;
const HALF_W = 1250;

// -- 未登録ユーザー用リッチメニュー --
const unregisteredMenu = {
  size: { width: 2500, height: 843 },
  selected: true,
  name: "未登録ユーザー用",
  chatBarText: "メニュー",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 2500, height: 843 },
      action: {
        type: "uri",
        label: "冒険者登録",
        uri: `${LIFF_URL}/${LIFF_ID}?tab=register`,
      },
    },
  ],
};

// -- メインメニュー（タブ付き） --
const mainMenu = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: "メインメニュー",
  chatBarText: "メニュー",
  areas: [
    // タブ: メイン（アクティブ → 自分自身に切り替え = noop）
    {
      bounds: { x: 0, y: 0, width: HALF_W, height: TAB_H },
      action: {
        type: "richmenuswitch",
        richMenuAliasId: MAIN_ALIAS,
        data: "tab-main",
      },
    },
    // タブ: サブ → サブメニューに切り替え
    {
      bounds: { x: HALF_W, y: 0, width: HALF_W, height: TAB_H },
      action: {
        type: "richmenuswitch",
        richMenuAliasId: SUB_ALIAS,
        data: "tab-sub",
      },
    },
    // コンテンツ: ギルド会予約
    {
      bounds: { x: 0, y: TAB_H, width: HALF_W, height: ROW_H },
      action: {
        type: "uri",
        label: "ギルド会予約",
        uri: `${LIFF_URL}/${LIFF_ID}?tab=guilds`,
      },
    },
    // コンテンツ: マイページ
    {
      bounds: { x: HALF_W, y: TAB_H, width: HALF_W, height: ROW_H },
      action: {
        type: "uri",
        label: "マイページ",
        uri: `${LIFF_URL}/${LIFF_ID}?tab=mypage`,
      },
    },
    // コンテンツ: Discord
    {
      bounds: { x: 0, y: TAB_H + ROW_H, width: HALF_W, height: ROW_H },
      action: {
        type: "uri",
        label: "Discord",
        uri: `${LIFF_URL}/${LIFF_ID}?tab=discord`,
      },
    },
    // コンテンツ: メンバー一覧
    {
      bounds: { x: HALF_W, y: TAB_H + ROW_H, width: HALF_W, height: ROW_H },
      action: {
        type: "uri",
        label: "メンバー一覧",
        uri: `${LIFF_URL}/${LIFF_ID}?tab=members`,
      },
    },
  ],
};

// -- サブメニュー（タブ付き） --
const subMenu = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: "サブメニュー",
  chatBarText: "メニュー",
  areas: [
    // タブ: メイン → メインメニューに切り替え
    {
      bounds: { x: 0, y: 0, width: HALF_W, height: TAB_H },
      action: {
        type: "richmenuswitch",
        richMenuAliasId: MAIN_ALIAS,
        data: "tab-main",
      },
    },
    // タブ: サブ（アクティブ → 自分自身 = noop）
    {
      bounds: { x: HALF_W, y: 0, width: HALF_W, height: TAB_H },
      action: {
        type: "richmenuswitch",
        richMenuAliasId: SUB_ALIAS,
        data: "tab-sub",
      },
    },
    // コンテンツ: 公式ホームページ
    {
      bounds: { x: 0, y: TAB_H, width: HALF_W, height: ROW_H },
      action: {
        type: "uri",
        label: "公式ホームページ",
        uri: HOSTING_URL,
      },
    },
    // コンテンツ: YouTube
    {
      bounds: { x: HALF_W, y: TAB_H, width: HALF_W, height: ROW_H },
      action: {
        type: "uri",
        label: "YouTube",
        uri: "https://www.youtube.com/@SapporoQuest",
        // ✅ confirmed
      },
    },
    // コンテンツ: スケジュール
    {
      bounds: { x: 0, y: TAB_H + ROW_H, width: HALF_W, height: ROW_H },
      action: {
        type: "uri",
        label: "スケジュール",
        uri: "https://calendar.google.com/calendar/embed?src=sapporo.quest.ai%40gmail.com&ctz=Asia%2FTokyo",
      },
    },
    // コンテンツ: 利用規約
    {
      bounds: { x: HALF_W, y: TAB_H + ROW_H, width: HALF_W, height: ROW_H },
      action: {
        type: "uri",
        label: "利用規約",
        uri: `${HOSTING_URL}/terms`,
      },
    },
  ],
};

// ── helpers ──

async function createRichMenu(menuData, imagePath) {
  const createRes = await fetch("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers,
    body: JSON.stringify(menuData),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error("Failed to create rich menu:", err);
    process.exit(1);
  }

  const { richMenuId } = await createRes.json();
  console.log("Created rich menu:", richMenuId);

  if (imagePath) {
    const imageData = fs.readFileSync(path.resolve(imagePath));
    const ext = path.extname(imagePath).toLowerCase();
    const contentType = ext === ".png" ? "image/png" : "image/jpeg";

    const uploadRes = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": contentType,
        },
        body: imageData,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("Failed to upload image:", err);
      process.exit(1);
    }
    console.log("Image uploaded successfully");
  }

  return richMenuId;
}

async function createAlias(aliasId, richMenuId) {
  // まず既存エイリアスの削除を試みる
  await fetch(`https://api.line.me/v2/bot/richmenu/alias/${aliasId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  const res = await fetch("https://api.line.me/v2/bot/richmenu/alias", {
    method: "POST",
    headers,
    body: JSON.stringify({ richMenuAliasId: aliasId, richMenuId }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Failed to create alias ${aliasId}:`, err);
    process.exit(1);
  }
  console.log(`Alias created: ${aliasId} → ${richMenuId}`);
}

async function setDefault(richMenuId) {
  const res = await fetch(
    `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Failed to set default:", err);
    process.exit(1);
  }
  console.log("Default rich menu set to:", richMenuId);
}

async function linkUsers(richMenuId) {
  const { initializeApp, cert } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");

  const serviceAccountPath = path.resolve(__dirname, "serviceAccountKey.json");
  if (!fs.existsSync(serviceAccountPath)) {
    console.error("serviceAccountKey.json not found in functions/");
    process.exit(1);
  }

  initializeApp({ credential: cert(require(serviceAccountPath)) });
  const db = getFirestore();

  const snapshot = await db.collection("members").get();
  const userIds = snapshot.docs.map((doc) => doc.id);
  console.log(`Linking ${userIds.length} users to ${richMenuId}...`);

  let ok = 0;
  let fail = 0;
  for (const uid of userIds) {
    const res = await fetch(
      `https://api.line.me/v2/bot/user/${uid}/richmenu/${richMenuId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}` },
      }
    );
    if (res.ok) {
      ok++;
    } else {
      fail++;
      console.error(`  Failed for ${uid}: ${await res.text()}`);
    }
  }
  console.log(`Done: ${ok} linked, ${fail} failed`);
}

async function listMenus() {
  const res = await fetch("https://api.line.me/v2/bot/richmenu/list", {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

async function listAliases() {
  const res = await fetch("https://api.line.me/v2/bot/richmenu/alias/list", {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

async function deleteAlias(aliasId) {
  const res = await fetch(
    `https://api.line.me/v2/bot/richmenu/alias/${aliasId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  );
  if (!res.ok) {
    const err = await res.text();
    console.error("Failed to delete alias:", err);
    process.exit(1);
  }
  console.log("Alias deleted:", aliasId);
}

// ── main ──

async function main() {
  const [, , command, arg1, arg2] = process.argv;

  switch (command) {
    case "create-unregistered":
      await createRichMenu(unregisteredMenu, arg1);
      break;

    case "create-main":
      await createRichMenu(mainMenu, arg1);
      break;

    case "create-sub":
      await createRichMenu(subMenu, arg1);
      break;

    case "setup-tabs": {
      if (!arg1 || !arg2) {
        console.error("Usage: setup-tabs <mainRichMenuId> <subRichMenuId>");
        process.exit(1);
      }
      await createAlias(MAIN_ALIAS, arg1);
      await createAlias(SUB_ALIAS, arg2);
      console.log("\n✅ タブ切り替え設定完了");
      console.log("   メインメニューのエイリアス:", MAIN_ALIAS);
      console.log("   サブメニューのエイリアス:", SUB_ALIAS);
      break;
    }

    case "setup-all": {
      if (!arg1 || !arg2) {
        console.error(
          "Usage: setup-all <mainImage> <subImage>"
        );
        process.exit(1);
      }
      console.log("=== Step 1: メインメニュー作成 ===");
      const mainId = await createRichMenu(mainMenu, arg1);

      console.log("\n=== Step 2: サブメニュー作成 ===");
      const subId = await createRichMenu(subMenu, arg2);

      console.log("\n=== Step 3: エイリアス設定 ===");
      await createAlias(MAIN_ALIAS, mainId);
      await createAlias(SUB_ALIAS, subId);

      console.log("\n=== Step 4: ユーザーにリンク ===");
      await linkUsers(mainId);

      console.log("\n✅ 全セットアップ完了!");
      console.log("   メインメニューID:", mainId);
      console.log("   サブメニューID:", subId);
      console.log(
        "\n   .env の REGISTERED_RICH_MENU_ID を更新してください:",
        mainId
      );
      break;
    }

    case "link-users":
      if (!arg1) {
        console.error("Usage: link-users <richMenuId>");
        process.exit(1);
      }
      await linkUsers(arg1);
      break;

    case "set-default":
      if (!arg1) {
        console.error("Usage: set-default <richMenuId>");
        process.exit(1);
      }
      await setDefault(arg1);
      break;

    case "list":
      await listMenus();
      break;

    case "list-aliases":
      await listAliases();
      break;

    case "delete-alias":
      if (!arg1) {
        console.error("Usage: delete-alias <aliasId>");
        process.exit(1);
      }
      await deleteAlias(arg1);
      break;

    default:
      console.log("Commands:");
      console.log("  create-unregistered [image]        未登録用メニュー作成");
      console.log("  create-main [image]                メインメニュー作成（タブ付き）");
      console.log("  create-sub [image]                 サブメニュー作成（タブ付き）");
      console.log("  setup-tabs <mainId> <subId>        エイリアス設定");
      console.log(
        "  setup-all <mainImg> <subImg>       一括セットアップ"
      );
      console.log("  link-users <richMenuId>            全メンバーにリンク");
      console.log("  set-default <richMenuId>           デフォルト設定");
      console.log("  list                               メニュー一覧");
      console.log("  list-aliases                       エイリアス一覧");
      console.log("  delete-alias <aliasId>             エイリアス削除");
  }
}

main();
