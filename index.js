require('dotenv').config();
const Discord = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');


const { DISCORD_TOKEN } = process.env;
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        // Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
    ]
});


const prefix = 'ugh!';

let isTalking = false;
let channel = null;
let voiceConnection = null;
let dispatcher = null;
let target = null;
let onOff = true;


const Commands = {
    'target': {
        help: 'Set the victim of the bot. Usage: ugh!target @<UserName>',
        execute: async (message) => {
            if(message.mention.users.size < 1) {
                message.reply('Mention a valid user.') 
            } else {
                target = message.mention.users.first().id;
                checkUserInVoice();
            }
        }
    },'stop': {
		help: 'Turn Donnie off.',
		execute: () => {
			if (voiceConnection) {
				voiceConnection.disconnect();
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
			let helpMessage = new Discord.MessageEmbed()
			.setTitle('Donnie Bot Help');

			for (key in Commands) {
				helpMessage.addField(`${prefix}${key}`, Commands[key].help);
			}
			message.reply(helpMessage);
		}
	},
}


const checkUserInVoice = () => {
    let voiceChannels = client.channels.cache.filter(c => c.type === 'voice');

    for(const [key, value] of voiceChannels) {
        if(value.members.has(target)) {
            channel = value;
            channel.join().then(connection => voiceConnection = connection);
            return;
        }
    }
    if(voiceConnection) {
        voiceConnection.disconnect();
    }
};

client.on(Discord.Events.MessageCreate, (message) => {
	let content = message.content;
	if (content.startsWith(prefix)) {
		let cmd = content.substr(prefix.length).split(' ')[0];
		if (Commands[cmd]) {
			Commands[cmd].execute(message);
		} else {
			message.reply('Command not found, use "don!help" to see commands.');
		}
	}
});

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

client.once(Discord.Events.ClientReady, () => {
    console.log(`Ready !`);
});




client.login(DISCORD_TOKEN);
