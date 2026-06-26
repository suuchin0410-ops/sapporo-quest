const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
require("dotenv/config");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once("ready", () => {
  console.log(`Bot ready: ${client.user.tag}`);
});

client.on("guildMemberAdd", async (member) => {
  try {
    const guild = member.guild;

    let role = guild.roles.cache.find(
      (r) => r.name === process.env.DISCORD_ROLE_NAME
    );

    if (!role) {
      role = await guild.roles.create({
        name: process.env.DISCORD_ROLE_NAME,
        color: 0xd4a843,
        reason: "LINE認証連携用ロール",
      });
    }

    await member.roles.add(role);
    console.log(`Role assigned to ${member.user.username}`);

    try {
      await member.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2d8a4e)
            .setTitle("⚔️ ようこそ、ギルドメンバー！")
            .setDescription(
              "札幌クエストの Discord サーバーへようこそ！\n「ギルドメンバー」ロールが付与されました。"
            ),
        ],
      });
    } catch {
      // DM disabled
    }
  } catch (err) {
    console.error("Auto-role error:", err);
  }
});

client.login(process.env.DISCORD_TOKEN);
