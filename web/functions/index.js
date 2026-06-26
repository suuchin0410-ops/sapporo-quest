const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineString } = require("firebase-functions/params");
const crypto = require("crypto");
const admin = require("firebase-admin");
const { google } = require("googleapis");

admin.initializeApp();
const db = admin.firestore();

const lineChannelAccessToken = defineString("LINE_CHANNEL_ACCESS_TOKEN");
const lineChannelSecret = defineString("LINE_CHANNEL_SECRET");
const registeredRichMenuId = defineString("REGISTERED_RICH_MENU_ID");
const liffId = defineString("LIFF_ID");

function verifySignature(body, signature, secret) {
  const hash = crypto
    .createHmac("SHA256", secret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

async function multicastMessage(token, userIds, messages) {
  for (let i = 0; i < userIds.length; i += 500) {
    const batch = userIds.slice(i, i + 500);
    await fetch("https://api.line.me/v2/bot/message/multicast", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: batch, messages }),
    });
  }
}

async function getAllMemberLineIds() {
  const snap = await db.collection("members").get();
  return snap.docs.map((d) => d.data().lineUserId).filter(Boolean);
}

async function replyMessage(token, replyToken, messages) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ replyToken, messages }),
  });
}

exports.lineWebhook = onRequest(
  { region: "asia-northeast1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const signature = req.headers["x-line-signature"];
    const rawBody =
      typeof req.rawBody === "string"
        ? req.rawBody
        : req.rawBody.toString("utf8");

    if (!verifySignature(rawBody, signature, lineChannelSecret.value())) {
      res.status(403).send("Invalid signature");
      return;
    }

    const body = req.body;
    const token = lineChannelAccessToken.value();

    for (const event of body.events || []) {
      if (event.type === "follow") {
        const userId = event.source.userId;

        // 既に登録済みのユーザーか確認
        const memberSnap = await db.collection("members").doc(userId).get();

        if (memberSnap.exists) {
          // 登録済み → 登録済みリッチメニューをリンク
          await fetch(
            `https://api.line.me/v2/bot/user/${userId}/richmenu/${registeredRichMenuId.value()}`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          await replyMessage(token, event.replyToken, [
            {
              type: "text",
              text: "おかえりなさい、冒険者！\n引き続き札幌クエストをお楽しみください ⚔️",
            },
          ]);
        } else {
          // 未登録 → 登録案内Flexメッセージ
          const registerUrl = `https://liff.line.me/${liffId.value()}?tab=register`;
          await replyMessage(token, event.replyToken, [
            {
              type: "flex",
              altText: "冒険者ギルドへようこそ！まずは冒険者登録をしよう",
              contents: {
                type: "bubble",
                header: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "⚔️ 冒険者ギルドへようこそ！",
                      weight: "bold",
                      size: "lg",
                      color: "#d4a843",
                    },
                  ],
                  backgroundColor: "#1a1a2e",
                  paddingAll: "20px",
                },
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "札幌クエストへの参加ありがとうございます！",
                      size: "sm",
                      color: "#e8d5b0",
                      wrap: true,
                    },
                    {
                      type: "text",
                      text: "まずは冒険者登録をして、仲間に加わりましょう。",
                      size: "sm",
                      color: "#e8d5b0",
                      wrap: true,
                      margin: "md",
                    },
                    {
                      type: "separator",
                      margin: "xl",
                      color: "#3a3a52",
                    },
                    {
                      type: "text",
                      text: "📝 名前・ニックネーム・得意スキルを登録すると、ギルド会予約やスケジュール確認ができるようになります。",
                      size: "xs",
                      color: "#a07830",
                      wrap: true,
                      margin: "xl",
                    },
                  ],
                  backgroundColor: "#1a1a2e",
                  paddingAll: "20px",
                },
                footer: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "button",
                      action: {
                        type: "uri",
                        label: "冒険者登録する",
                        uri: registerUrl,
                      },
                      style: "primary",
                      color: "#d4a843",
                      height: "md",
                    },
                  ],
                  backgroundColor: "#1a1a2e",
                  paddingAll: "15px",
                },
              },
            },
          ]);
        }
      }
    }

    res.status(200).json({ ok: true });
  }
);

