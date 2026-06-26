const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv/config");

const commands = [
  new SlashCommandBuilder()
    .setName("verify")
    .setDescription("LINE認証コードを入力してギルドメンバーになる")
    .addStringOption((opt) =>
      opt
        .setName("code")
        .setDescription("LINEで発行された6桁の認証コード")
        .setRequired(true)
    ),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  console.log("Registering slash commands...");
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.DISCORD_APP_ID,
      process.env.DISCORD_GUILD_ID
    ),
    { body: commands }
  );
  console.log("Done!");
})();
