const { Client, GatewayIntentBits } = require("discord.js");

const token = process.argv[2];
const guildIdOrNull = process.argv[3];
const messageContent = process.argv[4];

if (!token || !guildIdOrNull === undefined || !messageContent) {
  console.error("Utilisation : node dm_bot.js <token> <guildId|null> <message>");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,   
    GatewayIntentBits.DirectMessages,
  ],
});

client.once("ready", async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);

  let membersToDM = [];

  if (guildIdOrNull.toLowerCase() === "null") {
    console.log(`📡 Récupération des membres de ${client.guilds.cache.size} serveur(s)...`);
    for (const guild of client.guilds.cache.values()) {
      try {
        const members = await guild.members.fetch();
        members.forEach(member => {
          if (!member.user.bot && member.id !== client.user.id) {
            membersToDM.push(member);
          }
        });
      } catch (err) {
        console.error(`⚠️ Impossible de récupérer les membres de ${guild.name} : ${err.message}`);
      }
    }
  } else {
    const guild = client.guilds.cache.get(guildIdOrNull);
    if (!guild) {
      console.error(`❌ Serveur avec l'ID ${guildIdOrNull} introuvable. Vérifie que le bot est bien dedans.`);
      await client.destroy();
      process.exit(1);
    }
    console.log(`📡 Récupération des membres du serveur : ${guild.name}`);
    try {
      const members = await guild.members.fetch();
      members.forEach(member => {
        if (!member.user.bot && member.id !== client.user.id) {
          membersToDM.push(member);
        }
      });
    } catch (err) {
      console.error(`❌ Erreur lors du fetch des membres : ${err.message}`);
      await client.destroy();
      process.exit(1);
    }
  }

  console.log(`👥 ${membersToDM.length} destinataires trouvés. Envoi des messages...`);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < membersToDM.length; i++) {
    const member = membersToDM[i];
    try {
      await member.send(messageContent);
      sent++;
      console.log(`[${i+1}/${membersToDM.length}] ✓ DM envoyé à ${member.user.tag}`);
    } catch (err) {
      failed++;
      console.log(`[${i+1}/${membersToDM.length}] ✗ Échec pour ${member.user.tag} : ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n🎉 Terminé – Envoyés : ${sent} | Échecs : ${failed}`);
  await client.destroy();
  process.exit(0);
});

client.login(token).catch(err => {
  console.error("❌ Erreur de connexion :", err.message);
  process.exit(1);
});