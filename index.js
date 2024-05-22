const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

// Config dosyasını yükleme
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites
    ]
});

client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);

   
    const guilds = client.guilds.cache.map(guild => guild);
    for (const guild of guilds) {
        const invites = await guild.invites.fetch();
        invites.each(invite => {
            inviteTracker[invite.code] = invite.uses;
        });
    }
});

const inviteTracker = {};

client.on('inviteCreate', async invite => {
    inviteTracker[invite.code] = invite.uses;
});


client.on('inviteDelete', invite => {
    delete inviteTracker[invite.code];
});


client.on('guildMemberAdd', async member => {
    const newInvites = await member.guild.invites.fetch();
    const usedInvite = newInvites.find(inv => inviteTracker[inv.code] < inv.uses);
    inviteTracker[usedInvite.code] = usedInvite.uses;

    const inviter = usedInvite.inviter;
    const role = member.guild.roles.cache.get(config.roleId);
    if (inviter && role) {
        const inviterMember = await member.guild.members.fetch(inviter.id);
        if (inviterMember) {
            inviterMember.roles.add(role)
                .then(() => {
                    const channel = member.guild.channels.cache.get(config.channelId);
                    if (channel) {
                        channel.send(`${inviter} kişisine ${role.name} rolü verildi!`);
                    }
                })
                .catch(console.error);
        }
    }
});

client.login(config.token);
