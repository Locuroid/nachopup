const server = require('./server.js');
const dotenv = require('dotenv');
const fs = require('fs');
const Discord = require('discord.js');
const { prefix, greeting_channel } = require('./config.json');
const xp = require('./.data/xp.json');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
dotenv.config();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const cooldowns = new Discord.Collection();

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	bot.commands.set(command.name, command);
}

bot.on('ready', () => {
	console.log('NachoPup is here!');
  bot.user.setActivity('&cmd for Commands', { type: 'WATCHING'}).catch(console.error);
});

bot.on('guildCreate', guild => {
	console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

bot.on('guildDelete', guild => {
	console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

bot.on('guildMemberAdd', member =>{

	const channel = member.guild.channels.cache.find(channel => channel.name === greeting_channel);
	if (!channel) return;

	channel.send(`Welcome to server, ${member}! I'm NachoPup! My prefix is ${prefix}. You can get my commands by typing ${prefix}cmd. For support DM @locuroid on twitter.`);
});

bot.on('message', message => {

	if (message.author.bot) return;
  
  /*

	const xpAdd = Math.floor(Math.random() * 7) + 8;

	if(!xp[message.author.id + message.guild.id]) {
		xp[message.author.id + message.guild.id] = {
			xp: 0,
			level: 1,
		};
	}

	const curxp = xp[message.author.id + message.guild.id].xp;
	const curlvl = xp[message.author.id + message.guild.id].level;
	const nxtLvl = xp[message.author.id + message.guild.id].level * 300;
	xp[message.author.id + message.guild.id].xp = curxp + xpAdd;
  
  var name = message.member.nickname;
    
  if (message.member.nickname === null) {
     var name = message.author.username
  };
  
	if(nxtLvl <= xp[message.author.id + message.guild.id].xp) {
		xp[message.author.id + message.guild.id].level = curlvl + 1;
		const lvlup = new Discord.MessageEmbed()
			.setTitle(name + ' leveled Up!')
			.setColor(0x31f74b)
			.addField('New Level', curlvl + 1);

		message.channel.send(lvlup).then(msg => {
            msg.delete({ timeout: 30000 });
        });
	}
	fs.writeFile('./xp.json', JSON.stringify(xp), (err) => {
		if(err) console.log(err);
	});
  
*/

	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();
	const command = bot.commands.get(commandName)
		|| bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;

	if (command.guildOnly && message.channel.type !== 'text') {
		return message.reply('I can\'t execute that command inside DMs!');
	}

	if (command.args && !args.length) {
		return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
	}
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		if (timestamps.has(message.author.id)) {
			const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
			}

			timestamps.set(message.author.id, now);
			setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

		}
	}

	try {
		command.execute(message, args);
	}
	catch (error) {
		console.error(error);
		message.reply('Sorry \'bout that. There was an error executing that command!');
	}

});

bot.login(process.env.DISCORD_TOKEN);