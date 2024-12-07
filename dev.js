require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');

// Initialisiere den Client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Datenbank-Ersatz für Benutzerkonten und Shop
const konten = {};
const shopItems = {
    'Führerschein': { preis: 1000,bescschreibung: 'Führerschein'},
    'Waffeschein': { preis: 10000,bescschreibung: 'Waffenschein'},
};

// Definiere die Slash-Commands
const commands = [
    {
        name: 'konto',
        description: 'Zeigt deinen Kontostand an.',
    },
    {
        name: 'arbeit',
        description: 'Verdiene etwas Geld durch Arbeit.',
    },
    {
        name: 'shop',
        description: 'Zeigt verfügbare Gegenstände im Shop an.',
    },
    {
        name: 'kaufen',
        description: 'Kaufe einen Gegenstand aus dem Shop.',
        options: [
            {
                name: 'item',
                type: 3, // STRING
                description: 'Der Name des zu kaufenden Gegenstands',
                required: true,
            },
        ],
    },
];

// Registriere die Slash-Commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registriere Slash-Commands...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
            body: commands,
        });
        console.log('Slash-Commands erfolgreich registriert.');
    } catch (error) {
        console.error(error);
    }
})();

// Event-Listener für den Bot
client.once('ready', () => {
    console.log(`Eingeloggt als ${client.user.tag}!`);
});

// Event-Handler für Slash-Commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const userId = interaction.user.id;
    if (!konten[userId]) {
        konten[userId] = { balance: 0, items: [] };
    }

    if (interaction.commandName === 'konto') {
        const kontoEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('💰 Dein Kontostand')
            .setDescription(`Du hast ${konten[userId].balance} Münzen.`)
            .setFooter({ text: `Angefordert von ${interaction.user.tag}` });

        await interaction.reply({ embeds: [kontoEmbed] });
    }

    if (interaction.commandName === 'arbeit') {
        const verdienst = Math.floor(Math.random() * 50) + 10;
        konten[userId].balance += verdienst;

        await interaction.reply(`💼 Du hast gearbeitet und ${verdienst} Münzen verdient!`);
    }

    if (interaction.commandName === 'shop') {
        const shopEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🛒 Shop')
            .setDescription('Hier sind die verfügbaren Gegenstände:');

        for (const item in shopItems) {
            shopEmbed.addFields({
                name: `${item.charAt(0).toUpperCase() + item.slice(1)} - ${shopItems[item].preis} Münzen`,
                value: shopItems[item].beschreibung,
            });
        }

        await interaction.reply({ embeds: [shopEmbed] });
    }

    if (interaction.commandName === 'kaufen') {
        const itemName = interaction.options.getString('item').toLowerCase();

        if (!shopItems[itemName]) {
            await interaction.reply(`❌ Der Gegenstand "${itemName}" existiert nicht im Shop.`);
            return;
        }

        const itemPreis = shopItems[itemName].preis;

        if (konten[userId].balance < itemPreis) {
            await interaction.reply(`❌ Du hast nicht genug Münzen, um "${itemName}" zu kaufen.`);
            return;
        }

        konten[userId].balance -= itemPreis;
        konten[userId].items.push(itemName);

        await interaction.reply(`✅ Du hast "${itemName}" für ${itemPreis} Münzen gekauft!`);
    }
});

// Bot einloggen
client.login(process.env.DISCORD_TOKEN);
