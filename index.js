const { Client, Intents } = require('discord.js');
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
  });
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const mongoose = require('mongoose');

// Connessione al database MongoDB
mongoose.connect('mongodb+srv://bot23:W9mLdowH5ssNkpzu@cluster0.hh5tu7e.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Database connesso'))
  .catch((err) => console.log(err));

// Schema per il punteggio dei membri
const memberSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  score: { type: Number, default: 0 }
});

// Modello per il punteggio dei membri
const Member = mongoose.model('Member', memberSchema);

// Evento ready del bot
client.on('ready', () => {
  console.log(`Bot avviato come ${client.user.tag}`);
});

// Evento message del bot
client.on('messageCreate', async (message) => {
  if (!message.author.bot) {
    // Trova il membro nel database o crealo se non esiste
    const member = await Member.findOne({ id: message.author.id });
    if (!member) {
      const newMember = new Member({
        id: message.author.id,
        name: message.author.username
      });
      await newMember.save();
    } else {
      // Aggiorna il punteggio del membro
      member.score += 1;
      await member.save();
    }
  }
});

// Comando slash per visualizzare il punteggio di un membro
const scoreCommand = new SlashCommandBuilder()
  .setName('score')
  .setDescription('Visualizza il tuo punteggio o quello di un altro membro')
  .addUserOption(option => option.setName('user').setDescription('Membro da cercare'));

// Funzione per eseguire il comando /score
async function scoreCommandHandler(interaction) {
  const user = interaction.options.getUser('user') || interaction.user;
  const member = await Member.findOne({ id: user.id });
  if (!member) {
    await interaction.reply('Non ho trovato il punteggio del membro');
  } else {
    await interaction.reply(`Il punteggio di ${member.name} è ${member.score}`);
  }
}

// Aggiungi il comando slash al bot
const commands = [scoreCommand.toJSON()];
const rest = new REST({ version: '9' }).setToken('BOT_TOKEN');

(async () => {
  try {
    console.log('Inizio la registrazione dei comandi.');

    await rest.put(
      Routes.applicationCommands('1094965014655418468'),
      { body: commands },
    );

    console.log('Comandi registrati con successo!');
  } catch (error) {
    console.error(error);
  }
})();

// Gestione dei comandi slash
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  if (commandName === 'score') {
    await scoreCommandHandler(interaction);
  } else {
    await interaction.reply('Comando sconosciuto');
  }
});

// Avvio del bot
client.login('BOT_TOKEN')
