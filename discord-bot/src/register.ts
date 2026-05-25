import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  console.error('Error: DISCORD_TOKEN and DISCORD_CLIENT_ID must be set in .env');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Link your Stellar wallet to get verified and sync your reputation tier'),
    
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription("View your or another user's StellarID reputation profile")
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to view the profile of')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Display the top StellarID reputation scores in the ecosystem'),

  new SlashCommandBuilder()
    .setName('gate')
    .setDescription('Gate this channel so only users with a minimum reputation tier can view')
    .addStringOption(option =>
      option.setName('tier')
        .setDescription('The minimum reputation tier required (Bronze, Silver, Gold, Platinum)')
        .setRequired(true)
        .addChoices(
          { name: 'Bronze', value: 'Bronze' },
          { name: 'Silver', value: 'Silver' },
          { name: 'Gold', value: 'Gold' },
          { name: 'Platinum', value: 'Platinum' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );

    console.log(`Successfully reloaded global application (/) commands.`);
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();
