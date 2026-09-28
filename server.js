const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const http = require("http");

// RenderのWebサービス起動チェック用ミニサーバー
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running!");
}).listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 起動時の確認
client.once("ready", () => {
  console.log(`Botがログインしました: ${client.user.tag}`);
});

// 「!朝活パネル」とチャットで打つとボタン付きパネルを投稿する
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!朝活パネル") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("btn_wake")
        .setLabel("起きた！☀️")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("btn_meal")
        .setLabel("朝ごはん食べた🍳")
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({
      content: "━━━━━━━━━━━━━━━━━━\n**🌅 朝活管理パネル 🌅**\n起きたら・朝ごはんを食べたら下のボタンを押してね！\n━━━━━━━━━━━━━━━━━━",
      components: [row]
    });
  }
});

// ボタンが押されたときの処理
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id; // ★絶対に変わらない固有ID
  const userName = interaction.member?.displayName || interaction.user.username;
  const jstNow = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  let actionName = "";
  let replyMessage = "";

  if (interaction.customId === "btn_wake") {
    actionName = "起床報告";
    replyMessage = `☀️ <@${userId}> さん、おはよう！起床を記録しました。`;
  } else if (interaction.customId === "btn_meal") {
    actionName = "朝ごはん完了";
    replyMessage = `🍳 <@${userId}> さん、朝ごはんナイス！記録しました。`;
  }

  // Discordに返信
  await interaction.reply({ content: `${replyMessage} (${jstNow.split(" ")[1]})` });

  // スプレッドシートにデータ送信
  if (process.env.GAS_URL) {
    try {
      await fetch(process.env.GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: jstNow,
          userId: userId,     // ★IDを追加送信
          userName: userName,
          action: actionName
        })
      });
    } catch (err) {
      console.error("スプレッドシート送信エラー:", err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
