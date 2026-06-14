const { Client } = require('discord.js-selfbot-v13');


// <token> <channelID> [mute] [deaf]
const args = process.argv.slice(2);

const token = args[0];
const channelId = args[1];
const flags = args.slice(2);

if (!token || !channelId) {
    console.error('❌ Usage: node vocal.js <token> <channelID> [mute] [deaf]');
    process.exit(1);
}

const isMute = flags.includes('mute');
const isDeaf = flags.includes('deaf');

const client = new Client();

let voiceInterval = null;

async function joinAndStay() {
    try {
        const voiceChannel = await client.channels.fetch(channelId).catch(() => null);

        if (!voiceChannel) {
            console.error(`❌ Erreur : Salon introuvable (ID: ${channelId})`);
            process.exit(1);
        }
        if (voiceChannel.type !== 'GUILD_VOICE' && voiceChannel.type !== 'GUILD_STAGE_VOICE') {
            console.error(`❌ Erreur : Le salon n'est pas un salon vocal.`);
            process.exit(1);
        }

        console.log(`────────────────────────────────`);
        console.log(`✅ Connecté : ${client.user.tag}`);
        console.log(`🎯 Cible : #${voiceChannel.name} (${channelId})`);
        console.log(`🔧 Paramètres : Mute=${isMute} | Deaf=${isDeaf}`);
        console.log(`────────────────────────────────`);

        await client.voice.joinChannel(voiceChannel, {
            selfMute: isMute,
            selfDeaf: isDeaf,
            selfVideo: false,
        });
        console.log('🔊 Connexion vocale établie.');

        startVoiceLoop(voiceChannel);

    } catch (err) {
        console.error('❌ Erreur critique lors de la connexion:', err.message);
        process.exit(1);
    }
}

function startVoiceLoop(voiceChannel) {
    if (voiceInterval) clearInterval(voiceInterval);

    const CHECK_INTERVAL = 5000;

    voiceInterval = setInterval(async () => {
        try {
            const guild = voiceChannel.guild;
            
            const member = guild.members.cache.get(client.user.id)
                        || await guild.members.fetch(client.user.id).catch(() => null);

            if (!member) return;

            const currentChannelId = member.voice?.channelId;

            if (!currentChannelId) {
                console.log('⚠️ Déconnexion détectée, reconnexion automatique...');
                await client.voice.joinChannel(voiceChannel, {
                    selfMute: isMute,
                    selfDeaf: isDeaf,
                    selfVideo: false,
                });
                console.log('✅ Reconnecté avec succès.');
            }
        } catch (err) {
            console.error('❌ Erreur dans la boucle vocale:', err.message);
        }
    }, CHECK_INTERVAL);
}


client.on('ready', () => {
    joinAndStay();
});

client.on('disconnect', () => {
    console.log('🔌 Déconnecté de Discord.');
    if (voiceInterval) clearInterval(voiceInterval);
});

client.login(token);