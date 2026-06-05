const { Client } = require("discord.js-selfbot-v13");

const token = process.argv[2];
const message = process.argv[3];

if (!token || !message) {
  console.error("Utilisation : node selfbot.js <token> <message>");
  process.exit(1);
}

const client = new Client();

client.on("ready", () => {
  console.log(`[✓] Connecté en tant que ${client.user.tag}`);
  console.log(`[→] Envoi du message à ${client.users.cache.size} utilisateur(s) ...`);

  let sent = 0;
  let failed = 0;

  for (const [id, user] of client.users.cache) {
    if (user.bot || id === client.user.id) continue;

    user.send(message)
      .then(() => {
        sent++;
        console.log(`[✓] ${user.tag}`);
      })
      .catch(() => {
        failed++;
        console.log(`[✗] ${user.tag}`);
      });
  }

  setTimeout(() => {
    console.log(`\nTerminé – Envoyés : ${sent} | Échecs : ${failed}`);
    client.destroy();
    process.exit(0);
  }, 3000);
});

client.login(token).catch(err => {
  console.error("Erreur de connexion :", err.message);
  process.exit(1);
});