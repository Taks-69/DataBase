const { Client } = require('discord.js-selfbot-v13');

// Arguments
const TOKEN = process.argv[2];
const CHANNEL_ID = process.argv[3];
const INTERVAL_MINUTES = parseInt(process.argv[4], 10);

let MESSAGE = process.argv.slice(5).join(' ');

MESSAGE = MESSAGE
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\');

// Validation
if (!TOKEN || !CHANNEL_ID || !INTERVAL_MINUTES || !MESSAGE) {
    console.error('Usage: node script.js <token> <channel_id> <interval_minutes> <message>');
    process.exit(1);
}

const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

const client = new Client({
    checkUpdate: false
});

client.on('ready', async () => {
    console.log(`Connecte en tant que ${client.user.tag}`);
    console.log(`Channel: ${CHANNEL_ID} | Intervalle: ${INTERVAL_MINUTES}min`);

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) {
        console.error('Channel introuvable');
        process.exit(1);
    }

    // Envoi immediat
    channel.send(MESSAGE)
        .then(msg => console.log(`[${new Date().toLocaleString()}] Envoye (ID: ${msg.id})`))
        .catch(err => console.error(`[${new Date().toLocaleString()}] Erreur:`, err.message));

    // Boucle
    setInterval(() => {
        channel.send(MESSAGE)
            .then(msg => console.log(`[${new Date().toLocaleString()}] Envoye (ID: ${msg.id})`))
            .catch(err => console.error(`[${new Date().toLocaleString()}] Erreur:`, err.message));
    }, INTERVAL_MS);
});

client.login(TOKEN);