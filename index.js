const { Client, GatewayIntentBits } = require('discord.js');
const readline = require('readline');

// Create a readline interface to read input from the console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt for input from the console
const promptInput = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
};

let token = '';
let dmMessage = '';
let chosenServerIndex = 0;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });

client.once('ready', async () => {
    console.log('Bot is online!\n');

    const guilds = client.guilds.cache;
    let guildList = [];
    let index = 1;

    // Display the server list with details
    for (const [guildId, guild] of guilds) {
        try {
            const owner = await guild.fetchOwner();
            const members = await guild.members.fetch();
            const canDMAll = guild.members.me.permissions.has('ADMINISTRATOR') ? 'yes' : 'no';
            guildList.push({
                index,
                id: guildId,
                name: guild.name,
                owner: owner.user.tag,
                canDMAll,
                memberCount: members.size
            });
            console.log(`${index}. Server: ${guild.name}, Owner: ${owner.user.tag}, Can DM All: ${canDMAll}, Members: ${members.size}`);
            index++;
        } catch (error) {
            console.log(`Failed to fetch details for guild ${guild.name}: ${error}`);
        }
    }

    console.log();  // Adding an extra line for spacing

    chosenServerIndex = parseInt(await promptInput('Enter the number of the server you want to DM all members in: '));

    const chosenGuild = guildList.find(g => g.index === chosenServerIndex);
    if (!chosenGuild) {
        console.log('Invalid server number chosen. Exiting.');
        rl.close();
        client.destroy();
        return;
    }

    console.log();  // Adding an extra line for spacing

    dmMessage = await promptInput(`Enter the message to send to all members in ${chosenGuild.name}: `);

    console.log();  // Adding an extra line for spacing

    const guild = guilds.get(chosenGuild.id);
    const members = await guild.members.fetch();

    let successCount = 0;
    let failureCount = 0;

    for (const member of members.values()) {
        if (!member.user.bot) {
            try {
                await member.send(dmMessage);
                successCount++;
            } catch (err) {
                console.log(`Could not DM ${member.user.tag}`);
                failureCount++;
            }
        }
    }

    console.log(`Message sent to ${successCount} members in ${chosenGuild.name}.`);
    console.log(`Failed to send message to ${failureCount} members.`);
    rl.close();
    client.destroy();
});

const startBot = async () => {
    token = await promptInput('Enter your bot token: ');

    client.login(token).catch(err => {
        console.error('Failed to login. Invalid token provided or network issue.');
        console.error(err);
        rl.close();
    });
};

startBot();