exports.linkRegisteredRichMenu = onRequest(
  { region: "asia-northeast1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const lineUserId = req.body.lineUserId;
    if (!lineUserId || typeof lineUserId !== "string") {
      res.status(400).json({ error: "lineUserId is required" });
      return;
    }

    const token = lineChannelAccessToken.value();
    const richMenuId = registeredRichMenuId.value();

    const apiRes = await fetch(
      `https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${richMenuId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!apiRes.ok) {
      const body = await apiRes.text();
      console.error(`LINE API error: ${apiRes.status} ${body}`);
      res.status(500).json({ error: "LINE API error" });
      return;
    }

    res.status(200).json({ success: true });
  }
);

exports.sendNotification = onRequest(
  { region: "asia-northeast1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { message } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const token = lineChannelAccessToken.value();

    // 登録済みメンバーのLINE IDを取得
    const membersSnap = await db.collection("members").get();
    const userIds = membersSnap.docs.map((d) => d.data().lineUserId).filter(Boolean);

    if (userIds.length === 0) {
      res.status(200).json({ success: true, sent: 0 });
      return;
    }

    // LINE multicast API（最大500人ずつ）
    let sent = 0;
    for (let i = 0; i < userIds.length; i += 500) {
      const batch = userIds.slice(i, i + 500);
      const apiRes = await fetch("https://api.line.me/v2/bot/message/multicast", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: batch,
          messages: [{ type: "text", text: message }],
        }),
      });

      if (!apiRes.ok) {
        const errBody = await apiRes.text();
        console.error(`LINE multicast error: ${apiRes.status} ${errBody}`);
        res.status(500).json({ error: "LINE API error", sent });
        return;
      }
      sent += batch.length;
    }

    res.status(200).json({ success: true, sent });
  }
);

exports.generateDiscordCode = onCall(
  { region: "asia-northeast1", invoker: "public" },
  async (request) => {
    const { lineUserId, lineNickname } = request.data;
    if (!lineUserId || !lineNickname) {
      throw new HttpsError(
        "invalid-argument",
        "lineUserId and lineNickname are required"
      );
    }

    // 既存の未使用コードがあれば再利用
    const existing = await db
      .collection("discord_verifications")
      .where("lineUserId", "==", lineUserId)
      .where("used", "==", false)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      const data = doc.data();
      if (data.expiresAt.toMillis() > Date.now()) {
        return { code: data.code, expiresAt: data.expiresAt.toMillis() };
      }
    }

    // 6桁の英数字コードを生成
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }

    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 10 * 60 * 1000
    );

    await db.collection("discord_verifications").add({
      code,
      lineUserId,
      lineNickname,
      used: false,
      createdAt: now,
      expiresAt,
      discordUserId: null,
      discordUsername: null,
      verifiedAt: null,
    });

    return { code, expiresAt: expiresAt.toMillis() };
  }
);

const CALENDAR_ID = "sapporo.quest.ai@gmail.com";

exports.addGuildToCalendar = onRequest(
  { region: "asia-northeast1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { title, description, date, location, fee, maxParticipants } = req.body;
    if (!title || !date) {
      res.status(400).json({ error: "title and date are required" });
      return;
    }

    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/calendar.events"],
    });
    const calendar = google.calendar({ version: "v3", auth });

    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const details = [
      description || "",
      fee > 0 ? `参加費: ¥${Number(fee).toLocaleString()}` : "参加費: 無料",
      maxParticipants > 0 ? `定員: ${maxParticipants}名` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const event = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: {
          summary: title,
          description: details,
          location: location || "",
          start: { dateTime: startDate.toISOString(), timeZone: "Asia/Tokyo" },
          end: { dateTime: endDate.toISOString(), timeZone: "Asia/Tokyo" },
        },
      });
      res.status(200).json({ success: true, eventId: event.data.id });
    } catch (err) {
      console.error("Calendar API error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// --- 新ギルド会作成時のLINE通知 ---
exports.notifyNewGuild = onRequest(
  { region: "asia-northeast1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { title, date, location, fee } = req.body;
    if (!title || !date) {
      res.status(400).json({ error: "title and date are required" });
      return;
    }

    const token = lineChannelAccessToken.value();
    const userIds = await getAllMemberLineIds();
    if (userIds.length === 0) {
      res.status(200).json({ success: true, sent: 0 });
      return;
    }

    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    const feeText = fee > 0 ? `¥${Number(fee).toLocaleString()}` : "無料";
    const liffUrl = `https://liff.line.me/${liffId.value()}?tab=guilds`;

    const message = [
      "📢 新しいギルド会が登録されました！\n",
      `⚔️ ${title}`,
      `📅 ${month}/${day}（${weekday}）${hours}:${minutes}`,
      `📍 ${location}`,
      `💰 ${feeText}\n`,
      `▼ 予約はこちらから`,
      liffUrl,
    ].join("\n");

    await multicastMessage(token, userIds, [{ type: "text", text: message }]);
    res.status(200).json({ success: true, sent: userIds.length });
  }
);

// --- ギルド会前日リマインド（毎朝10時 JST） ---
exports.guildReminder = onSchedule(
  {
    region: "asia-northeast1",
    schedule: "0 10 * * *",
    timeZone: "Asia/Tokyo",
  },
  async () => {
    const token = lineChannelAccessToken.value();

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

    const guildsSnap = await db.collection("guilds").get();
    const tomorrowGuilds = guildsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((g) => {
        if (g.status !== "published") return false;
        const guildDate = g.date.toDate();
        return guildDate >= tomorrow && guildDate < dayAfter;
      });

    if (tomorrowGuilds.length === 0) return;

    const liffUrl = `https://liff.line.me/${liffId.value()}?tab=guilds`;

    for (const guild of tomorrowGuilds) {
      const guildDate = guild.date.toDate();
      const hours = String(guildDate.getHours()).padStart(2, "0");
      const minutes = String(guildDate.getMinutes()).padStart(2, "0");

      // 全メンバーにリマインド
      const memberIds = await getAllMemberLineIds();
      if (memberIds.length === 0) continue;
      const participantIds = memberIds;

      const message = [
        "⚔️ 明日はギルド会の日です！\n",
        `📋 ${guild.title}`,
        `🕐 ${hours}:${minutes}`,
        `📍 ${guild.location}\n`,
        "お忘れなく、お越しください！",
        `\n▼ 詳細はこちら`,
        liffUrl,
      ].join("\n");

      await multicastMessage(token, participantIds, [
        { type: "text", text: message },
      ]);

      console.log(
        `Reminder sent for "${guild.title}" to ${participantIds.length} participants`
      );
    }
  }
);
