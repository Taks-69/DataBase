const { Client } = require('discord.js-selfbot-v13');

// ─── Arguments CLI ────────────────────────────────────────────────
// Usage: node automode.js <token> <channel_id> [bot_id]
const args = process.argv.slice(2);

const TOKEN      = args[0];
const CHANNEL_ID = args[1];
const BOT_ID     = args[2] || '302050872383242240';

if (!TOKEN) {
  console.error('[ERREUR] Token manquant. Usage: autobump.exe <token> <channel_id> [bot_id]');
  process.exit(1);
}
if (!CHANNEL_ID) {
  console.error('[ERREUR] Channel ID manquant. Usage: autobump.exe <token> <channel_id> [bot_id]');
  process.exit(1);
}

console.log(`[CONFIG] Bot ID cible: ${BOT_ID}`);

// ─── Client Discord ───────────────────────────────────────────────
const client = new Client({ checkUpdate: false });
let bumpCount = 1;
let bumpTimeout = null;

function getRandomDelay(minMs, maxMs) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

async function attemptBump(channel) {
  console.log('[INFO] Tentative de bump...');
  channel.sendTyping();
  await channel.sendSlash(BOT_ID, 'bump');
}

async function delayedBump(channel) {
  const delay = getRandomDelay(3000, 300000);
  console.log(`[DELAY] Attente de ${Math.floor(delay / 1000)}s avant bump...`);
  bumpTimeout = setTimeout(() => attemptBump(channel), delay);
}

client.on('ready', async () => {
  console.log(`[READY] Connecté en tant que ${client.user.tag}`);
  const channel = await client.channels.fetch(CHANNEL_ID);
  delayedBump(channel);
});

client.on('messageCreate', async (message) => {
  if (
    message.author.id === BOT_ID &&
    message.channel.id === CHANNEL_ID &&
    message.embeds.length > 0
  ) {
    const description = message.embeds[0]?.description;
    if (!description) return;

    const match = description.match(/encore (\d+) minutes/);
    if (match) {
      const minutes = parseInt(match[1]);
      const ms = minutes * 60 * 1000;
      console.log(`[BUMP REFUSÉ] Il reste ${minutes} min. Prochain bump dans ${minutes} min.`);
      if (bumpTimeout) clearTimeout(bumpTimeout);
      bumpTimeout = setTimeout(async () => {
        const channel = await client.channels.fetch(CHANNEL_ID);
        delayedBump(channel);
      }, ms + 5000);
    } else {
      console.log(`[BUMP OK] Bump #${bumpCount++} confirmé. Prochain dans 2h01.`);
      if (bumpTimeout) clearTimeout(bumpTimeout);
      bumpTimeout = setTimeout(async () => {
        const channel = await client.channels.fetch(CHANNEL_ID);
        delayedBump(channel);
      }, 7260000);
    }
  }
});

client.on('error', console.error);

client.login(TOKEN);

process.on('SIGINT', () => {
  if (bumpTimeout) clearTimeout(bumpTimeout);
  client.destroy();
  console.log('[EXIT] Client détruit. Script terminé.');
  process.exit();
});

process.on('SIGTERM', () => {
  if (bumpTimeout) clearTimeout(bumpTimeout);
  client.destroy();
  console.log('[EXIT] SIGTERM reçu. Client détruit.');
  process.exit();
});