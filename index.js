require('dotenv').config();
const { joinVoiceChannel, entersState } = require('@discordjs/voice');
const Discord = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');


const { DISCORD_TOKEN } = process.env;
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
    ]
});

const nerd = 'https://ih0.redbubble.net/image.3523762305.5103/raf,360x360,075,t,fafafa:ca443f4786.jpg';

const prefix = 'ugh!';

let isTalking = false;
let channel = null;
let currentConnection = null;
let dispatcher = null;
let target = null;
let onOff = true;


const Commands = {
    'target': {
        help: 'Set the victim of the bot. Usage: ugh!target @<UserName>',
        execute: async (message) => {
            const member = message.mentions.members.first();
            if (!member) {
                message.reply('Mention a valid user.')
            } else {
                // target = user.id;
                checkMemberInVoice(message, member);
            }
        }
    }, 'stop': {
        help: 'Turn Donnie off.',
        execute: () => {
            if (currentConnection) {
                voiceConnection.destroy();
            }
            onOff = false;
        }
    },
    'start': {
        help: 'Turn Donnie on. ;)',
        execute: () => {
            onOff = true;
            checkForUserInVoice();
        }
    },
    'help': {
        help: 'List commands for donnie.',
        execute: (message) => {
            const helpMessage = new Discord.EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Ugh-Bot Help Page')
                .setAuthor({ name: 'ugh-bot', iconURL: client.user.avatarURL(), url: 'https://github.com/recalldude/augh-snoring-bot' })
                .setDescription('✨A bot to have a true moment of complicity and friendship !✨')
                .setThumbnail(nerd)
                .addFields(
                    { name: '\u200B', value: '\u200B' },
                    ...Object.keys(Commands).map(key => {
                        return { name: `${prefix}${key}`, value: `${Commands[key].help}` }
                    }))
            message.reply({ embeds: [helpMessage] });
        }
    },
    'dev': {
        help: 'a command for dev testing',
        execute: (message) => {
            const user = message.mentions.parsedUsers.first();
            if (!user) {
                message.reply('Mention a valid user.')
            } else {
                message.reply(user.first().username)
            }
        }
    }
}


const checkMemberInVoice = async (message, member) => {
    const voiceChannel = member.voice.channel
    if (!voiceChannel) {
        await message.reply('not connected');
        return;
    }
    try{
        if(currentConnection){
            currentConnection.destroy();
            currentConnection = null;
        };

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        await entersState(connection, 'ready', 5000);

        currentConnection = connection;

    } catch(error) {
        console.error(`Error joining voice channel: ${error}`);
        await message.reply('Failed to join the voice channel.');
    }
};
    // let voiceChannels = client.channels.cache.filter(c => c.type === 'VoiceChannel');
    // for(const [key, value] of voiceChannels) {
    //     if(value.members.has(target)) {
    //         message.reply('user spotted')
    //         // channel = value;
    //         // channel.join().then(connection => voiceConnection = connection);
    //         // return;
    //     } else {
    //         message.reply('not connected')
    //     }
    // }
    // if(voiceConnection) {
    //     voiceConnection.disconnect();
    // }


// client.on(Discord.Events.MessageCreate, (message) => {
// 	let content = message.content;
// 	if (content.startsWith(prefix)) {
// 		let cmd = content.substr(prefix.length).split(' ')[0];
// 		if (Commands[cmd]) {
// 			Commands[cmd].execute(message);
// 		} else {
// 			message.reply('Command not found, use "don!help" to see commands.');
// 		}
// 	}
// });

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (oldState.id === target && newState.id === target && onOff) {
        if (oldState.channelID === null) {
            channel = await Client.channels.fetch(newState.channelID);
            channel.join().then((connection) => {
                voiceConnection = connection;
            });
        }
        if (oldState.channelID != null && newState.channel === null && voiceConnection != null) {
            channel.leave();
        }
        if (oldState.channelID != null && newState.channel != null) {
            channel = await Client.channels.fetch(newState.channelID);
            channel.join().then((connection) => {
                voiceConnection = connection;
            });
        }
    }
});

const play = (connection) => {
    dispatcher = connection.play('./ughh-mower.mp3')
        .on('finish', () => {
            if (isTalking) {
                play(connection)
            }
        });
};

client.on('guildMemberSpeaking', (member, speaking) => {
    if (member.id === target) {
        if (speaking.bitfield === 1 && voiceConnection.speaking.bitfield === 0) {
            play(voiceConnection);
            isTalking = true;
        }
        if (speaking.bitfield === 0) {
            dispatcher.end();
            isTalking = false;
        }
    }
});

client.on(Discord.Events.MessageCreate, async (message) => {
    const content = message.content
    if (content.startsWith(prefix)) {
        const cmd = content.replaceAll(prefix, '').split(' ')[0]
        if (Commands[cmd]) {
            Commands[cmd].execute(message);
        } else (
            message.channel.send(`Command not find. Type ${prefix}help to see the existants ones.`)
        )
    }
})

client.once(Discord.Events.ClientReady, () => {
    console.log(`Ready !`);
});




client.login(DISCORD_TOKEN);
